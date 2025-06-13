import React, {useState, useEffect} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {useParams} from "react-router-dom"
import { ToastContainer, toast } from 'react-toastify';
import {createUsuario, reset} from "../../../reducers/Usuarios/usuariosSlice.js"
import styles from "../AltaUsuario/AltaUsuario.module.css"
import { ClipLoader } from 'react-spinners';
import { createPass } from '../../../reducers/Usuarios/usuariosSlice.js';
import { Link } from 'react-router-dom';

const AltaPassword = () => {

const dispatch = useDispatch()
const {token} = useParams()
const {isError, isSuccess, isLoading, message} = useSelector((state) => state.usuariosReducer)
const [form, setForm] = useState({
    token: token,
    password: '',
    rePassword: '',
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
            password: '',
            rePassword: ''
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
    if(form["password"] !== form["rePassword"]){
      toast.info("Las contraseñas deben coincidir")
    }else{
      dispatch(createPass(form))
    }
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
    }}>{"< Iniciar sesión"}</Link>
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
    <h2>Crear contraseña</h2>
    <form action="" enctype="multipart/form-data" className={styles.form}>
      <div className={styles.inputContainer}>
          <span>Contraseña</span>
          <input type="password" name='password' value={form["password"]} 
        onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Confirmar contraseña</span>
          <input type="password" name='rePassword' value={form["rePassword"]} 
        onChange={handleChange}/>
      </div>
     </form>
    <button 
    className={styles.sendBtn} onClick={handleSubmit} 
    disabled={!form["password"] || !form["rePassword"] }>
      Enviar
    </button>
    </div>
  </div>
  )
}

export default AltaPassword