import React, { useRef } from 'react'
import styles from './VehiculosForm.module.css'
import { useSelector, useDispatch } from 'react-redux'
import { postVehiculosMasivos, reset } from '../../reducers/Vehiculos/vehiculosSlice'
import { useToastFeedback } from '../../customHooks/useToastFeedback'
import { ToastContainer } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import downloadicon from "../../assets/downloadicon.svg";
const ImportacionMasiva = () => {
const dispatch = useDispatch()
const {isError, isSuccess, isLoading, message} = useSelector((state) => state.vehiculosReducer)
const {username} = useSelector((state) => state.loginReducer)
useToastFeedback({
  isError,
  isSuccess,
  message,
  resetAction: reset,
})
const excel = useRef()
const handleSubmit = (e) => {
  e.preventDefault();
  dispatch(postVehiculosMasivos({
    file: excel.current.files[0],
    usuario: username
  }));
};
  return (
    <>
    <ToastContainer /> 
    {isLoading && (
    <div className={styles.spinnerOverlay}>
    <ClipLoader
      size={60}
      color="#800020" // bordó
      loading={true}
    />
    <p className={styles.loadingText}>Ingresando vehículos...</p>
  </div>
)}
<div>
  <div style={{display: "flex", justifyContent: "space-between", width: "90%"}}>
  <h2 style={{margin: "1rem", color: "#800000"}}>Importación masiva de vehículos</h2>
  <button 
  className={styles.sendBtn}
  style={{width: "8rem", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "space-evenly"}}
  onClick={() => window.open("/importacion_masiva_vehiculos_planilla.xlsx", "_blank")}>
    <img 
    src={downloadicon} 
    alt="Descargar" 
    style={{ width: "19px"}}
  />
  Descargar plantilla
  </button>

  </div>
    <div className={styles.container} style={{justifySelf: "center"}}>
        <div className={styles.inputContainer} style={{width: "16rem", justifyContent: "space-between"}}>
            <span>Ingrese el archivo excel</span>
            <input type="file" name='file' accept=".xls,.xlsx" style={{ fontSize: "10px"}}  ref={excel}/>
        </div>
        <button className={styles.sendBtn} onClick={handleSubmit}>Enviar</button>
    </div>

</div>
    </>
  )
}

export default ImportacionMasiva