import React, {useState, useEffect, useRef} from 'react'
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import styles from "./AltaCostos.module.css"
import { getCuentasContables, getConceptosCostosById, updateConcepto, reset } from '../../reducers/Costos/costosSlice'

const  UpdateConcepto = () => {
const { id } = useParams();
const dispatch = useDispatch()
    useEffect(() => {
    Promise.all([
        dispatch(getConceptosCostosById({id: id})),
        dispatch(getCuentasContables()),
    ])
}, [])

const {isError, isSuccess, isLoading, message, cuentasContables, concepto} = useSelector((state) => state.costosReducer)
const [form, setForm] = useState({
    nombre: '',
    cuenta_contable: '',
    cuenta_secundaria: '',
    id: id
})
useEffect(() => {

  if(isError && message){
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
    if(isSuccess && message){
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
    }

}, [isError, isSuccess]) 
useEffect(() => {
if(concepto){
    setForm({
        nombre: concepto[0]?.nombre,
        cuenta_contable: concepto[0]?.cuenta_contable,
        cuenta_secundaria: concepto[0]?.cuenta_secundaria,
        id: id
    })
}
}, [concepto])
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
    dispatch(updateConcepto(form))
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
            <h2>Actualizar conceptos de costos</h2>
            <form action="" enctype="multipart/form-data" className={styles.form}>
            <div className={styles.inputContainer}>
              <span>Cuenta contable</span>
              <select name="cuenta_contable"  value={form["cuenta_contable"]} 
              onChange={handleChange} id="">
                <option value={""} disabled selected>{"Seleccione un modelo"}</option>
                {
                  cuentasContables?.length && cuentasContables?.map(e => {
                    return <option key={e.Codigo} value={e.Codigo}>{e.Codigo} - {e.Nombre}</option>
                  })
                }
              </select>
            </div>
            <div className={styles.inputContainer}>
                <span>Concepto</span>
                <input type="text" name='nombre' value={form["nombre"]} 
              onChange={handleChange}/>
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

export default UpdateConcepto