import React, {useEffect, useState} from 'react'
import {getAlquileres} from "./../../../reducers/Alquileres/alquileresSlice"
import {getVehiculos} from "./../../../reducers/Vehiculos/vehiculosSlice"
import {getClientes} from "./../../../reducers/Clientes/clientesSlice"
import {getModelos} from "./../../../reducers/Generales/generalesSlice"
import {useDispatch, useSelector} from "react-redux"
import DataGrid, {Column, Scrolling, Export, SearchPanel, FilterRow, HeaderFilter, Paging} from "devextreme-react/data-grid"
import styles from "./ReporteAlquileres.module.css"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { esAnteriorAHoy } from '../../../helpers/esAnteriorAHoy'

const ReporteAlquileres = () => {
const dispatch = useDispatch()

useEffect(() => {
Promise.all([
  dispatch(getAlquileres({fecha_desde: "", fecha_hasta: ""})),
  dispatch(getVehiculos()),
  dispatch(getClientes()),
  dispatch(getModelos())
])
}, [])

const handleActualizar = ( ) => {
  dispatch(getClientes())
}

const {
    alquileres,
    message,
    isError,
    isSuccess,
    isLoading
} = useSelector((state) => state.alquileresReducer)
const {vehiculos} = useSelector((state) => state.vehiculosReducer)
const {modelos} = useSelector((state) => state.generalesReducer)
const {clientes} = useSelector((state) => state.clientesReducer)
const [form, setForm] = useState({
    fecha_desde: '',
    fecha_hasta: '',
})
const handleChange = (e) => {
const { name, value } = e.target;
setForm({
  ...form,
  [name]: value
})
}
const renderFecha = (data) => {
  if(data.value){
    let fechaSplit = data?.value?.split("-")
    return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
  }
}
const renderVehiculo = (data) => {
  if(data.value){
    const vehiculo = vehiculos?.find(e => e.id == data.value)
    return <div style={{display: "flex", justifyContent: "space-evenly"}}>
      <span>{vehiculo?.dominio ? vehiculo?.dominio : vehiculo?.dominio_provisorio ? 
      vehiculo?.dominio_provisorio : "SIN DOMINIO"}</span>
    <span>{" "}</span>
    <span>{modelos?.find(e => e.id == vehiculo?.modelo)?.nombre}</span>
    </div> 
  }
}

const renderCliente = (data) => {
  if(data.value){
    const cliente = clientes?.find(e => e.id == data.value)
    return <div>
      <span>{cliente?.nombre}</span>
      <span>{cliente?.apellido}</span>
    </div>
  }
}

const renderModificar = (data) => {
      return (
      <button
        onClick={() => window.open(`/alquileres/actualizar/${data.data.id}`, '_blank')}
        style={{ color: esAnteriorAHoy(data.data.fecha_hasta) ? "grey" : '#1976d2', fontSize: "11px" ,
          textDecoration: 'underline', background: 'none', border: 'none', 
          cursor: esAnteriorAHoy(data.data.fecha_hasta) ? "none" : 'pointer' }}
          disabled={esAnteriorAHoy(data.data.fecha_hasta)}
      >
        Modificar
      </button>
    );
}

const handleSubmit = () => {
  dispatch(getAlquileres(form))
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
      <span className={styles.loadingText}>Cargando alquileres...</span>
    </div>
  )}
    <h2>Listado de alquileres</h2>
    <div className={styles.filter}>
      <div style={{display: "grid",
    gridTemplateColumns: "1fr 1fr",
    columnGap: "4rem"}}>
      <div className={styles.inputContainer}>
      <span>Fecha desde: </span>
      <input name='fecha_desde' value={form["fecha_desde"]} onChange={handleChange} type="date" />
      </div>
      <div className={styles.inputContainer}>
      <span>Fecha hasta: </span>
      <input name='fecha_hasta' value={form["fecha_hasta"]} onChange={handleChange} type="date" />
      </div>
      </div>
      <button className={styles.searchButton} onClick={handleSubmit}>Buscar</button>
    </div>
    <button onClick={handleActualizar} className={styles.refreshButton}>
    🔄 Actualizar reporte
    </button>
      <DataGrid
        className={styles.dataGrid}
        dataSource={alquileres || []}
        showBorders={true}
        style={{fontFamily: "IBM"}}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height={400}>
        <Export enabled={true} allowExportSelectedData={true} />
        <Scrolling mode="standard" />
        <Paging defaultPageSize={10} />
        <Column dataField="id_vehiculo" caption="Vehículo" cellRender={renderVehiculo} alignment="center"/>
        <Column dataField="id_cliente" caption="Cliente" cellRender={renderCliente} alignment="center"/>
        <Column dataField="fecha_desde" caption="Desde" cellRender={renderFecha} alignment="center"/>
        <Column dataField="fecha_hasta" caption="Hasta" cellRender={renderFecha} alignment="center"/>
        <Column dataField="importe_neto" alignment="right"caption="Importe neto" />
        <Column caption="" cellRender={renderModificar} alignment="center"/>
      </DataGrid>
</div>
  )
}

export default ReporteAlquileres