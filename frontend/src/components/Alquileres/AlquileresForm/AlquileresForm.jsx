import React, {useState, useEffect, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import {getModelos} from '../../../reducers/Generales/generalesSlice.js'
import {getFormasDeCobro, reset, postAlquiler} from '../../../reducers/Alquileres/alquileresSlice.js'
import {getVehiculos} from '../../../reducers/Vehiculos/vehiculosSlice.js'
import {getClientes} from '../../../reducers/Clientes/clientesSlice.js'
import { ClipLoader } from "react-spinners";
import styles from "./AlquileresForm.module.css"

const AlquileresForm = () => {
const dispatch = useDispatch()
const {isError, isSuccess, isLoading, message, formasDeCobro} = useSelector((state) => state.alquileresReducer)
const {vehiculos} = useSelector((state) => state.vehiculosReducer)
const {clientes} = useSelector((state) => state.clientesReducer)
const {modelos} = useSelector((state) => state.generalesReducer)
const [form, setForm] = useState({
    id_vehiculo: '',
    id_cliente: '',
    fecha_desde: '',
    fecha_hasta: '',
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    id_forma_cobro: '',
    cuenta_contable_forma_cobro: ''
})
useEffect(() => {
Promise.all([
    dispatch(getVehiculos()),
    dispatch(getClientes()),
    dispatch(getModelos()),
    dispatch(getFormasDeCobro())
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
            nombre: '',
            cuenta_contable: '',
        })
    }

}, [isError, isSuccess]) 
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
else if(value && name === "importe_iva"){
      setForm({
     ...form,
     [name]: value,
     "importe_total": parseFloat(value) + parseFloat(form["importe_neto"])
   }); 
}
else if(value && name === "id_forma_cobro"){
      setForm({
     ...form,
     [name]: value,
     "cuenta_contable_forma_cobro": formasDeCobro.find(e => e.id == value)?.cuenta_contable
   }); 
}
else{
    setForm({
     ...form,
     [name]: value,
   }); 

}
}
const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postAlquiler(form))
} 
  return (
    <div> 
        <div className={styles.container}>
            <ToastContainer /> 
              {isLoading && (
          <div className={styles.spinnerOverlay}>
            <ClipLoader
              size={60}
              color="#800020" // bordó
              loading={true}
            />
            <p className={styles.loadingText}>Cargando...</p>
          </div>
        )}
                <h2>Alta de alquiler</h2>
                <form action="" enctype="multipart/form-data" className={styles.form}>
                <div className={styles.inputContainer}>
                  <span>Clientes</span>
                  <select name="id_cliente"  value={form["id_cliente"]} 
                  onChange={handleChange} id="">
                    <option value={""} disabled selected>{"Seleccione un cliente"}</option>
                    {
                      clientes?.length && clientes?.map(e => {
                    return <option key={e.id} value={e.id}>{e.nro_documento} - {e.nombre} {e.apellido}</option>
                      })
                    }
                  </select>
                </div>
                <div className={styles.inputContainer}>
                  <span>Vehículo</span>
                  <select name="id_vehiculo"  value={form["id_vehiculo"]} 
                  onChange={handleChange} id="">
                    <option value={""} disabled selected>{"Seleccione un vehículo"}</option>
                    {
                      vehiculos?.length && vehiculos?.map(e => {
                        return <option key={e.id} value={e.id}>{e.dominio} - {modelos.find(m => m.id == e.modelo)?.nombre} - {
                            e.proveedor_gps && e.nro_serie_gps && e.calcomania && e.gnc ? "PREPARADO" : "SIN PREPARAR"
                        }</option>
                      })
                    }
                  </select>
                </div>
                <div className={styles.inputContainer}>
                    <span>Fecha desde</span>
                    <input type="date" name='fecha_desde' value={form["fecha_desde"]} 
                  onChange={handleChange}/>
                </div>
                <div className={styles.inputContainer}>
                    <span>Fecha hasta</span>
                    <input type="date" name='fecha_hasta' value={form["fecha_hasta"]} 
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
                    <span>Importe total</span>
                    <input type="number" name='importe_total' disabled value={form["importe_total"]} 
                  onChange={handleChange}/>
                </div>
                <div className={styles.inputContainer}>
                  <span>Formas de cobro</span>
                  <select name="id_forma_cobro"  value={form["id_forma_cobro"]} 
                  onChange={handleChange} id="">
                    <option value={""} disabled selected>{"Seleccione una opción"}</option>
                    {
                      formasDeCobro?.length && formasDeCobro?.map(e => {
                        return <option key={e.id} value={e.id}>{e.nombre}</option>
                      })
                    }
                  </select>
                </div>
                </form>
                <button 
                className={styles.sendBtn} onClick={handleSubmit} 
                disabled={!form["id_vehiculo"] || !form["id_cliente"] ||
                    !form["fecha_desde"] || !form["fecha_hasta"] ||
                    !form["importe_neto"] || !form["importe_iva"] ||
                    !form["importe_total"] || !form["id_forma_cobro"]}>
                  Enviar
                </button>
          </div></div>
  )
}

export default AlquileresForm