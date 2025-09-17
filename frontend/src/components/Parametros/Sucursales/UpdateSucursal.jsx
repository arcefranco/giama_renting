import React, {useState, useEffect} from 'react'
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer} from 'react-toastify';
import { ClipLoader } from "react-spinners";
import {getSucursalById, reset, updateSucursal} from "../../../reducers/Parametros/parametrosSlice"
import { useToastFeedback } from '../../../customHooks/useToastFeedback';
import styles from "./../Parametros.module.css"

const UpdateSucursal = () => {
  const {id} = useParams()
  const dispatch = useDispatch()
  const {isError, isSuccess, isLoading, message, sucursalById} = useSelector((state) => state.parametrosReducer)
  useEffect(() => {
    if(id){
      dispatch(getSucursalById({id: id}))
    }
  }, [id])
const [form, setForm] = useState({
    id: id,
    nombre: "",
})
useEffect(() => {
if(sucursalById?.length){
    setForm({
      id: id,
      nombre: sucursalById[0]["nombre"],
    })
}
}, [sucursalById, id])
useToastFeedback({
  isError,
  isSuccess,
  message,
  resetAction: reset
})

const handleChange = (e) => {
const { name, value } = e.target;

setForm({
    ...form,
    [name]: value,
});
}

const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(updateSucursal(form))
} 
  return (
    <div>
      <div className={styles.container}>
      <h2>Actualizar sucursal</h2>
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
            <form action="" enctype="multipart/form-data" className={styles.form}>
            <div className={styles.inputContainer}>
                <span>Nombre</span>
                <input type="text" name='nombre' value={form["nombre"]} 
              onChange={handleChange}/>
            </div>
            </form>
            <button 
            className={styles.sendBtn} onClick={handleSubmit} 
            disabled={!form["nombre"]}>
              Enviar
            </button>
      </div>
    </div>
  )
}

export default UpdateSucursal