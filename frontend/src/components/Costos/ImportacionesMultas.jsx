import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { preprocesarMultas, confirmarImportacionMultas, reset } from '../../reducers/Costos/costosSlice';
import { ClipLoader } from "react-spinners";
import * as XLSX from 'xlsx';
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

const downloadErrorsExcel = (errors) => {
    const data = errors.map(err => {
        const parsed = parseError(err);
        return {
            Fila: parsed.fila || '-',
            Dominio: parsed.dominio || '-',
            Acta: parsed.acta || '-',
            Error: parsed.message
        };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Errores");
    XLSX.writeFile(workbook, `Errores_Importacion_Multas_${getFormattedDate()}.xlsx`);
};

const ImportacionesMultas = () => {
    const dispatch = useDispatch();
    const { isError, message, errores_importacion } = useSelector((state) => state.costosReducer);
    const { user } = useSelector((state) => state.authReducer || state.auth || {});
    
    const excelFile = useRef(null);
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localErrors, setLocalErrors] = useState([]);

    // Estados para pre-imputación y modal
    const [isPreprocessing, setIsPreprocessing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [multasPreprocesadas, setMultasPreprocesadas] = useState([]);
    const [listaClientes, setListaClientes] = useState([]);

    useEffect(() => {
        if (isError) {
            toast.error(message || "Ocurrió un error al procesar.");
            if (errores_importacion && errores_importacion.length > 0) {
                setLocalErrors(errores_importacion);
                downloadErrorsExcel(errores_importacion);
            }
            dispatch(reset());
        }
    }, [isError, message, errores_importacion, dispatch]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error("Por favor, seleccioná un archivo Excel.");
            return;
        }
        setLocalErrors([]);
        setIsPreprocessing(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await dispatch(preprocesarMultas(formData)).unwrap();
            setIsPreprocessing(false);
            if (res?.status) {
                setMultasPreprocesadas(res.filas || []);
                setListaClientes(res.clientes || []);
                setShowModal(true);
                if (res.errores && res.errores.length > 0) {
                    setLocalErrors(res.errores);
                }
            } else {
                toast.error(res?.message || "Ocurrió un error al preprocesar el archivo.");
                if (res?.errores) setLocalErrors(res.errores);
            }
        } catch (error) {
            setIsPreprocessing(false);
            toast.error(error?.message || "Error al conectar con el servidor.");
        }
    };

    const handleToggleIncluir = (idTemp) => {
        setMultasPreprocesadas(prev => prev.map(item => {
            if (item.id_temp === idTemp) {
                if (!item.id_vehiculo) return item;
                return { ...item, incluir: !item.incluir };
            }
            return item;
        }));
    };

    const handleClienteChange = (idTemp, nuevoIdCliente) => {
        const clienteEncontrado = listaClientes.find(c => String(c.id) === String(nuevoIdCliente));
        setMultasPreprocesadas(prev => prev.map(item => {
            if (item.id_temp === idTemp) {
                if (!item.id_vehiculo) return item;
                return {
                    ...item,
                    id_cliente: clienteEncontrado ? clienteEncontrado.id : null,
                    cuit_cliente: clienteEncontrado ? (clienteEncontrado.nro_documento || '') : '',
                    nombre_cliente: clienteEncontrado ? (clienteEncontrado.razon_social || `${clienteEncontrado.nombre || ''} ${clienteEncontrado.apellido || ''}`.trim()) : 'Sin cliente asignado',
                    advertencia: clienteEncontrado ? null : item.advertencia,
                    incluir: clienteEncontrado ? true : item.incluir
                };
            }
            return item;
        }));
    };

    const handleConfirmarImportacion = async () => {
        const multasAImportar = multasPreprocesadas.filter(m => m.incluir);
        
        if (multasAImportar.length === 0) {
            toast.error("No hay multas seleccionadas para importar.");
            return;
        }

        const sinCliente = multasAImportar.filter(m => !m.id_cliente);
        if (sinCliente.length > 0) {
            toast.error(`Hay ${sinCliente.length} multas seleccionadas sin cliente asignado. Por favor, asignales un cliente o desmarcalas.`);
            return;
        }

        const sinVehiculo = multasAImportar.filter(m => !m.id_vehiculo);
        if (sinVehiculo.length > 0) {
            toast.error(`Hay ${sinVehiculo.length} multas cuyo vehículo no existe en el sistema. Desmarcalas para poder continuar.`);
            return;
        }

        setIsConfirming(true);
        try {
            const usuarioNombre = user?.user || user?.nombre || user?.email || "sistema";
            const res = await dispatch(confirmarImportacionMultas({ multas: multasAImportar, usuario: usuarioNombre })).unwrap();
            setIsConfirming(false);
            if (res?.status) {
                toast.success(res.message || "¡Multas imputadas correctamente!");
                setShowModal(false);
                setFile(null);
                setMultasPreprocesadas([]);
                if (res.errores && res.errores.length > 0) {
                    setLocalErrors(res.errores);
                    downloadErrorsExcel(res.errores);
                } else {
                    setLocalErrors([]);
                }
            } else {
                toast.error(res?.message || "Ocurrió un error al imputar las multas.");
                if (res?.errores) setLocalErrors(res.errores);
            }
        } catch (error) {
            setIsConfirming(false);
            toast.error(error?.message || "Error de servidor al confirmar la importación.");
        }
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
            {(isPreprocessing || isConfirming) && (
                <div className={styles.spinnerOverlay}>
                    <ClipLoader
                        size={60}
                        color="#800020"
                        loading={true}
                    />
                    <p className={styles.loadingText}>
                        {isPreprocessing ? "Analizando archivo y buscando contratos..." : "Guardando multas e imputando en cuenta corriente..."}
                    </p>
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
                            disabled={!file || isPreprocessing || isConfirming}
                        >
                            Subir Multas
                        </button>
                    </div>
                </div>

                {/* Modal de Pre-imputación y Asignación de Cliente */}
                {showModal && (
                    <div
                        onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
                        style={{
                            position: "fixed",
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.65)",
                            backdropFilter: "blur(4px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1100
                        }}
                    >
                        <div style={{
                            backgroundColor: "#fff",
                            borderRadius: "14px",
                            boxShadow: "0 25px 70px rgba(0,0,0,0.3)",
                            width: "1200px",
                            maxWidth: "96vw",
                            maxHeight: "92vh",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden"
                        }}>
                            {/* Header del modal */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "18px 24px",
                                backgroundColor: "#800020",
                                color: "#fff"
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 600, color: "#fff" }}>
                                        Revisión y Asignación de Multas
                                    </h3>
                                    <span style={{ fontSize: "13px", opacity: 0.9 }}>
                                        Se analizaron {multasPreprocesadas.length} filas del archivo Excel
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        background: "rgba(255,255,255,0.2)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "32px", height: "32px",
                                        cursor: "pointer",
                                        fontSize: "18px", color: "#fff",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Banner Informativo */}
                            <div style={{
                                backgroundColor: "#fff8e6",
                                borderBottom: "1px solid #ffe58f",
                                padding: "12px 24px",
                                fontSize: "13px",
                                color: "#873800",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}>
                                <span>
                                    Verificá las observaciones por fila. Si un vehículo no tenía contrato o no se encontró, podés reasignar manualmente el cliente en el desplegable o desmarcar la casilla para no procesarlo.
                                </span>
                            </div>

                            {/* Tabla de Multas Preprocesadas */}
                            <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #e8e8e8", textAlign: "left" }}>
                                            <th style={{ padding: "10px 8px", textAlignment: "center" }}>Imputar</th>
                                            <th style={{ padding: "10px 8px" }}>Fila</th>
                                            <th style={{ padding: "10px 8px" }}>Dominio</th>
                                            <th style={{ padding: "10px 8px" }}>Fecha / Hora</th>
                                            <th style={{ padding: "10px 8px" }}>N° Acta</th>
                                            <th style={{ padding: "10px 8px" }}>Importe</th>
                                            <th style={{ padding: "10px 8px" }}>Estado / Observación</th>
                                            <th style={{ padding: "10px 8px", width: "300px" }}>Cliente a Imputar (CUIT / Nombre)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {multasPreprocesadas.map((row) => {
                                            const esVehiculoInexistente = !row.id_vehiculo;
                                            const tieneError = Boolean(row.advertencia);
                                            const sinCliente = !row.id_cliente;
                                            
                                            let bgRow = "#fff";
                                            if (esVehiculoInexistente) bgRow = "#fff1f0";
                                            else if (!row.incluir) bgRow = "#f9f9f9";
                                            else if (tieneError) bgRow = "#fffbe6";
                                            else if (sinCliente) bgRow = "#fff2f0";

                                            return (
                                                <tr key={row.id_temp} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: bgRow, opacity: (row.incluir && !esVehiculoInexistente) ? 1 : 0.6 }}>
                                                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(row.incluir && !esVehiculoInexistente)}
                                                            disabled={esVehiculoInexistente}
                                                            onChange={() => handleToggleIncluir(row.id_temp)}
                                                            style={{ cursor: esVehiculoInexistente ? "not-allowed" : "pointer", width: "16px", height: "16px" }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>{row.id_temp}</td>
                                                    <td style={{ padding: "10px 8px" }}>
                                                        <span style={{
                                                            backgroundColor: row.id_vehiculo ? "#e6f7ff" : "#fff1f0",
                                                            color: row.id_vehiculo ? "#0958d9" : "#cf1322",
                                                            border: `1px solid ${row.id_vehiculo ? "#91caff" : "#ffa39e"}`,
                                                            borderRadius: "4px", padding: "2px 6px", fontWeight: "bold"
                                                        }}>
                                                            {row.dominio}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{row.fecha_infraccion} {row.hora}</td>
                                                    <td style={{ padding: "10px 8px", fontWeight: 600 }}>{row.acta_nro}</td>
                                                    <td style={{ padding: "10px 8px", fontWeight: 600, color: "#800020", whiteSpace: "nowrap" }}>
                                                        ${Number(row.importe).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td style={{ padding: "10px 8px" }}>
                                                        {esVehiculoInexistente ? (
                                                            <span style={{
                                                                backgroundColor: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e",
                                                                borderRadius: "4px", padding: "3px 8px", fontSize: "11.5px", fontWeight: 600, display: "inline-block"
                                                            }}>
                                                                Este vehículo no existe
                                                            </span>
                                                        ) : tieneError ? (
                                                            <span style={{
                                                                backgroundColor: "#fffbe6", color: "#d46b08", border: "1px solid #ffe58f",
                                                                borderRadius: "4px", padding: "3px 8px", fontSize: "11.5px", fontWeight: 500, display: "inline-block"
                                                            }}>
                                                                {row.advertencia}
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                backgroundColor: "#f6ffed", color: "#389e0d", border: "1px solid #b7eb8f",
                                                                borderRadius: "4px", padding: "3px 8px", fontSize: "11.5px", fontWeight: 600, display: "inline-block"
                                                            }}>
                                                                ✓ Contrato asignado
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "10px 8px" }}>
                                                        <select
                                                            value={row.id_cliente || ""}
                                                            disabled={esVehiculoInexistente}
                                                            onChange={(e) => handleClienteChange(row.id_temp, e.target.value)}
                                                            style={{
                                                                width: "100%",
                                                                padding: "6px 8px",
                                                                borderRadius: "6px",
                                                                border: row.id_cliente ? "1px solid #d9d9d9" : "2px solid #ff4d4f",
                                                                backgroundColor: esVehiculoInexistente ? "#f5f5f5" : (row.id_cliente ? "#fff" : "#fff2f0"),
                                                                cursor: esVehiculoInexistente ? "not-allowed" : "default",
                                                                fontSize: "12px"
                                                            }}
                                                        >
                                                            <option value="" disabled>-- Seleccionar Cliente --</option>
                                                            {listaClientes.map((c) => {
                                                                const nombreDisplay = c.razon_social || `${c.nombre || ''} ${c.apellido || ''}`.trim();
                                                                const cuitDisplay = c.nro_documento || 'S/D';
                                                                return (
                                                                    <option key={c.id} value={c.id}>
                                                                        {nombreDisplay} (Doc: {cuitDisplay})
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer del Modal */}
                            <div style={{
                                padding: "16px 24px",
                                borderTop: "1px solid #f0f0f0",
                                backgroundColor: "#fafafa",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <span style={{ fontSize: "13px", color: "#666" }}>
                                    Seleccionadas: <strong>{multasPreprocesadas.filter(m => m.incluir).length} de {multasPreprocesadas.length} multas</strong> | Total a Imputar: <strong>${multasPreprocesadas.filter(m => m.incluir).reduce((acc, m) => acc + (Number(m.importe) || 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                                </span>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        disabled={isConfirming}
                                        style={{
                                            padding: "8px 18px",
                                            borderRadius: "6px",
                                            border: "1px solid #d9d9d9",
                                            backgroundColor: "#fff",
                                            cursor: "pointer",
                                            fontWeight: 500
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmarImportacion}
                                        disabled={isConfirming}
                                        style={{
                                            padding: "8px 20px",
                                            borderRadius: "6px",
                                            border: "none",
                                            backgroundColor: "#800020",
                                            color: "#fff",
                                            cursor: "pointer",
                                            fontWeight: 600,
                                            boxShadow: "0 2px 6px rgba(128, 0, 32, 0.3)"
                                        }}
                                    >
                                        {isConfirming ? "Guardando..." : "Confirmar e Imputar Multas"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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