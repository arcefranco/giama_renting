import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {useParams} from 'react-router-dom';
import {getVehiculosById, getCostosPeriodo, 
getAlquileresPeriodo, getAmortizacion} from '../../../reducers/Vehiculos/vehiculosSlice'
import {getModelos} from '../../../reducers/Generales/generalesSlice'
import { getEstadoVehiculoSpan } from '../../../utils/getEstadoVehiculoSpan';
import styles from './FichaVehiculo.module.css'
import { getTodayDate } from '../../../helpers/getTodayDate';

const FichaVehiculo = () => {
const {id, anio, mes} = useParams()
const dispatch = useDispatch()
const [form, setForm] = useState({
    id_vehiculo: id,
    mes: mes ? mes : "",
    anio: anio ? anio : ""
})
useEffect(() => {
Promise.all([
    dispatch(getVehiculosById({id: id, fecha: getTodayDate()})),
    dispatch(getAmortizacion({id: id})),
    dispatch(getModelos()),
    dispatch(getAlquileresPeriodo(form)),
    dispatch(getCostosPeriodo(form))
])
},[])
const nombresMeses = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
];
const generarPeriodos = () => {
  const hoy = new Date();
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 6); // seis meses adelante
  const inicio = new Date(2025, 0); // enero 2025
  const periodos = [];

  while (fin >= inicio) {
    periodos.push({
      mes: fin.getMonth() + 1,
      anio: fin.getFullYear(),
      nombreMes: nombresMeses[fin.getMonth()]
    });
    fin.setMonth(fin.getMonth() - 1);
  }

  return periodos;
};
const periodos = generarPeriodos();


const { vehiculo, isError, isSuccess, isLoading, message, fichaCostos,
fichaAlquileres, amortizacion, amortizacion_todos_movimientos } = useSelector(state => state.vehiculosReducer);
const { modelos } = useSelector(state => state.generalesReducer);
const [filas, setFilas] = useState([])
const [totalImporte, setTotalImporte] = useState(null)
useEffect(() => {
  const filas = [];

  if (fichaAlquileres?.length) {
    const totalDias = fichaAlquileres.reduce((acc, a) => acc + a.dias_en_mes, 0);
    const totalNeto = fichaAlquileres.reduce((acc, a) => acc + parseFloat(a.importe_neto), 0);
/*  const totalIva = fichaAlquileres.reduce((acc, a) => acc + parseFloat(a.importe_iva), 0); */

    filas.push({
      concepto: `Alquiler (${totalDias} días)`,
      importe: Math.round(totalNeto)
    });
/*  filas.push({
      concepto: `IVA`,
      importe: totalIva
    }); */
  }

  if (fichaCostos?.length) {
    fichaCostos.forEach(c => {
      filas.push({
        concepto: c.nombre,
        importe: Math.round(parseFloat(c["SUM(costos_ingresos.importe_neto)"]))
      });
    });
  }
  if(vehiculo?.length && form["mes"] && form["anio"]){
    filas.push({
      concepto: `Amortización ${periodos.find(({ mes, anio, nombreMes }) => form["mes"] == mes)?.nombreMes} ${form["anio"]}`,
      importe: Math.round(amortizacion * (-1)) // * (-1) para que sean negativos
    })}
  else if(vehiculo?.length && !form["mes"] && !form["anio"]){
    filas.push({
      concepto: `Amortización ${vehiculo[0]["dias_diferencia"]} dias`,
      importe: Math.round(amortizacion_todos_movimientos * (-1)) // * (-1) para que sean negativos
    })
  }
  

  setFilas(filas);
  setTotalImporte(Math.round(filas.reduce((acc, fila) => acc + parseFloat(fila.importe), 0)))
}, [fichaAlquileres, fichaCostos, vehiculo])
useEffect(() => {
    Promise.all([
        dispatch(getCostosPeriodo(form)),
        dispatch(getAlquileresPeriodo(form))
    ])
}, [form["mes"], form["anio"]])
  return (
    <div className={styles.container}>
    <h2>Ficha del vehículo: </h2>
    {
        vehiculo?.length &&
    <h2 style={{display: "flex", alignItems: "center"}}>
    {vehiculo[0]?.dominio} - {modelos.find(e => e.id === vehiculo[0]?.modelo)?.nombre}{" "}
      - {vehiculo[0]?.color} - {vehiculo && getEstadoVehiculoSpan(vehiculo[0])}</h2>
    }
    <div className={styles.select}>
    <span>Período: </span>
  <select
    value={form.mes && form.anio ? `${form.mes}-${form.anio}` : ""}
    onChange={(e) => {
      const [mes, anio] = e.target.value.split("-");
      setForm({
        ...form,
        mes: parseInt(mes) || "",
        anio: parseInt(anio) || "",
      });
    }}
  >
    <option value="">Todos los movimientos</option>
    {periodos.map(({ mes, anio, nombreMes }) => (
      <option key={`${mes}-${anio}`} value={`${mes}-${anio}`}>
        {`${nombreMes} ${anio}`}
      </option>
    ))}
  </select>
  <div className={styles.fichaWrapper}>
  <span style={{
    "float": "right",
    "margin": "2px",
    "font-size": "11px"
  }}>* Valores netos de IVA</span>
  <table className={styles.fichaTabla}>
<thead>
  <tr>
    <th>Concepto</th>
    <th className={styles.importeAlignRight}>Importe</th>
  </tr>
</thead>
<tbody>
  {filas?.map((fila, i) => {
    const esPositivo = fila.importe >= 0; //tiene que entrar en negativo o no?
    const estilo = {
      color: esPositivo ? "green" : "red",
      fontWeight: 500
    };
    const importeFormateado = esPositivo
      ? fila.importe?.toLocaleString("es-AR"/* , { minimumFractionDigits: 2, maximumFractionDigits: 2 } */)
      : `(${Math.abs(fila.importe).toLocaleString("es-AR"/* , { minimumFractionDigits: 2, maximumFractionDigits: 2 } */)})`;

    return (
      <tr key={i}>
        <td>{fila.concepto}</td>
        <td className={styles.importeAlignRight} style={estilo}>{importeFormateado}</td>
      </tr>
    );
  })}
</tbody>
  </table>
</div>
<div className={styles.totalResumen}>
  <strong>Total: </strong>
  <span style={{
    color: totalImporte >= 0 ? 'green' : 'red',
    fontWeight: 600
  }}>
    {totalImporte >= 0
      ? totalImporte?.toLocaleString("es-AR"/* , { minimumFractionDigits: 2, maximumFractionDigits: 2 } */)
      : `(${Math.abs(totalImporte).toLocaleString("es-AR"/* , { minimumFractionDigits: 2, maximumFractionDigits: 2 } */)})`}
  </span>
</div>
    </div>
    </div>
  )
}

export default FichaVehiculo