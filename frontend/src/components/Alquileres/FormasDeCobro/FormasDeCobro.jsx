import React, {useState, useEffect, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import { getCuentasContables } from '../../../reducers/Costos/costosSlice'
import {postFormaCobro, reset} from '../../../reducers/Alquileres/alquileresSlice'
import { ClipLoader } from "react-spinners";
import styles from "./FormasDeCobro.module.css"

const FormasDeCobro = () => {
const dispatch = useDispatch()
const {isError, isSuccess, isLoading, message} = useSelector((state) => state.alquileresReducer)
const {cuentasContables} = useSelector((state) => state.costosReducer)
const [form, setForm] = useState({
    nombre: '',
    cuenta_contable: '',
})
useEffect(() => {
Promise.all([
    dispatch(getCuentasContables())
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
setForm({
    ...form,
    [name]: value,
}); 
}
const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postFormaCobro(form))
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
            <h2>Alta de formas de cobro</h2>
            <form action="" enctype="multipart/form-data" className={styles.form}>
            <div className={styles.inputContainer}>
                <span>Nombre</span>
                <input type="text" name='nombre' value={form["nombre"]} 
              onChange={handleChange}/>
            </div>
            <div className={styles.inputContainer}>
              <span>Cuenta contable</span>
              <select name="cuenta_contable"  value={form["cuenta_contable"]} 
              onChange={handleChange} id="">
                <option value={""} disabled selected>{"Seleccione una cuenta"}</option>
                {
                  cuentasContables?.length && cuentasContables?.map(e => {
                    return <option key={e.Codigo} value={e.Codigo}>{e.Codigo} - {e.Nombre}</option>
                  })
                }
              </select>
            </div>
            </form>
            <button 
            className={styles.sendBtn} onClick={handleSubmit} 
            disabled={!form["cuenta_contable"] || !form["nombre"]}>
              Enviar
            </button>
      </div>
    </div>
  )
}

export default FormasDeCobro