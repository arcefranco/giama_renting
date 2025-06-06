import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {useParams} from 'react-router-dom';
import {getVehiculosById, getCostosPeriodo, 
getAlquileresPeriodo, getAmortizacion} from '../../../reducers/Vehiculos/vehiculosSlice'
import {getModelos} from '../../../reducers/Generales/generalesSlice'
import { getEstadoVehiculoSpan } from '../../../utils/getEstadoVehiculoSpan';
import styles from './FichaVehiculo.module.css'
import { getTodayDate } from '../../../helpers/getTodayDate';
import { formatearFecha } from '../../../helpers/formatearFecha';

const FichaVehiculo = () => {
const {id, anio, mes} = useParams()
const dispatch = useDispatch()
const [expandidoAlquiler, setExpandidoAlquiler] = useState(false);
const [expandidoAmortizacion, setExpandidoAmortizacion] = useState(false);
const [costosAgrupados, setCostosAgrupados] = useState([])
const [expandidoCostos, setExpandidoCostos] = useState({});
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
const toggleDetalle = (nombre) => {
  setExpandidoCostos(prev => ({
    ...prev,
    [nombre]: !prev[nombre]
  }));
};
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
  setCostosAgrupados(fichaCostos?.reduce((acc, costo) => {
  const nombre = costo.nombre;
  if (!acc[nombre]) acc[nombre] = [];
  acc[nombre].push(costo);
  return acc;
}, {}))
  if (fichaAlquileres?.length) {
    const totalDias = fichaAlquileres.reduce((acc, a) => acc + a.dias_en_mes, 0);
    const totalNeto = fichaAlquileres.reduce((acc, a) => acc + parseFloat(a.importe_neto), 0);
/*  const totalIva = fichaAlquileres.reduce((acc, a) => acc + parseFloat(a.importe_iva), 0); */

  filas.push({
    tipo: "alquiler", // <--- importante
    concepto: `Alquiler (${totalDias} ${totalDias > 1 ? "días" : "día"})`,
    importe: Math.round(totalNeto)
  });
/*  filas.push({
      concepto: `IVA`,
      importe: totalIva
    }); */
  }


if (vehiculo?.length && form["mes"] && form["anio"]) {
  filas.push({
    tipo: "amortizacion",
    concepto: `Amortización ${periodos?.find(({ mes, anio }) => form["mes"] == mes && form["anio"] == anio)?.nombreMes} ${form["anio"]}`,
    importe: Math.round(amortizacion * (-1))
  });
} else if (vehiculo?.length && !form["mes"] && !form["anio"]) {
  filas.push({
    tipo: "amortizacion",
    concepto: `Amortización ${vehiculo[0]["dias_diferencia"]} dias`,
    importe:
      vehiculo[0]["dias_diferencia"] == 0 && amortizacion_todos_movimientos == 0
        ? 0
        : Math.round(amortizacion_todos_movimientos * (-1))
  });
}
  

  setFilas(filas);
  setTotalImporte(Math.round(filas.reduce((acc, fila) => acc + parseFloat(fila.importe), 0)))
}, [fichaAlquileres, fichaCostos, vehiculo, amortizacion, amortizacion_todos_movimientos])

useEffect(() => {
    Promise.all([
        dispatch(getCostosPeriodo(form)),
        dispatch(getAlquileresPeriodo(form))
    ])
}, [form["mes"], form["anio"]])

