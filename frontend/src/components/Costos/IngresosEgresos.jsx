import React, {useEffect, useState, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { getCostosIngresosByIdVehiculo, getConceptosCostos, 
  postCostos_Ingresos, reset as resetCostosSlice, resetCostosVehiculo } from '../../reducers/Costos/costosSlice.js';
import {getVehiculos, getVehiculosById, resetVehiculo} from '../../reducers/Vehiculos/vehiculosSlice'
import {getModelos} from '../../reducers/Generales/generalesSlice'
import { useParams } from 'react-router-dom';
import DataGrid, {Column, Scrolling, Summary, TotalItem} from "devextreme-react/data-grid"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import styles from "./IngresosEgresos.module.css"
import { ClipLoader } from "react-spinners";
import { ToastContainer } from 'react-toastify';
import { renderEstadoVehiculo } from '../../utils/renderEstadoVehiculo';
import Select from 'react-select';
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';

const IngresosEgresos = () => {  

const { id } = useParams();
const gridRef = useRef(null);
const dispatch = useDispatch()
const {isError, isSuccess, isLoading, message, 
costos_ingresos_vehiculo, conceptos} = useSelector((state) => state.costosReducer)
const {vehiculo, vehiculos} = useSelector((state) => state.vehiculosReducer)
const {modelos} = useSelector((state) => state.generalesReducer)
const [form, setForm] = useState({
    id_vehiculo: id ? id : "",
    fecha: '',
    id_concepto: '',
    comprobante: '',
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    observacion: '',
    cuenta: '',
    cuenta_secundaria: ''
})
const [opcionesVehiculos, setOpcionesVehiculos] = useState([])
useEffect(() => {
  if (gridRef.current && costos_ingresos_vehiculo?.length > 0) {
    const pageCount = Math.ceil(costos_ingresos_vehiculo.length / 5);
    gridRef.current.instance.pageIndex(pageCount - 1); // ir a la última página
  }
}, [costos_ingresos_vehiculo]);

useEffect(() => {
dispatch(getConceptosCostos());
dispatch(getModelos());
dispatch(getVehiculos());
locale("es");

return () => {
  // cleanup global al desmontar REAL
  dispatch(resetCostosSlice());
  dispatch(resetCostosVehiculo());
  dispatch(resetVehiculo());
};
}, [dispatch])

  useEffect(() => {
    if (id) {
      // cargar datos del vehículo de la URL
      dispatch(getCostosIngresosByIdVehiculo({ id: id }));
      dispatch(getVehiculosById({ id: id }));
      setForm((f) => ({ ...f, id_vehiculo: id }));
    } else {
      // sin id en URL: limpiar lo específico del vehículo previo
      dispatch(resetVehiculo());
      dispatch(resetCostosVehiculo?.());
      setForm((f) => ({ ...f, id_vehiculo: "" }));
    }
  }, [id, dispatch]);
/* useEffect(() => {
  Promise.all([
    dispatch(getConceptosCostos()),
    dispatch(getModelos()),
    dispatch(getVehiculos()),
    locale('es')
  ])
  if(id){
    dispatch(getCostosIngresosByIdVehiculo({id: id})),
    dispatch(getVehiculosById({id: id}))
  }
  return () => {
    dispatch(reset())
    dispatch(resetCostosVehiculo())
    dispatch(resetVehiculo())
    setForm({
    id_vehiculo: "",
    fecha: '',
    id_concepto: '',
    comprobante: '',
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    observacion: '',
    cuenta: '',
    cuenta_secundaria: ''
})
  }
}, []) */
useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: resetCostosSlice,
    onSuccess: () => {
        if(id){
          setForm({
          id_vehiculo: id,
          fecha: '',
          id_concepto: '',
          comprobante: '',
          importe_neto: '',
          importe_iva: '',
          importe_total: '',
          observacion: '',
          cuenta: '',
          cuenta_secundaria: ''
          })
        }else if (!id){
          setForm({
          id_vehiculo: form.id_vehiculo ? form.id_vehiculo : "",
          fecha: '',
          id_concepto: '',
          comprobante: '',
          importe_neto: '',
          importe_iva: '',
          importe_total: '',
          observacion: '',
          cuenta: '',
          cuenta_secundaria: ''
          })
        }
    }
});

useEffect(() => {
  if(vehiculos?.length){
    setOpcionesVehiculos(vehiculos?.filter(v => {return !v.fecha_venta})?.map(e => {
    
      return {
        value: e.id,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: "15px" }}>
            <span>{e.dominio ? e.dominio : 
        e.dominio_provisorio ? e.dominio_provisorio : ""} - {modelos?.find(m => m.id == e.modelo)?.nombre}</span>
            {renderEstadoVehiculo(e, "chico")}
          </div>
        )
      };
    }))
  }
}, [vehiculos, modelos])

useEffect(() => {
  if(!id && form.id_vehiculo){
    dispatch(getCostosIngresosByIdVehiculo({id: form.id_vehiculo})),
    dispatch(getVehiculosById({id: form.id_vehiculo}))
  }
}, [form.id_vehiculo])

const handleActualizar = ( ) => {
  if(!id){
    dispatch(getCostosIngresosByIdVehiculo({id: form.id_vehiculo}))
  }else{
    dispatch(getCostosIngresosByIdVehiculo({id: id}))
  }
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
     "cuenta": conceptos?.find(e => e.id == value)?.cuenta_contable,
     "cuenta_secundaria": conceptos?.find(e => e.id == value)?.cuenta_secundaria
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
const renderConcepto = (data) => {
  const idConcepto = data.data.id_concepto
  return <span>{conceptos.find(e => e.id == idConcepto)?.nombre}</span>
}

const customStyles = {
  container: (provided) => ({
    ...provided,
    width: '22rem'
  })
};
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
    {
      vehiculo?.length && modelos?.length ?
    <div>
    <h2 style={{display: "flex", alignItems: "anchor-center"}}> 
    {vehiculo?.length && vehiculo[0]?.dominio ? vehiculo[0]?.dominio : 
    vehiculo?.length &&  vehiculo[0]?.dominio_provisorio ? vehiculo[0]?.dominio_provisorio : ""}{" "}-{" "}
    {vehiculo && modelos && modelos?.find(e => e.id === vehiculo[0]["modelo"])?.nombre}{" "}-{" "}
    {vehiculo && renderEstadoVehiculo(vehiculo[0], "grande")}
      
      </h2>

    </div>
    :
    <h2>Seleccionar un vehículo</h2>

    }
          { !id && <div className={styles.inputContainer}>
          <span>Vehículo</span>
          <Select
            options={opcionesVehiculos}
            value={
              opcionesVehiculos?.find(
                (opt) => String(opt.value) === String(form.id_vehiculo)
                      ) || null
            }
            onChange={(option) => {
              setForm((prevForm) => ({
                ...prevForm,
                id_vehiculo: option?.value || "",
              }));
            }}
            placeholder="Seleccione un vehículo"
            styles={customStyles}
          />
        </div> 
        }
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
        <Column dataField="id_concepto" sortOrder="desc" cellRender={renderConcepto} alignment="center" caption="Concepto"/>
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