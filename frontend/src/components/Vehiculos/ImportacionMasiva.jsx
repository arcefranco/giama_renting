import { useRef, useState } from 'react'
import styles from './VehiculosForm.module.css'
import { useSelector, useDispatch } from 'react-redux'
import { postVehiculosMasivos, reset } from '../../reducers/Vehiculos/vehiculosSlice'
import { useToastFeedback } from '../../customHooks/useToastFeedback'
import { ToastContainer } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import downloadicon from "../../assets/downloadicon.svg";
import ActualizarKilometraje from './ActualizarKilometraje';

const ImportacionMasiva = () => {
  const dispatch = useDispatch()
  const { isError, isSuccess, isLoading, message } = useSelector((state) => state.vehiculosReducer)
  const { username } = useSelector((state) => state.loginReducer)
  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
  })
  
  const excel = useRef()
  const [tipoImportacion, setTipoImportacion] = useState('vehiculos')

  const handleSubmit = (e) => {
    e.preventDefault();

    const archivo = excel.current?.files?.[0];
    if (!archivo) {
      alert('Por favor, seleccioná un archivo Excel.');
      return;
    }
    const extension = archivo.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx'].includes(extension)) {
      alert(`El archivo ${archivo.name} no es válido. Solo se permiten planillas Excel (.xls, .xlsx)`);
      return;
    }
    dispatch(postVehiculosMasivos({ file: archivo, usuario: username }));
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
          <p className={styles.loadingText}>
            {tipoImportacion === 'vehiculos' ? "Ingresando vehículos..." : "Actualizando kilometrajes..."}
          </p>
        </div>
      )}
      <div>
        {/* TABS */}
        <div className={styles.tabsBar}>
          <button
            className={`${styles.tabBtn} ${tipoImportacion === 'vehiculos' ? styles.tabBtnActive : ''}`}
            onClick={() => setTipoImportacion('vehiculos')}
          >
            Importar Vehículos
          </button>
          <button
            className={`${styles.tabBtn} ${tipoImportacion === 'kilometraje' ? styles.tabBtnActive : ''}`}
            onClick={() => setTipoImportacion('kilometraje')}
          >
            Actualizar Kilometraje
          </button>
        </div>

        <div className={styles.sectionHeader}>
          <h2>
            {tipoImportacion === 'vehiculos' ? 'Importación masiva de vehículos' : 'Actualización masiva de kilometraje'}
          </h2>
          <button
            className={styles.downloadBtn}
            onClick={() => {
              const url = tipoImportacion === 'kilometraje'
                ? '/plantilla_actualizacion_km.xlsx'
                : '/importacion_masiva_vehiculos_planilla.xlsx';
              window.open(url, '_blank');
            }}
          >
            <img src={downloadicon} alt="Descargar" className={styles.downloadIcon} />
            Descargar plantilla
          </button>
        </div>

        <div className={styles.container} style={tipoImportacion === 'vehiculos' ? { justifySelf: "center" } : {}}>
          {tipoImportacion === 'vehiculos' ? (
            <>
              <div className={styles.inputContainer} style={{width: "16rem", justifyContent: "space-between"}}>
                <span>Ingrese el archivo excel</span>
                <input type="file" name="file" accept=".xls,.xlsx" style={{ fontSize: "10px"}} ref={excel} />
              </div>
              <button className={styles.sendBtn} onClick={handleSubmit}>Enviar</button>
            </>
          ) : (
            <ActualizarKilometraje />
          )}
        </div>
      </div>
    </>
  )
}

export default ImportacionMasiva