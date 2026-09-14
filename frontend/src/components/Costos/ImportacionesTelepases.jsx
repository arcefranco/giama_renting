import { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import { preprocesarTelepases, confirmarImportacionTelepases, reset } from '../../reducers/Costos/costosSlice';
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
    const { isError, message, errores_importacion } = useSelector((state) => state.costosReducer);
    const { user } = useSelector((state) => state.authReducer || state.auth || {});

    const excelFile = useRef(null);
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localErrors, setLocalErrors] = useState([]);
    const [localGuardados, setLocalGuardados] = useState([]);

    // Estados para pre-imputación y modal
    const [isPreprocessing, setIsPreprocessing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [telepasesPreprocesados, setTelepasesPreprocesados] = useState([]);
    const [listaClientes, setListaClientes] = useState([]);

    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message || "Ocurrió un error al procesar los telepases.");
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
        setLocalGuardados([]);
        setIsPreprocessing(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await dispatch(preprocesarTelepases(formData)).unwrap();
            setIsPreprocessing(false);
            if (res?.status) {
                setTelepasesPreprocesados(res.filas || []);
                setListaClientes(res.clientes || []);
                setShowModal(true);
                if (res.errores && res.errores.length > 0) {
                    setLocalErrors(res.errores);
                }
            } else {
                toast.error(res?.message || "Ocurrió un error al preprocesar el archivo de telepases.");
                if (res?.errores) setLocalErrors(res.errores);
            }
        } catch (error) {
            setIsPreprocessing(false);
            toast.error(error?.message || "Error de conexión con el servidor al preprocesar.");
        }
    };

    const handleToggleIncluir = (idTemp) => {
        setTelepasesPreprocesados(prev => prev.map(item => {
            if (item.id_temp === idTemp) {
                if (!item.id_vehiculo) return item;
                return { ...item, incluir: !item.incluir };
            }
            return item;
        }));
    };

    const handleClienteChange = (idTemp, nuevoIdCliente) => {
        const clienteEncontrado = listaClientes.find(c => String(c.id) === String(nuevoIdCliente));
        setTelepasesPreprocesados(prev => prev.map(item => {
            if (item.id_temp === idTemp) {
                if (!item.id_vehiculo) return item;
                return {
                    ...item,
                    id_cliente: clienteEncontrado ? clienteEncontrado.id : null,
                    cuit_cliente: clienteEncontrado ? (clienteEncontrado.nro_documento || '') : '',
                    nombre_cliente: clienteEncontrado ? (clienteEncontrado.razon_social || `${clienteEncontrado.nombre || ''} ${clienteEncontrado.apellido || ''}`.trim()) : 'Sin cliente asignado',
                    es_empresa: clienteEncontrado ? !!clienteEncontrado.razon_social : item.es_empresa,
                    advertencia: clienteEncontrado ? (item.duplicada ? item.advertencia : null) : item.advertencia,
                    incluir: clienteEncontrado ? !item.duplicada : item.incluir
                };
            }
            return item;
        }));
    };

    const handleConfirmarImportacion = async () => {
        const telepasesAImportar = telepasesPreprocesados.filter(t => t.incluir);

        if (telepasesAImportar.length === 0) {
            toast.error("No hay consumos de telepase seleccionados para importar.");
            return;
        }

        const sinCliente = telepasesAImportar.filter(t => !t.id_cliente);
        if (sinCliente.length > 0) {
            toast.error(`Hay ${sinCliente.length} consumos seleccionados sin cliente asignado. Por favor, asignales un cliente o desmarcalos.`);
            return;
        }

        const sinVehiculo = telepasesAImportar.filter(t => !t.id_vehiculo);
        if (sinVehiculo.length > 0) {
            toast.error(`Hay ${sinVehiculo.length} consumos cuyo vehículo no existe en el sistema. Desmarcalos para poder continuar.`);
            return;
        }

        setIsConfirming(true);
        try {
            const usuarioNombre = user?.user || user?.nombre || user?.email || "sistema";
            const res = await dispatch(confirmarImportacionTelepases({ telepases: telepasesAImportar, usuario: usuarioNombre })).unwrap();
            setIsConfirming(false);
            if (res?.status) {
                toast.success(res.message || "¡Telepases guardados e imputados correctamente!");
                setShowModal(false);
                setFile(null);
                setTelepasesPreprocesados([]);
                if (res.guardados && res.guardados.length > 0) {
                    setLocalGuardados(res.guardados);
                }
                if (res.errores && res.errores.length > 0) {
                    setLocalErrors(res.errores);
                    downloadErrorsExcel(res.errores);
                } else {
                    setLocalErrors([]);
                }
            } else {
                toast.error(res?.message || "Ocurrió un error al imputar los telepases.");
                if (res?.errores) setLocalErrors(res.errores);
            }
        } catch (error) {
            setIsConfirming(false);
            toast.error(error?.message || "Error de servidor al confirmar la importación de telepases.");
        }
    };

    const montoTotalGuardados = localGuardados.reduce((acc, g) => acc + (Number(g.importe) || Number(g.importeTotal) || 0), 0);
    const totalPasadasGuardados = localGuardados.reduce((acc, g) => acc + (Number(g.cantidad_pasadas) || Number(g.cantidadPasadas) || 1), 0);

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
                        {isPreprocessing ? "Analizando pasadas y buscando contratos..." : "Guardando en tabla telepases e imputando en cuenta corriente..."}
                    </p>
                </div>
            )}

            <div>
                <div className={styles.sectionHeader} style={{ marginTop: "20px", marginLeft: "20px", marginRight: "20px" }}>
                    <h2>Importación masiva de telepases</h2>
                </div>

                <p style={{ marginLeft: "20px", marginRight: "20px", color: "#666", fontSize: "14px" }}>
                    Subí el archivo Excel con la pestaña <strong>PASADAS</strong>. El sistema analizará las pasadas, buscará contratos activos y te permitirá revisar y ajustar los clientes antes de imputar los cargos.
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
                            disabled={!file || isPreprocessing || isConfirming}
                            style={{ width: "auto", minWidth: "160px", padding: "10px 20px", marginTop: "15px", height: "auto" }}
                        >
                            Subir Telepases
                        </button>
                    </div>
                </div>

                {/* Modal de Pre-imputación y Revisión previa */}
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
                            width: "1250px",
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
                                        Revisión y Asignación de Telepases
                                    </h3>
                                    <span style={{ fontSize: "13px", opacity: 0.9 }}>
                                        Se analizaron {telepasesPreprocesados.length} consumos agrupados por patente
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
                                    Revisá los datos detectados. Podés reasignar manualmente el cliente desde el desplegable, o desmarcar la casilla para omitir la imputación de la patente.
                                </span>
                            </div>

                            {/* Tabla de Telepases Preprocesados */}
                            <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #e8e8e8", textAlign: "left" }}>
                                            <th style={{ padding: "10px 8px", textAlign: "center" }}>Imputar</th>
                                            <th style={{ padding: "10px 8px" }}>#</th>
                                            <th style={{ padding: "10px 8px" }}>Dominio / Patente</th>
                                            <th style={{ padding: "10px 8px" }}>Chofer</th>
                                            <th style={{ padding: "10px 8px", textAlign: "center" }}>Pasadas</th>
                                            <th style={{ padding: "10px 8px" }}>Período</th>
                                            <th style={{ padding: "10px 8px", textAlign: "right" }}>Importe Total</th>
                                            <th style={{ padding: "10px 8px" }}>Estado / Observación</th>
                                            <th style={{ padding: "10px 8px", width: "300px" }}>Cliente a Imputar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {telepasesPreprocesados.map((row) => {
                                            const esVehiculoInexistente = !row.id_vehiculo;
                                            const tieneError = Boolean(row.advertencia);
                                            const sinCliente = !row.id_cliente;

                                            let bgRow = "#fff";
                                            if (esVehiculoInexistente) bgRow = "#fff1f0";
                                            else if (!row.incluir) bgRow = "#f9f9f9";
                                            else if (row.duplicada) bgRow = "#fffbe6";
                                            else if (tieneError) bgRow = "#fffbe6";
                                            else if (sinCliente) bgRow = "#fff2f0";

                                            return (
                                                <tr key={row.id_temp} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: bgRow, opacity: (row.incluir && !esVehiculoInexistente) ? 1 : 0.65 }}>
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
                                                    <td style={{ padding: "10px 8px" }}>{row.chofer || "S/D"}</td>
                                                    <td style={{ padding: "10px 8px", textAlign: "center", fontWeight: 600 }}>{row.cantidad_pasadas}</td>
                                                    <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{row.rango_fechas}</td>
                                                    <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: "#800020", whiteSpace: "nowrap" }}>
                                                        ${Number(row.importe).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td style={{ padding: "10px 8px" }}>
                                                        {esVehiculoInexistente ? (
                                                            <span style={{
                                                                backgroundColor: "#fff1f0", color: "#cf1322", border: "1px solid #ffa39e",
                                                                borderRadius: "4px", padding: "3px 8px", fontSize: "11.5px", fontWeight: 600, display: "inline-block"
                                                            }}>
                                                                Vehículo no existe
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
                                    Seleccionados: <strong>{telepasesPreprocesados.filter(t => t.incluir).length} de {telepasesPreprocesados.length} consumos</strong> | Total a Imputar: <strong>${telepasesPreprocesados.filter(t => t.incluir).reduce((acc, t) => acc + (Number(t.importe) || 0), 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
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
                                        {isConfirming ? "Guardando..." : "Confirmar e Imputar Telepases"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resumen de importación exitosa */}
                {localGuardados.length > 0 && (
                    <div className={styles.infoContainer}>
                        <h3 className={styles.infoTitle}>
                            ✅ Resumen de la importación — {localGuardados.length} consumo(s) procesado(s)
                        </h3>
                        <p style={{ margin: "0 0 10px 0", fontSize: "14px", color: "#333" }}>
                            <strong>Total pasadas:</strong> {totalPasadasGuardados} | <strong>Monto total:</strong> ${montoTotalGuardados.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </p>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ background: "#f5f5f5", textAlign: "left" }}>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Chofer</th>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Patente / Dominio</th>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd", textAlign: "center" }}>Pasadas</th>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd", textAlign: "right" }}>Importe</th>
                                    <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Período</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localGuardados.map((g, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "8px" }}>{g.chofer || "S/D"}</td>
                                        <td style={{ padding: "8px" }}>{g.dominio || g.patente || "S/D"}</td>
                                        <td style={{ padding: "8px", textAlign: "center" }}>{g.cantidad_pasadas || g.cantidadPasadas || 1}</td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>${(Number(g.importe) || Number(g.importeTotal) || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                                        <td style={{ padding: "8px" }}>{g.rango_fechas || g.rangoFechas || "S/D"}</td>
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
