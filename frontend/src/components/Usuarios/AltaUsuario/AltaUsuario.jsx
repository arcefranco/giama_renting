import React, {useState, useEffect} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import {createUsuario, reset} from "../../../reducers/Usuarios/usuariosSlice.js"
import styles from "./AltaUsuario.module.css"
import { ClipLoader } from 'react-spinners';
import { getRoles } from '../../../reducers/Generales/generalesSlice.js';
import Select from "react-select";

const AltaUsuario = () => {

const dispatch = useDispatch()
const {isError, isSuccess, isLoading, message} = useSelector((state) => state.usuariosReducer)
const {roles} = useSelector((state) => state.generalesReducer)
const [form, setForm] = useState({
    nombre: '',
    email: '',
    roles: '',
})
const [selectedRoles, setSelectedRoles] = useState([]);
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
            email: '',
            roles: ''
        })
        setSelectedRoles([]);
    }

}, [isError, isSuccess])

useEffect(() => {
dispatch(getRoles())
}, [])



const handleChange = (e) => {
    const { name, value } = e.target;
        setForm({
         ...form,
         [name]: value,
       }); 

};
const handleChangeRoles = (selectedOptions) => {
  setSelectedRoles(selectedOptions);
  const ids = selectedOptions.map(opt => opt.value).join(",");
  setForm({
    ...form,
    roles: ids,
  });
};
const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(createUsuario(form))
} 
  return (
    <div style={{
          marginTop: "5rem"
    }}>
      <div className={styles.container}>
        <ToastContainer /> 
        {isLoading && (
      <div className={styles.spinnerOverlay}>
        <ClipLoader
          size={60}
          color="#800020"
          loading={true}
        />
        <p className={styles.loadingText}>Cargando...</p>
      </div>
    )}
    <h2>Alta de usuario 2</h2>
    <form action="" enctype="multipart/form-data" className={styles.form}>
      <div className={styles.inputContainer}>
          <span>Nombre</span>
          <input type="text" name='nombre' value={form["nombre"]} 
        onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Email</span>
          <input type="text" name='email' value={form["email"]} 
        onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer} style={{fontSize: "13px", width: "14rem"}}> 
        <label>Roles</label>
        <Select
          isMulti
          options={roles.map((r) => ({
            value: r.id,
            label: r.concepto,
          }))}
          value={selectedRoles}  
          onChange={handleChangeRoles}
        />
      </div>
     </form>
    <button 
    className={styles.sendBtn} onClick={handleSubmit} 
    disabled={!form["email"] || !form["nombre"] }>
      Enviar
    </button>
    </div>
  </div>
  )
}

export default AltaUsuario