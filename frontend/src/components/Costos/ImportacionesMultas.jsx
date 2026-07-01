import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { postImportacionesMultas, reset } from '../../reducers/Costos/costosSlice';
import { ClipLoader } from "react-spinners";
import downloadicon from "../../assets/downloadicon.svg";
import styles from '../Vehiculos/VehiculosForm.module.css';
const parseError = (err) => {
    if (typeof err !== 'string') return { message: String(err) };
    const match = err.match(/^Fila (\d+) \(Dominio: ([^,]+), Acta: ([^\)]+)\): (.+)$/);
    if (match) {
        return {
            fila: match[1],
            dominio: match[2],
            acta: match[3],
            message: match[4]
        };
    }
    return { message: err };
};

const getFormattedDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}_${mm}_${yyyy}`;
};

const ImportacionesMultas = () => {
    const dispatch = useDispatch();
    const { isLoading, isError, isSuccess, message, errores_importacion } = useSelector((state) => state.costosReducer);
    
    const excelFile = useRef(null);
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localErrors, setLocalErrors] = useState([]);

    useEffect(() => {
        if (isError) {
            toast.error(message || "Ocurrió un error al importar.");
            if (errores_importacion && errores_importacion.length > 0) {
                setLocalErrors(errores_importacion);
            }
        }
        if (isSuccess) {
            toast.success(message || "¡Multas importadas correctamente!");
            setFile(null);
            if (errores_importacion && errores_importacion.length > 0) {
                setLocalErrors(errores_importacion);
            } else {
                setLocalErrors([]);
            }
        }
        if (isSuccess || isError) {
            dispatch(reset());
        }
    }, [isError, isSuccess, message, errores_importacion, dispatch]);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (!droppedFile) return;
        
        const ext = droppedFile.name.split('.').pop().toLowerCase();
        if (!['xls', 'xlsx'].includes(ext)) {
            toast.error('Solo se permiten archivos Excel (.xls, .xlsx)');
            return;
        }
        setFile(droppedFile);
    };

    const handleDropZoneClick = () => excelFile.current?.click();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) setFile(selectedFile);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Por favor, seleccioná un archivo Excel.");
            return;
        }
        setLocalErrors([]);
        const formData = new FormData();
        formData.append("file", file);
        dispatch(postImportacionesMultas(formData));
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch('/Plantilla_Multas.xlsx');
            if (!response.ok) throw new Error("Error al obtener la plantilla");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Plantilla_Multas_${getFormattedDate()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error("Ocurrió un error al descargar la plantilla.");
        }
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
                    <p className={styles.loadingText}>Importando multas...</p>
                </div>
            )}
            
            <div>
                <div className={styles.sectionHeader} style={{ marginTop: "20px", marginLeft: "20px", marginRight: "20px" }}>
                    <h2>Importación masiva de multas</h2>
                    <button
                        className={styles.downloadBtn}
                        onClick={handleDownloadTemplate}
                    >
                        <img src={downloadicon} alt="Descargar" className={styles.downloadIcon} />
                        Descargar plantilla
                    </button>
                </div>

                <div className={styles.container}>
                    <input
                        type="file"
                        accept=".xls,.xlsx"
                        ref={excelFile}
                        onChange={handleFileChange}
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
                        {file ? (
                            <>
                                <p className={styles.dropZoneFileName}>{file.name}</p>
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
                            disabled={!file || isLoading}
                        >
                            Subir Multas
                        </button>
                    </div>
                </div>

                {/* Componente Info debajo de la card */}
                <div className={styles.infoContainer}>
                    <h3 className={styles.infoTitle}>
                         Info - Reporte de la última importación
                    </h3>
                    {localErrors && localErrors.length > 0 ? (
                        <div className={styles.errorList}>
                            {localErrors.map((err, idx) => {
                                const parsed = parseError(err);
                                return (
                                    <div key={idx} className={styles.errorCard}>
                                        <div className={styles.badgeRow}>
                                            {parsed.fila && <strong>Fila {parsed.fila}</strong>}
                                            {parsed.dominio && <span> - <strong>Dominio:</strong> {parsed.dominio}</span>}
                                            {parsed.acta && <span> - <strong>Acta:</strong> {parsed.acta}</span>}
                                        </div>
                                        <p className={styles.errorText}>{parsed.message}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className={styles.emptyState}>No se han registrado errores o no se ha realizado ninguna importación aún.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default ImportacionesMultas;