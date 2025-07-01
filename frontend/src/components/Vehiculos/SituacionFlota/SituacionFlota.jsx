import React, {useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {getSituacionFlota} from '../../../reducers/Vehiculos/vehiculosSlice'
import { formatearFecha } from '../../../helpers/formatearFecha';
import DataGrid, {Column, Scrolling, Export, SearchPanel, FilterRow, HeaderFilter, Paging} from "devextreme-react/data-grid"
import { ClipLoader } from 'react-spinners';
import styles from './SituacionFlota.module.css'
import { generarPeriodos } from '../../../helpers/generarPeriodos';

const SituacionFlota = () => {
const dispatch = useDispatch()
const [form, setForm] = useState({
    mes:  "",
    anio: ""
})
useEffect(() => {
dispatch(getSituacionFlota(form))
}, [form])
const { vehiculo, isError, isSuccess, isLoading, message, situacionFlota} = useSelector(state => state.vehiculosReducer);
const periodos = generarPeriodos()
const renderFecha = (data) => {
  if(data.value){
    let fechaSplit = data?.value?.split("-")
    return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
  }
}
const renderAlquilado = (data) => {
    if(!data.value) return <span>0</span>
    if(data.value) return <span>{data.value}</span>
}
const renderPorcentaje = (data) => {
    if(!data.value) return <span>0.00%</span>
    if(data.value) return <span>{data.value}%</span>
}
  return (
    <div className={styles.container}>
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
        <h2>Situación de la flota</h2>
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
        className={styles.dataGrid}
        dataSource={situacionFlota || []}
        showBorders={true}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height={400}
        >
        <Column dataField="fecha_ingreso" cellRender={renderFecha}/>
        <Column
        dataField="dominio_visible"
        caption="Dominio"
        cellRender={({ data }) => {
            return (
            data.dominio ? (
                <span>{data.dominio}</span>
            ) : data.dominio_provisorio ? (
                <span>{data.dominio_provisorio}</span>
            ) : (
                <span>SIN DOMINIO</span>
            )
            );
        }}
        />
        <Column dataField="dias_en_flota" caption="Días en flota"/>
        <Column dataField="dias_alquilado" cellRender={renderAlquilado} caption="Días alquilado"/>   
        <Column dataField="porcentaje_ocupacion" cellRender={renderPorcentaje} caption="% de ocupación"/> 
        </DataGrid>
    </div>
  )
}

export default SituacionFlota