import { useRef, useState } from 'react'
import styles from './VehiculosForm.module.css'
import { useSelector, useDispatch } from 'react-redux'
import { postVehiculosMasivos, reset } from '../../reducers/Vehiculos/vehiculosSlice'
import { useToastFeedback } from '../../customHooks/useToastFeedback'
import { ToastContainer } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import downloadicon from "../../assets/downloadicon.svg";
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
  const excelKm = useRef()
  const [tipoImportacion, setTipoImportacion] = useState('vehiculos')
  const [archivoKm, setArchivoKm] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx'].includes(ext)) {
      alert('Solo se permiten archivos Excel (.xls, .xlsx)');
      return;
    }
    setArchivoKm(file);
  }

  const handleDropZoneClick = () => excelKm.current?.click();

  const handleKmFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setArchivoKm(file);
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    if (tipoImportacion === 'kilometraje') {
      if (!archivoKm) { alert('Por favor, seleccioná un archivo Excel.'); return; }
      // TODO: dispatch acción de kilometraje cuando exista el endpoint
      alert('La ruta del backend para actualizar kilometraje todavía no está conectada.');
      return;
    }

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
          <p className={styles.loadingText}>{tipoImportacion === 'vehiculos' ? "Ingresando vehículos..." : "Actualizando kilometrajes..."}</p>
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

        <div className={styles.container}>
          {tipoImportacion === 'vehiculos' ? (
            <>
              <div className={styles.inputContainer}>
                <span>Ingrese el archivo excel</span>
                <input type="file" name="file" accept=".xls,.xlsx" ref={excel} />
              </div>
              <button className={styles.sendBtn} onClick={handleSubmit}>Enviar</button>
            </>
          ) : (
            <>
              <input
                type="file"
                accept=".xls,.xlsx"
                ref={excelKm}
                onChange={handleKmFileChange}
                style={{ display: 'none' }}
              />
              <div
                className={`${styles.dropZone} ${isDragging ? styles.dropZoneDragging : ''}`}
                onClick={handleDropZoneClick}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className={styles.dropZoneIcon}>☁️</div>
                {archivoKm ? (
                  <>
                    <p className={styles.dropZoneFileName}>{archivoKm.name}</p>
                    <p className={styles.dropZoneHint}>Hacé clic para cambiar el archivo</p>
                  </>
                ) : (
                  <>
                    <p className={styles.dropZoneTitle}>Arrastrá tu archivo aquí</p>
                    <p className={styles.dropZoneSubtitle}>o hacé clic para explorar</p>
                  </>
                )}
              </div>
              <div className={styles.dropZoneActions}>
                <button
                  className={styles.sendBtn}
                  onClick={handleSubmit}
                  disabled={!archivoKm}
                >
                  Subir
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default ImportacionMasiva