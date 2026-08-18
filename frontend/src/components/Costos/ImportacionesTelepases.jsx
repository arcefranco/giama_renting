import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { postImportacionesTelepases, reset } from '../../reducers/Costos/costosSlice';
import { ClipLoader } from "react-spinners";
import * as XLSX from 'xlsx';
import styles from '../Vehiculos/VehiculosForm.module.css';

const getFormattedDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}_${mm}_${yyyy}`;
};

const downloadErrorsExcel = (errors) => {
    const data = errors.map(err => ({ Error: typeof err === 'string' ? err : String(err) }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Errores");
    XLSX.writeFile(workbook, `Errores_Importacion_Telepases_${getFormattedDate()}.xlsx`);
};

const ImportacionesTelepases = () => {
    const dispatch = useDispatch();
    const { isLoading, isError, isSuccess, message, errores_importacion, guardados_importacion } = useSelector((state) => state.costosReducer);
    
    const excelFile = useRef(null);
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localErrors, setLocalErrors] = useState([]);
    const [localGuardados, setLocalGuardados] = useState([]);

    useEffect(() => {
        if (isError) {
            toast.error(message || "Ocurrió un error al importar.");
            if (errores_importacion && errores_importacion.length > 0) {
                setLocalErrors(errores_importacion);
                downloadErrorsExcel(errores_importacion);
            }
        }
        if (isSuccess) {
            toast.success(message || "¡Telepases importados correctamente!");
            setFile(null);
            if (guardados_importacion && guardados_importacion.length > 0) {
                setLocalGuardados(guardados_importacion);
            }
            if (errores_importacion && errores_importacion.length > 0) {
                setLocalErrors(errores_importacion);
                downloadErrorsExcel(errores_importacion);
            } else {
                setLocalErrors([]);
            }
        }
        if (isSuccess || isError) {
            dispatch(reset());
        }
    }, [isError, isSuccess, message, errores_importacion, guardados_importacion, dispatch]);

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
        setLocalGuardados([]);
        const formData = new FormData();
        formData.append("file", file);
        dispatch(postImportacionesTelepases(formData));
    };

    const montoTotal = localGuardados.reduce((acc, g) => acc + (g.importeTotal || 0), 0);
    const totalPasadas = localGuardados.reduce((acc, g) => acc + (g.cantidadPasadas || 0), 0);

    return (
        <>
            <ToastContainer />
            {isLoading && (
                <div className={styles.spinnerOverlay}>
                    <ClipLoader
                        size={60}
                        color="#800020"
                        loading={true}
                    />
                    <p className={styles.loadingText}>Procesando telepases consolidados...</p>
                </div>
            )}
            
            <div>
                <div className={styles.sectionHeader} style={{ marginTop: "20px", marginLeft: "20px", marginRight: "20px" }}>
                    <h2>Importación masiva de telepases (consolidado)</h2>
                </div>

                <p style={{ marginLeft: "20px", marginRight: "20px", color: "#666", fontSize: "14px" }}>
                    Subí el archivo Excel con la pestaña <strong>PASADAS</strong>. El sistema agrupará las pasadas por patente/chofer y generará un solo cargo consolidado por cliente.
                </p>

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
                            Subir Telepases
                        </button>
                    </div>
                </div>

                {/* Resumen de importación exitosa */}
                {localGuardados.length > 0 && (
                    <div className={styles.infoContainer}>
                        <h3 className={styles.infoTitle}>
                            ✅ Resumen de la importación — {localGuardados.length} cliente(s) procesado(s)
                        </h3>
                        <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#333" }}>
                            <strong>Total pasadas:</strong> {totalPasadas} | <strong>Monto total:</strong> ${montoTotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </p>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Chofer</th>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Patente(s)</th>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd", textAlign: "center" }}>Pasadas</th>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd", textAlign: "right" }}>Importe</th>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Período</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localGuardados.map((g, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "8px" }}>{g.chofer || "S/D"}</td>
                                        <td style={{ padding: "8px" }}>{Array.isArray(g.patentes) ? g.patentes.join(", ") : g.patentes}</td>
                                        <td style={{ padding: "8px", textAlign: "center" }}>{g.cantidadPasadas}</td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>${(g.importeTotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                                        <td style={{ padding: "8px" }}>{g.rangoFechas || "S/D"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Errores / Observaciones */}
                <div className={styles.infoContainer}>
                    <h3 className={styles.infoTitle}>
                         Info - Reporte de la última importación
                    </h3>
                    {localErrors && localErrors.length > 0 ? (
                        <div className={styles.errorList}>
                            {localErrors.map((err, idx) => (
                                <div key={idx} className={styles.errorCard}>
                                    <p className={styles.errorText}>{typeof err === 'string' ? err : String(err)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.emptyState}>No se han registrado errores o no se ha realizado ninguna importación aún.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default ImportacionesTelepases;