function getLastDayOfMonth(year, month) {
  const lastDay = new Date(year, month, 0); // día 0 del mes siguiente = último día del mes actual
  return lastDay.toISOString().slice(0, 10);
}

  return (
    <div className={styles.container}>
    <h2>Ficha del vehículo: </h2>
    {
        vehiculo?.length &&
    <h2 style={{display: "flex", alignItems: "center"}}>
    {vehiculo[0]?.dominio ? vehiculo[0]?.dominio : 
    vehiculo[0]?.dominio_provisorio ? vehiculo[0]?.dominio_provisorio : ""}  - {modelos.find(e => e.id === vehiculo[0]?.modelo)?.nombre}{" "}
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
    {periodos?.map(({ mes, anio, nombreMes }) => (
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
  const esPositivo = fila.importe >= 0;
  const estilo = {
    color: esPositivo ? "green" : "red",
    fontWeight: 500
  };
  const importeFormateado = esPositivo
    ? fila.importe?.toLocaleString("es-AR")
    : `(${Math.abs(fila.importe).toLocaleString("es-AR")})`;

  const esAlquiler = fila.tipo === 'alquiler';

  
  return (
    esAlquiler &&
    <React.Fragment key={i}>
      <tr
        onClick={() => {
          if (esAlquiler) setExpandidoAlquiler(prev => !prev);
        }}
        style={{ cursor: "pointer"  }}
      >
        <td>{fila.concepto}</td>
        <td className={styles.importeAlignRight} style={estilo}>{importeFormateado}</td>
      </tr>

      {esAlquiler && expandidoAlquiler && fichaAlquileres?.map((a, j) => (
        <tr key={`detalle-alquiler-${i}-${j}`} className={styles.detalleRow}>
          <td colSpan={2} style={{ padding: 0, border: "none" }}>
            <div className={`${styles.detalleWrapper} ${expandidoAlquiler ? styles.expandido : ""}`}>
              <div className={styles.detalleFila}>
                <span><b>Desde:</b> {formatearFecha(a.fecha_desde?.slice(0, 10))} - <b>Hasta:</b> {formatearFecha(a.fecha_hasta?.slice(0, 10))}</span>
                <span>{a.nombre} {a.apellido}</span>
                <span>{parseFloat(a.importe_neto).toLocaleString("es-AR")}</span>
              </div>
            </div>
          </td>
        </tr>
      ))}

    </React.Fragment>
  );
})}

{costosAgrupados && Object.entries(costosAgrupados)?.map(([nombre, items]) => {
      const total = items.reduce((acc, c) => acc + parseFloat(c.importe_neto), 0);
      return (
        <React.Fragment key={nombre}>
          <tr
            onClick={() => toggleDetalle(nombre)}
            style={{ cursor: "pointer" }}
          >
          <td>{nombre}</td>
          <td
            className={styles.importe}
            style={{ color: parseFloat(total) < 0 ? "red" : "green", textAlign: "right" }}
          >
            {parseFloat(total) < 0
              ? `(${Math.abs(parseFloat(total)).toLocaleString("es-AR")})`
              : parseFloat(total).toLocaleString("es-AR")}
          </td>
          </tr>
          {expandidoCostos[nombre] &&
            items.map((item, idx) => (
              <tr key={`detalle-costo-${nombre}-${idx}`}  className={styles.detalleRow}>
                <td colSpan={2} style={{ padding: 0, border: "none" }}>
                  <div className={styles.detalleWrapper}>
                    <div className={styles.detalleFila}>
                      <span><b>Fecha:</b> {formatearFecha(item.fecha?.slice(0, 10))}</span>
                      <span><b>Comprobante:</b> {item.comprobante || "Sin comprobante"}</span>
                      <span>{parseFloat(item.importe_neto).toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                </td>
              </tr>
            ))
          }
        </React.Fragment>
      );
    })}
  {filas?.map((fila, i) => {
  const esPositivo = fila.importe >= 0;
  const estilo = {
    color: esPositivo ? "green" : "red",
    fontWeight: 500
  };
  const importeFormateado = esPositivo
    ? fila.importe?.toLocaleString("es-AR")
    : `(${Math.abs(fila.importe).toLocaleString("es-AR")})`;

  const esAmortizacion = fila.tipo === 'amortizacion';
  
  return (
    esAmortizacion &&
    <React.Fragment key={i}>
      <tr
        onClick={() => {
          if (esAmortizacion) setExpandidoAmortizacion(prev => !prev);
        }}
        style={{cursor: "pointer"}}
      >
        <td>{fila.concepto}</td>
        <td className={styles.importeAlignRight} style={estilo}>{importeFormateado}</td>
      </tr>
      
      {esAmortizacion && expandidoAmortizacion && (
        <tr key={`detalle-amortizacion-${i}`} className={styles.detalleRow}>
          <td colSpan={2} style={{ padding: 0, border: "none" }}>
            <div className={`${styles.detalleWrapper} ${expandidoAmortizacion ? styles.expandido : ""}`}>
              <div className={styles.detalleFila}>
                <span>
                  <b>Desde:</b>{" "}
                  {form["mes"] && form["anio"]
                    ? `${formatearFecha(`${form["anio"]}-${String(form["mes"]).padStart(2, "0")}-01`)}`
                    : formatearFecha(vehiculo[0]["fecha_ingreso"])}{" "}
                  - <b>Hasta:</b> {form["mes"] && form["anio"] ? formatearFecha(getLastDayOfMonth(form["anio"], form["mes"])) : formatearFecha(getTodayDate())}
                </span>
                <span></span>
                <span>{fila.importe?.toLocaleString("es-AR")}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
      </React.Fragment>
  )
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