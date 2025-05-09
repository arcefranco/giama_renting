import React, {useState, useEffect, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import styles from "./AltaCostos.module.css"
import { getCuentasContables, postConceptoCostos, reset } from '../../reducers/Costos/costosSlice'

const AltaCostos = () => {
const dispatch = useDispatch()
    useEffect(() => {
    Promise.all([
        dispatch(getCuentasContables()),
    ])
}, [])

const {isError, isSuccess, isLoading, message, cuentasContables} = useSelector((state) => state.costosReducer)
const [form, setForm] = useState({
    nombre: '',
    cuenta_contable: '',
    cuenta_secundaria: '',
    ingreso_egreso: ''
})
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
            cuenta_secundaria: '',
            ingreso_egreso: ''
        })
    }

  }, [isError, isSuccess]) 
const handleChange = (e) => {
    const { name, value } = e.target;
    if(name === "cuenta_contable"){
        setForm({
            ...form,
            "cuenta_contable": value,
            "cuenta_secundaria": cuentasContables?.find(e => e.Codigo == value)?.CuentaSecundaria
        })
    }else{
        setForm({
         ...form,
         [name]: value,
       }); 

    }
};
const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postConceptoCostos(form))
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
            <h2>Alta de conceptos de costos</h2>
            <form action="" enctype="multipart/form-data" className={styles.form}>
            <div className={styles.inputContainer}>
                <span>Concepto</span>
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
            <div className={styles.inputContainer}>
            <span>Tipo</span>
            <label>
              <input
                type="radio"
                name="ingreso_egreso"
                value="I"
                checked={form.ingreso_egreso === "I"}
                onChange={handleChange}
              />
              Ingreso
            </label>
            <label>
              <input
                type="radio"
                name="ingreso_egreso"
                value="E"
                checked={form.ingreso_egreso === "E"}
                onChange={handleChange}
              />
              Egreso
            </label>
          </div>
            </form>
            <button 
            className={styles.sendBtn} onClick={handleSubmit} 
            disabled={!form["cuenta_contable"] || !form["nombre"]  || !form["ingreso_egreso"]}>
              Enviar
            </button>
          </div>
</div>
  )
}

export default AltaCostos