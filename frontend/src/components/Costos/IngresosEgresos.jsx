import React, {useEffect, useState, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { getCostosIngresosByIdVehiculo, getConceptosCostos, postCostos_Ingresos, reset } from '../../reducers/Costos/costosSlice';
import {getVehiculosById} from '../../reducers/Vehiculos/vehiculosSlice'
import {getModelos} from '../../reducers/Generales/generalesSlice'
import { useParams } from 'react-router-dom';
import DataGrid, {Column, Scrolling, Summary, TotalItem} from "devextreme-react/data-grid"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import styles from "./IngresosEgresos.module.css"
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';


const IngresosEgresos = () => {  

const { id } = useParams();
const gridRef = useRef(null);
const dispatch = useDispatch()
const {isError, isSuccess, isLoading, message, 
costos_ingresos_vehiculo, conceptos} = useSelector((state) => state.costosReducer)
const {vehiculo} = useSelector((state) => state.vehiculosReducer)
const {modelos} = useSelector((state) => state.generalesReducer)
const [form, setForm] = useState({
    id_vehiculo: id,
    fecha: '',
    id_concepto: '',
    comprobante: '',
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    observacion: '',
    cuenta: ''
})
useEffect(() => {
  if (gridRef.current && costos_ingresos_vehiculo?.length > 0) {
    const pageCount = Math.ceil(costos_ingresos_vehiculo.length / 5);
    gridRef.current.instance.pageIndex(pageCount - 1); // ir a la última página
  }
}, [costos_ingresos_vehiculo]);
useEffect(() => {
  Promise.all([
    dispatch(getCostosIngresosByIdVehiculo({id: id})),
    dispatch(getVehiculosById({id: id})),
    dispatch(getConceptosCostos()),
    dispatch(getModelos()),
    locale('es')
  ])
}, [])
useEffect(() => {

  if(isError){
      toast.error(message, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        })
        dispatch(getCostosIngresosByIdVehiculo({id: id}))
        dispatch(reset())
    }
    if(isSuccess){
      toast.success(message, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        })
        dispatch(reset())
        setForm({
        id_vehiculo: id,
        fecha: '',
        id_concepto: '',
        comprobante: '',
        importe_neto: '',
        importe_iva: '',
        importe_total: '',
        observacion: '',
        cuenta: ''
        })
    }

  }, [isError, isSuccess]) 
const handleActualizar = ( ) => {
  dispatch(getCostosIngresosByIdVehiculo({id: id}))
}
const handleChange = (e) => {
  const { name, value } = e.target;
  if(value && name === "importe_neto"){
        setForm({
       ...form,
       [name]: parseFloat(value),
       "importe_iva": parseFloat(value) * 0.21,
       "importe_total": (parseFloat(value) * 0.21) + parseFloat(value)
     }); 
  }
  else if(value && name === "id_concepto"){
      setForm({
     ...form,
     [name]: value,
     "cuenta": conceptos.find(e => e.id == value)?.cuenta_contable,
   }); 
  }
    else if(value && name === "importe_iva"){
      setForm({
     ...form,
     [name]: value,
     "importe_total": parseFloat(value) + parseFloat(form["importe_neto"])
   }); 
  }
  else{
    setForm({
     ...form,
     [name]: value,
   }); 

  }
};

const handleSubmit = () => {
  dispatch(postCostos_Ingresos(form))
}
const renderFecha = (data) => {
  let fechaSplit = data.value.split("-")
  return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
}
return (
<div className={styles.container}>
<ToastContainer/>
{isLoading && (
    <div className={styles.spinnerOverlay}>
    <ClipLoader
      size={60}
      color="#800020" // bordó
      loading={true}
    />
      <span className={styles.loadingText}>Cargando...</span>
    </div>
  )}
    <h2>Ingresos y egresos del vehículo</h2>
    <h2>Patente: {vehiculo && vehiculo[0]["dominio"]} Modelo: {vehiculo && modelos && modelos.find(e => e.id === vehiculo[0]["modelo"])?.nombre}</h2>
    <button onClick={handleActualizar} className={styles.refreshButton}>
    🔄 Actualizar
    </button>
      <DataGrid
        className={styles.dataGrid}
        dataSource={costos_ingresos_vehiculo || []}
        showBorders={true}
        style={{fontFamily: "IBM"}}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        scrolling={true}
        height={300}
        
        columnAutoWidth={true}>
        <Scrolling mode="standard"/>
        <Column dataField="fecha" sortOrder="desc" cellRender={renderFecha} alignment="center" caption="Fecha"/>
        <Column dataField="comprobante" caption="Comprobante"/>
        <Column dataField="importe_neto" alignment="right" caption="Importe Neto"/>
        <Column dataField="importe_iva" alignment="right" caption="IVA"/>
        <Column dataField="importe_total" alignment="right" caption="Total"/>
        <Column dataField="observacion" caption="Observación"/>
         <Summary>
    <TotalItem
      column="importe_neto"
      summaryType="sum"
      displayFormat="{0}"
      alignment="right"
      valueFormat="#,##0.00"
      showInColumn="importe_neto"
      
    />
    <TotalItem
      column="importe_iva"
      summaryType="sum"
      alignment="right"
      displayFormat="{0}"
      valueFormat="#,##0.00"
      showInColumn="importe_iva"
    />
    <TotalItem
      column="importe_total"
      summaryType="sum"
      alignment="right"
      displayFormat="TOTAL: {0}"
      valueFormat="#,##0.00"
      showInColumn="importe_total"
      cssClass={styles.importeTotal}
    />
  </Summary>
      </DataGrid>
      <h2>Alta de ingresos/egresos del vehículo</h2>
      <div className={styles.formContainer}>
      <form action="" enctype="multipart/form-data" className={styles.form}>
      <div className={styles.inputContainer}>
          <span>Fecha</span>
          <input type="date" name='fecha' value={form["fecha"]} 
        onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Comprobante</span>
          <input type="text" name='comprobante' value={form["comprobante"]} 
        onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Importe neto</span>
          <input type="number" name='importe_neto' value={form["importe_neto"]} 
        onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
          <span>IVA</span>
          <input type="number" name='importe_iva' value={form["importe_iva"]} 
          onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Total</span>
          <input type="number" name='importe_total' value={form["importe_total"]} disabled/>
      </div>
      <div className={styles.inputContainer}>
          <span>Observacion</span>
          <textarea type="text" name='observacion' value={form["observacion"]} 
        onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
        <span>Concepto</span>
        <select name="id_concepto" style={{width: "130%"}}  value={form["id_concepto"]} 
        onChange={handleChange} id="">
          <option value={""} disabled selected>{"Seleccione un concepto"}</option>
          {
            conceptos?.length && conceptos?.map(e => {
            return <option key={e.id} value={e.id}>{e.id} - {e.nombre}</option>
            })
          }
        </select>
      </div>
      </form>
      <button 
      className={styles.sendBtn} 
      onClick={handleSubmit}
      disabled={!form["fecha"] || !form["id_concepto"] || !form["id_vehiculo"]}  
      >
        Enviar
      </button>

      </div>
    </div>
  )
}

export default IngresosEgresos