import { useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import styles from './VehiculosForm.module.css'
import { postActualizarKilometraje } from '../../reducers/Vehiculos/vehiculosSlice'

const ActualizarKilometraje = () => {
  const dispatch = useDispatch()
  const excelKm = useRef()
  const [archivoKm, setArchivoKm] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xls', 'xlsx'].includes(ext)) {
      toast.error('Solo se permiten archivos Excel (.xls, .xlsx)')
      return
    }
    setArchivoKm(file)
  }

  const handleDropZoneClick = () => excelKm.current?.click()

  const handleKmFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setArchivoKm(file)
  }

  const handleSubmitKilometraje = async (e) => {
    console.log("submit");
    e.preventDefault()
    if (!archivoKm) {
      toast.error('Por favor, seleccioná un archivo Excel.')
      return
    }

    const res = await dispatch(postActualizarKilometraje(archivoKm))

    // El backend devuelve { status: true/false, message: "..." }
    if (res.payload?.status) {
      toast.success(res.payload.message || 'Archivo subido correctamente')
      setArchivoKm(null) // Limpiar después del éxito
    } else {
      toast.error(res.payload?.message || 'Error al subir el archivo')
    }
  }

  return (
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
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
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
          onClick={handleSubmitKilometraje}
          disabled={!archivoKm}
        >
          Subir 
        </button>
      </div>
    </>
  )
}

export default ActualizarKilometraje
