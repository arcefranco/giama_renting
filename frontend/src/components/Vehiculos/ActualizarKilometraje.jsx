import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import styles from './VehiculosForm.module.css'

const ActualizarKilometraje = () => {
  const { username } = useSelector((state) => state.loginReducer)
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
      alert('Solo se permiten archivos Excel (.xls, .xlsx)')
      return
    }
    setArchivoKm(file)
  }

  const handleDropZoneClick = () => excelKm.current?.click()

  const handleKmFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setArchivoKm(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!archivoKm) {
      alert('Por favor, seleccioná un archivo Excel.')
      return
    }
    // TODO: dispatch acción de kilometraje cuando exista el endpoint
    alert('La ruta del backend para actualizar kilometraje todavía no está conectada.')
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
          onClick={handleSubmit}
          disabled={!archivoKm}
        >
          Subir
        </button>
      </div>
    </>
  )
}

export default ActualizarKilometraje
