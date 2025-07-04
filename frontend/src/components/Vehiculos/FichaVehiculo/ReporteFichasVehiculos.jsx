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
      dispatch(getFichas(form))
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
const [columnas, setColumnas] = useState([])

useEffect(() => {
    Promise.all([
      dispatch(getFichas(form))
    ])
}, [form["mes"], form["anio"]])

useEffect(() => {
setColumnas(fichas && fichas.length > 0
  ? Object.keys(fichas[0]).map((key) => {
      const isNumeric = typeof fichas[0][key] === 'number';
      return {
        dataField: key,
        dataType: isNumeric ? 'number' : 'string'
      };
    })
  : [])
}, [fichas])

const renderDominio = (data) => {
    console.log("THIS: ", data.data)
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
    <DataGrid
    dataSource={fichas}
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

   {columnas?.filter((col) => col.dataField !== "dominio_provisorio").map(col => (
        col.dataField === "dias_en_mes" ? 
        <Column key={col.dataField} {...col} 
         
        />
        :
        
        col.dataField === "dominio" ? 
        <Column key={col.dataField} {...col} cellRender={renderDominio}
         
        />
        :
        <Column key={col.dataField} {...col} 
        customizeText={col.dataType === 'number' ? (e) => Math.trunc(e.value).toLocaleString() 
            : (e) => Math.trunc(parseInt(e.value)).toLocaleString()}
  />
      ))}
   <Summary>
  {columnas?.map(col => (
    typeof col.dataField === "string" &&
    col.dataField !== "dominio"  &&
    col.dataField !== "total"  &&
    col.dataField !== "dias_en_mes" &&
    <TotalItem
        key={col.dataField}
        column={col.dataField}
        summaryType="sum"
        displayFormat="{0}"         
        customizeText={(e) => Math.trunc(e.value).toLocaleString()}
    />
        ))}
    <TotalItem
        column="total"
        summaryType="sum"
        displayFormat="{0}" 
        customizeText={(e) => Math.trunc(e.value).toLocaleString()}
        cssClass={styles.totalItem}
    />
    </Summary> 
    </DataGrid>
    
    </div>
  )
}
export default ReporteFichasVehiculos