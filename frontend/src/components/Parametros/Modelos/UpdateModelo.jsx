import React, {useState, useEffect} from 'react'
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import {getModeloById, reset, updateModelo} from "../../../reducers/Parametros/parametrosSlice"
import { useToastFeedback } from '../../../customHooks/useToastFeedback';
import styles from "./../Parametros.module.css"

const UpdateModelo = () => {
  const {id} = useParams()
  const dispatch = useDispatch()
  const {isError, isSuccess, isLoading, message, modeloById} = useSelector((state) => state.parametrosReducer)
  useEffect(() => {
    if(id){
      dispatch(getModeloById({id: id}))
    }
  }, [id])
const [form, setForm] = useState({
    id_modelo: id,
    precio: 0,
    nombre: "",
})
useEffect(() => {
if(modeloById?.length){
    setForm({
      id_modelo: id,
      nombre: modeloById[0]["nombre_modelo"],
      precio: modeloById[0]["precio"]
    })
}
}, [modeloById, id])
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

const handleChangeNumbers = (e) => {
  const { name, value, type } = e.target;
  const parsedValue = type === "number" && value !== "" ? parseFloat(value) : 0;

    let newForm = { ...form, [name]: parsedValue };
    setForm(newForm);
};

const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(updateModelo(form))
} 
  return (
    <div>
      <div className={styles.container}>
      <h2>Actualizar modelo</h2>
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
            <div className={styles.inputContainer}>
                <span>Precio</span>
                <input type="number" name='precio' value={form["precio"]} 
              onChange={handleChangeNumbers}/>
            </div>
            </form>
            <button 
            className={styles.sendBtn} onClick={handleSubmit} 
            disabled={!form["precio"] || !form["nombre"]}>
              Enviar
            </button>
      </div>
    </div>
  )
}

export default UpdateModelo