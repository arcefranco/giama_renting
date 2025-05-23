import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {useParams} from 'react-router-dom';
import {getVehiculosById, getCostosPeriodo, getAlquileresPeriodo} from '../../../reducers/Vehiculos/vehiculosSlice'
import {getModelos} from '../../../reducers/Generales/generalesSlice'
import { getEstadoVehiculoSpan } from '../../../utils/getEstadoVehiculoSpan';
import styles from './FichaVehiculo.module.css'
const FichaVehiculo = () => {
const {id} = useParams()
const dispatch = useDispatch()
const [form, setForm] = useState({
    id_vehiculo: id,
    mes: "",
    anio: ""
})
useEffect(() => {
Promise.all([
    dispatch(getVehiculosById({id: id})),
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
  const inicio = new Date(2024, 0); // enero 2024
  const hoy = new Date();
  const periodos = [];

  while (inicio <= hoy) {
    periodos.push({
      mes: inicio.getMonth() + 1, // 1 a 12
      anio: inicio.getFullYear(),
      nombreMes: nombresMeses[inicio.getMonth()]
    });
    inicio.setMonth(inicio.getMonth() + 1);
  }

  return periodos.reverse(); // Más recientes primero
};
const periodos = generarPeriodos();


const { vehiculo, isError, isSuccess, isLoading, message, fichaCostos,
fichaAlquileres } = useSelector(state => state.vehiculosReducer);
const { modelos } = useSelector(state => state.generalesReducer);
const [filas, setFilas] = useState([])
const [totalImporte, setTotalImporte] = useState(null)
useEffect(() => {
  const filas = [];

  if (fichaAlquileres?.length) {
    fichaAlquileres.forEach((a, i) => {
      filas.push({
        concepto: `Alquiler (${a.dias_en_mes} días)`,
        importe: parseFloat(a.importe_neto).toFixed(2)
      });
      filas.push({
        concepto: `IVA`,
        importe: parseFloat(a.importe_iva).toFixed(2)
      });
    });
  }

  if (fichaCostos?.length) {
    fichaCostos.forEach(c => {
      filas.push({
        concepto: c.nombre,
        importe: parseFloat(c["SUM(costos_ingresos.importe_neto)"]).toFixed(2)
      });
    });
  }
  setFilas(filas);
  setTotalImporte(filas.reduce((acc, fila) => acc + parseFloat(fila.importe), 0))
}, [fichaAlquileres, fichaCostos])
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
      - {vehiculo[0]?.color} - {vehiculo && getEstadoVehiculoSpan(vehiculo)}</h2>
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
  <table className={styles.fichaTabla}>
    <thead>
      <tr>
        <th>Concepto</th>
        <th>Importe</th>
      </tr>
    </thead>
    <tbody>
      {filas?.map((fila, i) => (
        <tr key={i}>
          <td>{fila.concepto}</td>
          <td>${fila.importe}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
<div className={styles.totalResumen}>
  <strong>Total: </strong> ${totalImporte?.toFixed(2)}
</div>
    </div>
    </div>
  )
}

export default FichaVehiculo