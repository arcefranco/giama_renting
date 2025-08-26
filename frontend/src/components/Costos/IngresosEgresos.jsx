import React, {useEffect, useState, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { getCostosIngresosByIdVehiculo, getConceptosCostos, 
  postCostos_Ingresos, reset as resetCostosSlice, resetCostosVehiculo, reset_nro_recibo_ingreso } from '../../reducers/Costos/costosSlice.js';
import {getVehiculos, getVehiculosById, resetVehiculo} from '../../reducers/Vehiculos/vehiculosSlice'
import { getClientes } from '../../reducers/Clientes/clientesSlice.js';
import {getFormasDeCobro} from "../../reducers/Alquileres/alquileresSlice.js"
import {getModelos, getProveedores} from '../../reducers/Generales/generalesSlice'
import { useParams, useMatch } from 'react-router-dom';
import DataGrid, {Column, Scrolling, Summary, TotalItem} from "devextreme-react/data-grid"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import styles from "./IngresosEgresos.module.css"
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import { renderEstadoVehiculo } from '../../utils/renderEstadoVehiculo';
import Select from 'react-select';
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';
import { getReciboIngresoById, resetIngreso } from '../../reducers/Recibos/recibosSlice.js';
import Swal from 'sweetalert2';

const IngresosEgresos = () => {  

const { id } = useParams();
const isIngresos = useMatch("/costos/ingresos");
const isEgresos = useMatch("/costos/egresos");
const gridRef = useRef(null);
const dispatch = useDispatch()
const {isError, isSuccess, isLoading, message, 
costos_ingresos_vehiculo, conceptos, nro_recibo_ingreso} = useSelector((state) => state.costosReducer)
const {vehiculo, vehiculos} = useSelector((state) => state.vehiculosReducer)
const {clientes} = useSelector((state) => state.clientesReducer)
const {formasDeCobro} = useSelector((state) => state.alquileresReducer)
const {username} = useSelector((state) => state.loginReducer)
const {modelos, proveedores} = useSelector((state) => state.generalesReducer)
const { html_recibo_ingreso } = useSelector((state) => state.recibosReducer);
const [form, setForm] = useState({
    id_vehiculo: id ? id : "",
    fecha: '',
    id_concepto: '',
    id_forma_cobro: '',
    id_cliente: '',
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    observacion: '',
    cuenta: '',
    ingreso_egreso: '',
    genera_recibo: 1,
    cta_cte_proveedores: 1,
    cuenta_secundaria: '',
    tipo_comprobante: '',
    numero_comprobante_1: '',
    numero_comprobante_2: '',
    cod_proveedor: '',
    usuario: username,
})
const [tipo, setTipo] = useState(null)
const [opcionesVehiculos, setOpcionesVehiculos] = useState([])
const [conceptosFiltrados, setConceptosFiltrados] = useState([])
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
dispatch(getClientes());
dispatch(getFormasDeCobro());
dispatch(getProveedores());
locale("es");

return () => {
  dispatch(resetCostosSlice());
  dispatch(resetCostosVehiculo());
  dispatch(resetVehiculo());
  dispatch(resetIngreso());
  dispatch(reset_nro_recibo_ingreso())
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
          id_cliente: '',
          id_forma_cobro: '',
          id_concepto: '',
          importe_neto: '',
          importe_iva: '',
          importe_total: '',
          observacion: '',
          cuenta: '',
          cuenta_secundaria: '',
          ingreso_egreso: '',
          genera_recibo: 1,
          cta_cte_proveedores: 1,
          cod_proveedor: '',
          tipo_comprobante: '',
          numero_comprobante_1: '',
          numero_comprobante_2: '',
          usuario: username
          })
        }else if (!id){
          setForm({
          id_vehiculo: form.id_vehiculo ? form.id_vehiculo : "",
          id_cliente: '',
          id_forma_cobro: '',
          fecha: '',
          id_concepto: '',
          importe_neto: '',
          importe_iva: '',
          importe_total: '',
          observacion: '',
          cuenta: '',
          cuenta_secundaria: '',
          ingreso_egreso: '',
          genera_recibo: 1,
          cta_cte_proveedores: 1,
          cod_proveedor: '',
          tipo_comprobante: '',
          numero_comprobante_1: '',
          numero_comprobante_2: '',
          usuario: username
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

useEffect(() => {
if(isEgresos){
  setTipo("E")
}
else if(isIngresos){
  setTipo("I")
}
else{
  setTipo(null)
}
setForm({
    id_vehiculo: id ? id : "",
    fecha: '',
    id_concepto: '',
    id_forma_cobro: '',
    id_cliente: '',
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    observacion: '',
    cuenta: '',
    ingreso_egreso: '',
    genera_recibo: 1,
    cta_cte_proveedores: 1,
    cuenta_secundaria: '',
    tipo_comprobante: '',
    numero_comprobante_1: '',
    numero_comprobante_2: '',
    cod_proveedor: '',
    usuario: username,
})
}, [isEgresos, isIngresos, tipo])

useEffect(() => {
if(isEgresos){
  setConceptosFiltrados(conceptos.filter(e => e.ingreso_egreso === "E"))
}
else if(isIngresos){
  setConceptosFiltrados(conceptos.filter(e => e.ingreso_egreso === "I"))
}
else{
  setConceptosFiltrados(conceptos)
}
}, [conceptos, isEgresos, isIngresos])

useEffect(() => {
  if(!tipo){
    if(conceptos.find(e => e.id == form.id_concepto)?.ingreso_egreso === "I"){
      setTipo("I")
    }
  }
}, [form.id_concepto, conceptos, tipo])

useEffect(() => {
  if(!tipo){
    if(conceptos.find(e => e.id == form.id_concepto)?.ingreso_egreso === "E"){
      setTipo("E")
    }
  }
}, [form.id_concepto, conceptos, tipo])

useEffect(() => {
  if (nro_recibo_ingreso) {
    dispatch(getReciboIngresoById({ id: nro_recibo_ingreso }));
  }
}, [nro_recibo_ingreso])

useEffect(() => {
  if(html_recibo_ingreso){
    Swal.fire({
      title: '¿Desea imprimir el recibo?',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      icon: 'warning',
      didOpen: () => {
        document.body.classList.remove('swal2-height-auto');
      }
    }).then((result) => {
    if (result.isConfirmed) {
    const win = window.open('', '_blank');
    win.document.write(html_recibo_ingreso);
    win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
    win.onafterprint = () => {
      win.close();
    };
  }, 500);
    }
    }).finally(() => {
      dispatch(resetIngreso())
    });
  }
}, [html_recibo_ingreso])

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
    if(!tipo || tipo !== "E"){
      setForm({
       ...form,
       [name]: parseFloat(value),
       "importe_iva": parseFloat(value) * 0.21,
       "importe_total": (parseFloat(value) * 0.21) + parseFloat(value)
     }); 
    }else if(tipo === "E"){
      if(form.tipo_comprobante == 3){
      setForm({
       ...form,
       [name]: parseFloat(value),
       "importe_iva": 0,
       "importe_total": parseFloat(value)
      }); 
      }
      else if(form.tipo_comprobante == 1){
      setForm({
       ...form,
       [name]: parseFloat(value),
       "importe_iva": parseFloat(value) * 0.21,
       "importe_total": (parseFloat(value) * 0.21) + parseFloat(value)
     }); 
      }

    }
  }
  else if(value && name === "id_concepto"){
      setForm({
     ...form,
     [name]: value,
     "cuenta": conceptos?.find(e => e.id == value)?.cuenta_contable,
     "cuenta_secundaria": conceptos?.find(e => e.id == value)?.cuenta_secundaria,
     "ingreso_egreso": conceptos.find(e => e.id == value)?.ingreso_egreso,
     "id_forma_cobro": ""
   }); 
  }
  else if(value && name === "importe_iva"){
      setForm({
     ...form,
     [name]: value,
     "importe_total": parseFloat(value) + parseFloat(form["importe_neto"])
   }); 
  }
  else if(value && name == "numero_comprobante_1"){
    if (value.length > 5) value = value.slice(0, 5)
      setForm({
     ...form,
     [name]: value,
   }); 
  }
  else if(value && name == "numero_comprobante_2"){
    if (value.length > 8) value = value.slice(0, 8)
      setForm({
     ...form,
     [name]: value,
   }); 
  }
  else if(value && name == "cod_proveedor"){
    setForm({
     ...form,
     [name]: value,
     tipo_comprobante: proveedores?.find(e => e.Codigo == value)?.TipoResponsable == 1 ? 1 : 3,
      importe_neto: 0,
     importe_iva: 0,
     importe_total: 0
   }); 
  }
  else if(value && name == "tipo_comprobante"){
      setForm({
     ...form,
     [name]: value,
     importe_neto: 0,
     importe_iva: 0,
     importe_total: 0
     
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
  if(conceptos.find(e => e.id == form.id_concepto).ingreso_egreso == "I" && !form.id_cliente){
    toast.error("Si elige un ingreso debe seleccionar un cliente", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
  }else{
    dispatch(postCostos_Ingresos(form))
  }
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
    <h2> {isIngresos ? "Ingresos" : isEgresos ? "Egresos" : "Ingresos y egresos"} del vehículo</h2>
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
      <h2>Alta de {isIngresos ? "ingresos" : isEgresos ? "egresos" : "ingresos/egresos"} del vehículo</h2>
      <div className={styles.formContainer}>
      <form action="" enctype="multipart/form-data" className={styles.form}>
      <div className={styles.inputContainer}>
          <span>Fecha</span>
          <input type="date" name='fecha' value={form["fecha"]} 
        onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
        <span>Concepto</span>
        <select name="id_concepto" style={{width: "130%"}}  value={form["id_concepto"]} 
        onChange={handleChange} id="">
          <option value={""} disabled selected>{"Seleccione un concepto"}</option>
          {
            conceptosFiltrados?.length && conceptosFiltrados?.map(e => {
            return <option key={e.id} value={e.id}>{e.id} - {e.nombre}</option>
            })
          }
        </select>
      </div>
      {
        tipo && tipo === "E" && 
      <div className={styles.inputContainer} style={{flexDirection: "row", width: "9rem", height: "3rem"}}>
      <label style={{fontSize: "15px"}}>Cuenta corriente proveedores</label>
      <input
        type="checkbox"
        checked={form.cta_cte_proveedores}
        onChange={(e) =>
          setForm({
            ...form,
            cta_cte_proveedores: e.target.checked ? 1 : 0,
          })
        }
        />

      </div>
      }
      {
        tipo && tipo === "I" &&
    <div className={styles.inputWrapper} >
      <span>Clientes</span>
      <div className={styles.selectWithIcon} style={{
        width: "20rem"
      }}>
        <select name="id_cliente" value={form["id_cliente"]} onChange={handleChange}>
          <option value={""} selected>{"Seleccione un cliente"}</option>
          {
            clientes?.length && clientes.map(e => (
              <option key={e.id} value={e.id}>
                {e.nro_documento} - {e.nombre} {e.apellido}
              </option>
            ))
          }
        </select>
      </div>
      </div>
      }
      { tipo && tipo === "E"  && form.cta_cte_proveedores == 1 &&
      <div className={styles.inputContainer}>
        <span>Proveedores</span>
        <select name="cod_proveedor" style={{width: "130%"}}  value={form["cod_proveedor"]} 
        onChange={handleChange} id="">
          <option value={""} disabled selected>{"Seleccione un proveedor"}</option>
          {
            proveedores?.length && proveedores?.map(e => {
            return <option key={e.Codigo} value={e.Codigo}>{e.RazonSocial}</option>
            })
          }
        </select>
      </div>

      }
      { tipo && tipo === "E" &&
      <div className={styles.inputContainer}>
        <span>Tipo comprobante</span>
        <select name="tipo_comprobante" style={{width: "130%"}}  value={form["tipo_comprobante"]} 
        onChange={handleChange} id="">
          <option value={0}></option>
          <option value={1}>FA</option>
          <option value={3}>FC</option>
        </select>
      </div>

      }
      { tipo && tipo === "E" &&
      <div className={styles.inputContainer}>
        <span>Punto de venta</span>
        <input type="number" name='numero_comprobante_1' value={form.numero_comprobante_1}
        onChange={handleChange} max="99999" />
      </div>

      }
      { tipo && tipo === "E" &&
      <div className={styles.inputContainer}>
        <span>Nº Comprobante</span>
        <input type="number" name='numero_comprobante_2' value={form.numero_comprobante_2}
        onChange={handleChange} max="99999999" />
      </div>

      }
      <div className={styles.inputContainer}>
          <span>Importe neto</span>
          <input type="number" name='importe_neto' value={form["importe_neto"]} 
        onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
          <span>IVA</span>
          <input type="number" name='importe_iva' value={form["importe_iva"]} 
          disabled={tipo && tipo === "E" && form.cta_cte_proveedores == 1 && form.tipo_comprobante == 3 ? true : false}
          onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Total</span>
          <input type="number" name='importe_total' value={form["importe_total"]} disabled/>
      </div>
      <div className={styles.inputContainer}>
        <span>Forma de cobro</span>
        <select name="id_forma_cobro" disabled={form.cta_cte_proveedores === 1 && form.ingreso_egreso === "E" ? true : false}  value={form["id_forma_cobro"]} 
        onChange={handleChange} id="">
          <option value={""} disabled selected>{"Seleccione una opción"}</option>
          {
            formasDeCobro?.length && formasDeCobro?.map(e => {
              return <option key={e.id} value={e.id}>{e.nombre}</option>
            })
          }
        </select>
      </div>
      <div className={styles.inputContainer}>
          <span>Observacion</span>
          <textarea type="text" name='observacion' value={form["observacion"]} 
        onChange={handleChange}/>
      </div>
      {
      tipo && tipo === "I" && 
      <div className={styles.inputContainer} style={{flexDirection: "row", width: "9rem", height: "3rem"}}>
      <label style={{fontSize: "15px"}}>Genera recibo y factura</label>
      <input
        type="checkbox"
        checked={form.genera_recibo}
        onChange={(e) =>
          setForm({
            ...form,
            genera_recibo: e.target.checked ? 1 : 0,
          })
        }
        />

      </div>
      }
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