import React, {useState, useEffect} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import {recoveryPass, reset} from "../../../reducers/Usuarios/usuariosSlice.js"
import styles from "../AltaUsuario/AltaUsuario.module.css"
import { ClipLoader } from 'react-spinners';
import { createPass } from '../../../reducers/Usuarios/usuariosSlice.js';
import { Link } from 'react-router-dom';
const RecoveryPass = () => {

const dispatch = useDispatch()
const {isError, isSuccess, isLoading, message} = useSelector((state) => state.usuariosReducer)
const [form, setForm] = useState({
    email: '',
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
         email: ''   
        })
    }

}, [isError, isSuccess])

const handleChange = (e) => {
    const { name, value } = e.target;
        setForm({
         ...form,
         [name]: value,
       }); 

};
const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(recoveryPass(form))    
} 
  return (
    <div style={{
    alignContent: "center",
    backgroundColor: "#9999990a",
    height: "-webkit-fill-available"
    }}>
    <Link to="/" style={{
    top: 0,
    position: "absolute",
    margin: "2rem"
    }}>{"< Volver"}</Link>
      <div className={styles.container} style={{
        alignSelf: "center"
      }}>
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

    <h2>Recuperar contraseña</h2>
    <form action="" enctype="multipart/form-data" className={styles.form} style={{
        gridTemplateColumns: "1fr"
      }}>
      <div className={styles.inputContainer}>
          <span>Email</span>
          <input type="text" name='email' value={form["email"]} 
        onChange={handleChange}/>
      </div>
     </form>
    <button 
    className={styles.sendBtn} onClick={handleSubmit} 
    disabled={!form["email"] }>
      Enviar
    </button>
    </div>
  </div>
  )
}

export default RecoveryPass