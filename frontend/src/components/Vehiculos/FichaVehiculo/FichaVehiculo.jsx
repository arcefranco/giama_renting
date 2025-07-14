import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {useParams} from 'react-router-dom';
import {getVehiculosById, getCostosPeriodo, 
getAlquileresPeriodo, getAmortizacion, getCostoNetoVehiculo} from '../../../reducers/Vehiculos/vehiculosSlice'
import {getModelos} from '../../../reducers/Generales/generalesSlice'
import { getConceptosCostos } from '../../../reducers/Costos/costosSlice';
import styles from './FichaVehiculo.module.css'
import { getTodayDate } from '../../../helpers/getTodayDate';
import { formatearFecha } from '../../../helpers/formatearFecha';
import { renderEstadoVehiculo } from '../../../utils/renderEstadoVehiculo';
import { generarPeriodos } from '../../../helpers/generarPeriodos';

const FichaVehiculo = () => {
const {id, anio, mes} = useParams()
const dispatch = useDispatch()
const [expandidoAlquiler, setExpandidoAlquiler] = useState(false);
const [expandidoAmortizacion, setExpandidoAmortizacion] = useState(false);
const [expandidoCostos, setExpandidoCostos] = useState({});
const [form, setForm] = useState({
    id_vehiculo: id,
    mes: mes ? mes : "",
    anio: anio ? anio : ""
})
const [ocupacion, setOcupacion] = useState({
  dias_en_flota: 0,
  dias_alquilado: 0,
  porcentaje_ocupacion: 0,
});
useEffect(() => {
Promise.all([
    dispatch(getVehiculosById({id: id, fecha: getTodayDate()})),
    dispatch(getAmortizacion({id: id})),
    dispatch(getCostoNetoVehiculo(form)),
    dispatch(getModelos()),
    dispatch(getAlquileresPeriodo(form)),
    dispatch(getCostosPeriodo(form)),
    dispatch(getConceptosCostos())
])
},[])
const toggleDetalle = (nombre) => {
  setExpandidoCostos(prev => ({
    ...prev,
    [nombre]: !prev[nombre]
  }));
};

const periodos = generarPeriodos();
const { vehiculo, fichaCostos,
fichaAlquileres, amortizacion, amortizacion_todos_movimientos, costo_neto_vehiculo } = useSelector(state => state.vehiculosReducer);
const { modelos } = useSelector(state => state.generalesReducer);
const [filas, setFilas] = useState([])
const [totalImporte, setTotalImporte] = useState(null)
const [totalCostos, setTotalCostos] = useState(null)

useEffect(( ) => {
let sumaTotal = 0;
if(Object.keys(fichaCostos)?.length){
for (const key in fichaCostos) {
  const items = fichaCostos[key];
  for (const item of items) {
    sumaTotal += parseFloat(item.importe_neto);
  }
}
}
setTotalCostos(sumaTotal)
}, [fichaCostos])

useEffect(() => {
  const filas = [];
  if (fichaAlquileres?.length) {
  const totalDias = fichaAlquileres?.reduce((acc, a) => {
  const importe = Number(a.importe_neto);
  const dias = Number(a.dias_en_mes);

  return acc + (importe < 0 ? -dias : dias);
}, 0);
    const totalNeto = fichaAlquileres?.reduce((acc, a) => acc + parseFloat(a.importe_neto), 0);

  filas.push({
    tipo: "alquiler", 
    concepto: `Alquiler (${totalDias} ${totalDias > 1 ? "días" : "día"})`,
    importe: Math.round(totalNeto)
  });
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

  setTotalImporte(Math.round(filas.reduce((acc, fila) => acc + parseFloat(fila.importe), 0)) + totalCostos)
}, [fichaAlquileres, fichaCostos, vehiculo, amortizacion, amortizacion_todos_movimientos, totalCostos])

useEffect(() => {
  if (vehiculo?.[0]?.fecha_ingreso) {
    const fechaIngreso = new Date(vehiculo[0].fecha_ingreso);
    let fechaLimite;

    if (form.mes && form.anio) {
      // Si hay período, usamos el último día del mes especificado
      fechaLimite = new Date(form.anio, form.mes, 0); // 0 -> último día del mes anterior al siguiente
    } else {
      // Si no hay período, usamos la fecha de hoy
      fechaLimite = new Date();
    }

    fechaIngreso.setHours(0, 0, 0, 0);
    fechaLimite.setHours(0, 0, 0, 0);

    // Asegurarse de no generar negativos
    const diffTime = fechaLimite - fechaIngreso;
    const diasEnFlota = diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1 : 0;

    const diasAlquilado = fichaAlquileres?.reduce((acc, alquiler) => {
      return acc + Number(alquiler.dias_en_mes || 0);
    }, 0);

    const porcentajeOcupacion = diasEnFlota > 0
      ? (diasAlquilado / diasEnFlota) * 100
      : 0;

    setOcupacion({
      dias_en_flota: diasEnFlota,
      dias_alquilado: diasAlquilado,
      porcentaje_ocupacion: Math.round(porcentajeOcupacion),
    });
  }
}, [vehiculo, fichaAlquileres, form]);

useEffect(() => {
    Promise.all([
        dispatch(getCostosPeriodo(form)),
        dispatch(getAlquileresPeriodo(form)),
        dispatch(getCostoNetoVehiculo(form))
    ])
}, [form["mes"], form["anio"]])

function getLastDayOfMonth(year, month) {
  const lastDay = new Date(year, month, 0); // día 0 del mes siguiente = último día del mes actual
  return lastDay.toISOString().slice(0, 10);
}

function esNegativo(numero) {
  return numero < 0 ? 1 : 0;
}

  return (
    <div className={styles.container}>
    <h2>Ficha del vehículo: </h2>
    {
        vehiculo?.length &&
    <h2 style={{display: "flex", alignItems: "center"}}>
    {vehiculo[0]?.dominio ? vehiculo[0]?.dominio : 
    vehiculo[0]?.dominio_provisorio ? vehiculo[0]?.dominio_provisorio : ""}  - {modelos.find(e => e.id === vehiculo[0]?.modelo)?.nombre}{" "}
      - {vehiculo[0]?.color} - {vehiculo && renderEstadoVehiculo(vehiculo[0], "grande")}</h2>
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
  <div className={styles.resumenContainer}>
  {/* Fila principal */}
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    fontWeight: 'bold'
  }}>
    <span>Costo del vehículo + gastos activados: </span>
    <span>
      {" "}{parseFloat(costo_neto_vehiculo).toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}
    </span>
  </div>

  {/* Tanteador */}
  <div className={styles.tanteador}>
    <div>
      <div style={{ fontWeight: 'bold' }}>{ocupacion.dias_en_flota}</div>
      <div style={{ color: '#555' }}>Días ocupación</div>
    </div>
    <div>
      <div style={{ fontWeight: 'bold' }}>{ocupacion.dias_alquilado}</div>
      <div style={{ color: '#555' }}>Días alquilado</div>
    </div>
    <div>
      <div style={{ fontWeight: 'bold' }}>{ocupacion.porcentaje_ocupacion}%</div>
      <div style={{ color: '#555' }}>% Ocupación</div>
    </div>
  </div>
</div>
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
                <span><b>Desde:</b> {formatearFecha(a.fecha_desde?.slice(0, 10))} - 
                <b>Hasta:</b> {formatearFecha(a.fecha_hasta?.slice(0, 10))}</span>
                <span>{a.nombre} {a.apellido}</span>
                <span style={{color: `${esNegativo(a.importe_neto) ? "red" : "black"}`}}>
                  {parseFloat(a.importe_neto).toLocaleString("es-AR")}
                  {esNegativo(a.importe_neto) ? " (ANULADO)" : ""}
                  </span>
              </div>
            </div>
          </td>
        </tr>
      ))}

    </React.Fragment>
  );
})}

{fichaCostos && Object.entries(fichaCostos)?.map(([nombre, items]) => {
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
      ? totalImporte?.toLocaleString("es-AR")
      : `(${Math.abs(totalImporte).toLocaleString("es-AR")})`}
  </span>
</div>
    </div>
    </div>
  )
}

export default FichaVehiculo