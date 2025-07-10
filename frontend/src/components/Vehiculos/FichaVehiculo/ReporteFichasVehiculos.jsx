import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {getFichas} from '../../../reducers/Vehiculos/vehiculosSlice'
import { getConceptosCostos } from '../../../reducers/Costos/costosSlice';
import styles from './FichaVehiculo.module.css'
import { ClipLoader } from 'react-spinners';
import DataGrid, {Column, Summary, TotalItem, FilterRow} from "devextreme-react/data-grid"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';

const ReporteFichasVehiculos = () => {
const dispatch = useDispatch()
const [form, setForm] = useState({
    mes: "",
    anio: ""
})
useEffect(() => {
    Promise.all([
      dispatch(getFichas(form)),
      dispatch(getConceptosCostos())
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

const { isError, isSuccess, isLoading, message, fichas } = useSelector(state => state.vehiculosReducer);
const { conceptos } = useSelector(state => state.costosReducer);
const [fichasProcesadas, setFichasProcesadas] = useState([]);

useEffect(() => {
    Promise.all([
      dispatch(getFichas(form))
    ])
}, [form["mes"], form["anio"]])

useEffect(() => {
  const fechaFinPeriodo = form?.mes && form?.anio
    ? new Date(form.anio, form.mes, 0)
    : new Date();

  const procesadas = fichas.map((ficha) => {
    const fechaIngreso = new Date(ficha.fecha_ingreso);
    const diasOcupacion = Math.max(0, Math.floor((fechaFinPeriodo - fechaIngreso) / (1000 * 60 * 60 * 24)));

    const porcentajeOcupacion = diasOcupacion > 0
      ? ((ficha.dias_en_mes / diasOcupacion) * 100).toFixed(2)
      : 0;

    return {
      ...ficha,
      dias_ocupacion: diasOcupacion,
      porcentaje_ocupacion: porcentajeOcupacion,
    };
  });
  setFichasProcesadas(procesadas);
}, [fichas, form]);


const renderDominio = (data) => {
    return (
      data.data?.dominio ? 
      <button
        onClick={() =>{
            if(!form["anio"] && !form["mes"]){
                window.open(`/vehiculos/ficha/${data.data.vehiculo}`, '_blank')
            }else{
                window.open(`/vehiculos/ficha/${data.data.vehiculo}/${form["anio"]}/${form["mes"]}`, '_blank')
            }  
        }
        } 
        style={{ color: '#1976d2', fontSize: "11px", textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {data.data.dominio}
      </button>
      :
      data.data?.dominio_provisorio ?
      <button
        onClick={() =>{
            if(!form["anio"] && !form["mes"]){
                window.open(`/vehiculos/ficha/${data.data.vehiculo}`, '_blank')
            }else{
                window.open(`/vehiculos/ficha/${data.data.vehiculo}/${form["anio"]}/${form["mes"]}`, '_blank')
            }  
        }
        } 
        style={{ color: '#1976d2', fontSize: "11px", textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {data.data.dominio_provisorio}
      </button>
      :
      <span>SIN DOMINIO</span>
    );
};
  return (
    <div>
    {isLoading && (
    <div className={styles.spinnerOverlay}>
    <ClipLoader
      size={60}
      color="#800020" // bordó
      loading={true}
    />
      <span className={styles.loadingText}>Cargando vehículos...</span>
    </div>
  )}    
        <h2>Reporte fichas de vehículos</h2>
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
      </div>
      <div style={{overflowX: "auto"}}>
    <DataGrid
    dataSource={fichasProcesadas}
    columnAutoWidth={true}
    rowAlternationEnabled={true}
    scrolling={false}
    showBorders
    className={styles.dataGrid}
    onCellPrepared={(e) => {
    if (e.rowType === "data" && e.column.dataField === "total") {
      e.cellElement.style.fontWeight = "bold";
    }
    if (e.rowType === "data" && e.data.dominio === "TOTAL") {
      e.cellElement.style.fontWeight = "bold";
      e.cellElement.style.backgroundColor = "#f0f0f0";
    }
  }}
    >
    <FilterRow visible={true} />

  <Column dataField="dominio" caption="Dominio" cellRender={renderDominio} />
  <Column dataField="fecha_ingreso" caption="Fecha ingreso" customizeText={(e) => {
    const date = new Date(e.value);
    return `${date.getDate().toString().padStart(2, '0')}/${
      (date.getMonth() + 1).toString().padStart(2, '0')
    }/${date.getFullYear()}`;
  }} />
  <Column dataField="dias_en_mes" caption="Días alquilado" />
  <Column dataField="dias_ocupacion" caption="Días ocupación" />
  <Column dataField="porcentaje_ocupacion" width={90} caption="% ocupación" customizeText={(e) => `${Math.round(e.value)}%`} />


  <Column dataField="alquiler" caption="Alquiler" customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")} />
  {conceptos?.filter(concepto => !concepto.activable).map((concepto) => (
    <Column
      key={concepto.nombre}
      dataField={concepto.nombre}
      width={100}
      caption={concepto.nombre}
      customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")}
    />
  ))}
  <Column dataField="amortizacion" caption="Amortización" customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")} />
  <Column dataField="total" caption="Total" customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")} />



   <Summary>
  {conceptos?.map((concepto) => (
    <TotalItem
      key={concepto.nombre}
      column={concepto.nombre}
      summaryType="sum"
      displayFormat="{0}"
      customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")}
    />
  ))}

  <TotalItem
    column="alquiler"
    summaryType="sum"
    displayFormat="{0}"
    customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")}
  />
  <TotalItem
    column="amortizacion"
    summaryType="sum"
    displayFormat="{0}"
    customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")}
  />
  <TotalItem
    column="total"
    summaryType="sum"
    displayFormat="{0}"
    customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")}
    cssClass={styles.totalItem}
  />
    </Summary> 
    </DataGrid>

      </div>
    
    </div>
  )
}
export default ReporteFichasVehiculos