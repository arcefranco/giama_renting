import { useRef, useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import Select from 'react-select';
import Swal from 'sweetalert2';
import {
    preprocesarCabify,
    confirmarImportacionCabify,
    getPagosCabify,
    reset
} from '../../reducers/Costos/costosSlice';
import { getReciboByIdSlice, reset as resetRecibos } from '../../reducers/Recibos/recibosSlice';
import DataGrid, {
    Column, Scrolling, Paging, FilterRow, HeaderFilter, SearchPanel, Export
} from "devextreme-react/data-grid";
import 'devextreme/dist/css/dx.carmine.css';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { Workbook } from 'devextreme-exceljs-fork';
import { saveAs } from 'file-saver-es';
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

const parseError = (err) => {
    if (typeof err !== 'string') {
        return {
            fila: err?.numero_fila_excel || err?.fila || '-',
            cuit: err?.cuit || '-',
            patente: err?.patente || err?.dominio || '-',
            importe: err?.importe !== undefined ? err?.importe : '-',
            mensaje: err?.advertencia || err?.error || err?.message || '-'
        };
    }
    const match = err.match(/^Fila\s+(\d+)\s*(?:\(Conductor:\s*([^,]*),\s*CUIT:\s*([^,]*),\s*Patente:\s*([^\)]*)\))?:\s*(.+)$/i);
    if (match) {
        return {
            fila: match[1],
            cuit: match[3]?.trim() || '-',
            patente: match[4]?.trim() || '-',
            importe: '-',
            mensaje: match[5]?.trim()
        };
    }
    return {
        fila: '-',
        cuit: '-',
        patente: '-',
        importe: '-',
        mensaje: err
    };
};

const downloadErrorsExcel = (errors) => {
    if (!errors || errors.length === 0) return;
    const data = errors.map(err => {
        const parsed = parseError(err);
        return {
            Fila: parsed.fila,
            CUIT: parsed.cuit,
            Patente: parsed.patente,
            Importe: parsed.importe,
            Error: parsed.mensaje
        };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Errores_Y_No_Imputados");
    XLSX.writeFile(workbook, `Cabify_Errores_Y_No_Imputados_${getFormattedDate()}.xlsx`);
};

const ImportacionesCabify = () => {
    const dispatch = useDispatch();
    const { isError, message, pagosCabify, isLoading: isCostosLoading } = useSelector((state) => state.costosReducer);
    const { html_recibo } = useSelector((state) => state.recibosReducer);
    const { username } = useSelector((state) => state.loginReducer || {});
    const { user } = useSelector((state) => state.authReducer || state.auth || {});

    const excelFile = useRef(null);
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [localErrors, setLocalErrors] = useState([]);

    // Estados para preprocesamiento y modal
    const [isPreprocessing, setIsPreprocessing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [cabifyPreprocesados, setCabifyPreprocesados] = useState([]);
    const [listaClientes, setListaClientes] = useState([]);

    const opcionesClientes = useMemo(() => {
        return listaClientes.map((c) => {
            const nombreDisplay = c.razon_social || `${c.nombre || ''} ${c.apellido || ''}`.trim();
            const cuitDisplay = c.nro_documento || 'S/D';
            return {
                value: c.id,
                label: `${nombreDisplay} (Doc: ${cuitDisplay})`,
                searchKey: `${nombreDisplay} ${cuitDisplay}`.toLowerCase()
            };
        });
    }, [listaClientes]);

    useEffect(() => {
        dispatch(getPagosCabify());
        return () => {
            dispatch(reset());
            dispatch(resetRecibos());
        };
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message || "Ocurrió un error al procesar el archivo.");
            dispatch(reset());
        }
    }, [isError, message, dispatch]);

    // Genera e imprime el comprobante oficial de recibo tras confirmación del usuario
    const handleImprimirComprobante = async (nro_recibo) => {
        if (!nro_recibo) {
            toast.warning("El registro no posee un número de recibo asociado.");
            return;
        }

        const confirmResult = await Swal.fire({
            title: '¿Desea imprimir el comprobante de pago?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#800020',
            cancelButtonColor: '#6c757d',
            didOpen: () => {
                document.body.classList.remove('swal2-height-auto');
            }
        });

        if (!confirmResult.isConfirmed) {
            return;
        }

        try {
            const res = await dispatch(getReciboByIdSlice({ id: nro_recibo })).unwrap();
            const html = res?.data?.html || res?.html || (typeof res === 'string' ? res : null);
            if (html) {
                const win = window.open('', '_blank');
                if (win) {
                    win.document.open();
                    win.document.write(html);
                    win.document.close();

                    setTimeout(() => {
                        win.focus();
                        win.print();
                        win.onafterprint = () => {
                            win.close();
                        };
                    }, 500);
                } else {
                    toast.warning("El navegador bloqueó la ventana emergente. Por favor habilitá las ventanas emergentes (popups) para imprimir.");
                }
            } else {
                toast.error("No se pudo obtener el formato del recibo.");
            }
        } catch (error) {
            toast.error("Error al obtener el comprobante: " + (error?.message || error));
        } finally {
            dispatch(resetRecibos());
        }
    };

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
            const res = await dispatch(preprocesarCabify(formData)).unwrap();
            setIsPreprocessing(false);
            if (res?.status) {
                const filas = res.filas || [];
                setCabifyPreprocesados(filas);
                setListaClientes(res.clientes || []);
                setShowModal(true);

                if (res.errores && res.errores.length > 0) {
                    setLocalErrors(res.errores);
                    toast.warning(`Se detectaron ${res.errores.length} registros con inconsistencias para revisar.`);
                }
            } else {
                toast.error(res?.message || "Ocurrió un error al preprocesar el archivo.");
                if (res?.errores && res.errores.length > 0) {
                    setLocalErrors(res.errores);
                }
            }
        } catch (error) {
            setIsPreprocessing(false);
            toast.error(error?.message || "Error al conectar con el servidor.");
        }
    };

    const handleToggleIncluir = (idTemp) => {
        setCabifyPreprocesados(prev => prev.map(item => {
            if (item.id_temp === idTemp) {
                if (!item.valido) return item;
                return { ...item, incluir: !item.incluir };
            }
            return item;
        }));
    };

    const handleToggleSelectAll = (seleccionar) => {
        setCabifyPreprocesados(prev => prev.map(item => {
            if (!item.valido || Number(item.importe) <= 0) return item;
            return { ...item, incluir: seleccionar };
        }));
    };

    const handleImporteChange = (idTemp, nuevoImporte) => {
        setCabifyPreprocesados(prev => prev.map(item => {
            if (item.id_temp === idTemp) {
                const num = parseFloat(nuevoImporte);
                const validoNum = !isNaN(num) && num > 0;
                let nuevaAdv = item.advertencia;

                if (!validoNum) {
                    nuevaAdv = "El importe a imputar debe ser mayor a $0,00.";
                } else if (item.valido && item.advertencia && item.advertencia.includes("Importe en $0,00")) {
                    nuevaAdv = null;
                }

                return {
                    ...item,
                    importe: nuevoImporte,
                    advertencia: nuevaAdv,
                    incluir: item.valido && validoNum ? item.incluir : false
                };
            }
            return item;
        }));
    };

    const handleClienteChange = (idTemp, selectedOption) => {
        const clienteSeleccionado = listaClientes.find(c => c.id === selectedOption?.value);
        if (!clienteSeleccionado) return;

        setCabifyPreprocesados(prev => prev.map(item => {
            if (item.id_temp === idTemp) {
                const nombreChofer = clienteSeleccionado.razon_social ||
                    `${clienteSeleccionado.nombre || ''} ${clienteSeleccionado.apellido || ''}`.trim();
                const cuitChofer = clienteSeleccionado.nro_documento ? String(clienteSeleccionado.nro_documento).replace(/\D/g, "") : item.cuit;

                const advertenciaActualizada = (item.advertencia && item.advertencia.includes("No existe chofer registrado"))
                    ? null
                    : item.advertencia;

                const esAhoraValido = Boolean(item.id_vehiculo) && !advertenciaActualizada;

                return {
                    ...item,
                    id_cliente: clienteSeleccionado.id,
                    conductor: nombreChofer,
                    cuit: cuitChofer,
                    valido: esAhoraValido,
                    advertencia: advertenciaActualizada,
                    incluir: esAhoraValido && Number(item.importe) > 0 ? true : item.incluir
                };
            }
            return item;
        }));
    };

    const handleConfirmarImportacion = async () => {
        const pagosAImportar = cabifyPreprocesados.filter(c => c.incluir && c.valido);
        const pagosNoImputados = cabifyPreprocesados.filter(c => !c.incluir || !c.valido);

        if (pagosAImportar.length === 0) {
            toast.error("No hay pagos seleccionados para imputar.");
            return;
        }

        const sinCliente = pagosAImportar.filter(c => !c.id_cliente);
        if (sinCliente.length > 0) {
            toast.error(`Hay ${sinCliente.length} pagos seleccionados sin cliente asignado. Asignales un cliente o desmarcalos.`);
            return;
        }

        const sinVehiculo = pagosAImportar.filter(c => !c.id_vehiculo);
        if (sinVehiculo.length > 0) {
            toast.error(`Hay ${sinVehiculo.length} pagos cuyo vehículo no existe en el sistema. Desmarcalos para poder continuar.`);
            return;
        }

        setIsConfirming(true);
        try {
            const usuarioNombre = username || user?.user || user?.nombre || user?.email || "sistema";
            const res = await dispatch(confirmarImportacionCabify({ pagos: pagosAImportar, usuario: usuarioNombre })).unwrap();
            setIsConfirming(false);

            if (res?.status) {
                toast.success(res.message || "¡Imputación masiva finalizada con éxito!");
                setShowModal(false);
                setFile(null);
                setCabifyPreprocesados([]);
                dispatch(getPagosCabify());

                const listaFinalErrores = [
                    ...(res?.errores || []),
                    ...pagosNoImputados.map(c => ({
                        numero_fila_excel: c.numero_fila_excel,
                        conductor: c.conductor,
                        cuit: c.cuit,
                        patente: c.patente,
                        importe: c.importe,
                        advertencia: !c.valido ? c.advertencia : "Desmarcado manualmente (no imputado)"
                    }))
                ];

                if (listaFinalErrores.length > 0) {
                    downloadErrorsExcel(listaFinalErrores);
                }
            } else {
                toast.error(res?.message || "Ocurrió un error al confirmar la importación.");
                if (res?.errores && res.errores.length > 0) {
                    downloadErrorsExcel(res.errores);
                }
            }
        } catch (error) {
            setIsConfirming(false);
            toast.error(error?.message || "Error al conectar con el servidor.");
        }
    };

    const onExporting = (e) => {
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Pagos_Cabify');
        exportDataGrid({
            component: e.component,
            worksheet: worksheet,
            autoFilterEnabled: true,
        }).then(() => {
            workbook.xlsx.writeBuffer().then((buffer) => {
                saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `Pagos_Cabify_${getFormattedDate()}.xlsx`);
            });
        });
    };

    const totalAImputar = cabifyPreprocesados
        .filter(c => c.incluir && c.valido)
        .reduce((acc, c) => acc + (parseFloat(c.importe) || 0), 0);

    const cantidadSeleccionados = cabifyPreprocesados.filter(c => c.incluir && c.valido).length;
    const todosValidosSeleccionados = cabifyPreprocesados.length > 0 &&
        cabifyPreprocesados.filter(c => c.valido && Number(c.importe) > 0).every(c => c.incluir);

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
                        {isPreprocessing ? "Analizando archivo y cruzando choferes..." : "Imputando pagos en cuenta corriente y generando asientos..."}
                    </p>
                </div>
            )}

            <div>
                {/* Header idéntico y alineado a ImportacionesTelepases y Multas */}
                <div className={styles.sectionHeader} style={{ width: "85%", margin: "25px auto 0 auto", padding: 0 }}>
                    <h2>Importación masiva de pagos Cabify</h2>
                </div>

                {/* Dropzone idéntica a Multas y Telepases */}
                <div className={styles.container} style={{ marginBottom: "25px" }}>
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
                                <p className={styles.dropZoneHint}>Hacé clic para cambiar el archivo ({(file.size / 1024).toFixed(1)} KB)</p>
                            </>
                        ) : (
                            <>
                                <p className={styles.dropZoneTitle}>Arrastrá tu archivo aquí</p>
                                <p className={styles.dropZoneSubtitle}>o hacé clic para explorar (.xls, .xlsx)</p>
                            </>
                        )}
                    </div>
                    <div className={styles.dropZoneActions}>
                        <button
                            className={styles.sendBtn}
                            onClick={handleSubmit}
                            disabled={!file || isPreprocessing || isConfirming}
                            style={{ width: "auto", minWidth: "180px", padding: "10px 24px", marginTop: "15px", height: "auto", fontSize: "14px", fontWeight: "600" }}
                        >
                            {isPreprocessing ? "Analizando Excel..." : "Subir Pagos Cabify"}
                        </button>
                    </div>
                </div>

                {/* Listado de Pagos Imputados debajo */}
                <div style={{ width: "85%", margin: "0 auto 50px auto" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                        <h3 style={{ margin: 0, color: "#800000", fontSize: "18px", fontWeight: "bold" }}>
                            Historial de Pagos Imputados Cabify
                        </h3>
                        <button
                            onClick={() => dispatch(getPagosCabify())}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 16px",
                                border: "1px solid #d9d9d9",
                                backgroundColor: "#fff",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "#475569",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                transition: "all 0.2s"
                            }}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                            </svg>
                            <span>Actualizar listado</span>
                        </button>
                    </div>

                    <DataGrid
                        dataSource={pagosCabify || []}
                        showBorders={true}
                        style={{ fontFamily: "IBM", backgroundColor: "#fff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
                        rowAlternationEnabled={true}
                        allowColumnResizing={true}
                        columnAutoWidth={true}
                        height={550}
                        onExporting={onExporting}
                    >
                        <Export enabled={true} fileName={`Pagos_Cabify_${getFormattedDate()}`} />
                        <FilterRow visible={true} showAllText={""} />
                        <SearchPanel visible={true} highlightCaseSensitive={true} placeholder="Buscar chofer, CUIT, patente o recibo..." />
                        <HeaderFilter visible={true} />
                        <Scrolling mode="standard" />
                        <Paging defaultPageSize={15} />

                        <Column dataField="fecha_proceso" caption="Fecha Proceso" dataType="string" alignment="center" width={160} />
                        <Column dataField="conductor" caption="Chofer / Cliente" alignment="left" />
                        <Column dataField="cuit" caption="CUIT" alignment="center" width={135} />
                        <Column dataField="patente" caption="Patente" alignment="center" width={110} />
                        <Column dataField="nro_recibo" caption="Nro. Recibo" alignment="center" width={110} />
                        <Column dataField="nro_asiento" caption="Asiento PA7" alignment="center" width={110} />
                        <Column
                            dataField="importe"
                            caption="Importe"
                            alignment="right"
                            width={130}
                            calculateCellValue={(rowData) => {
                                const num = Number(rowData.importe) || 0;
                                return `$ ${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }}
                        />
                        <Column dataField="usuario" caption="Usuario" alignment="center" width={120} />
                        <Column
                            caption="Comprobante"
                            alignment="center"
                            width={185}
                            allowFiltering={false}
                            allowSorting={false}
                            cellRender={(cellData) => {
                                const row = cellData.data;
                                return (
                                    <button
                                        style={{
                                            color: "#1d4ed8",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            textDecoration: "underline",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "4px 8px"
                                        }}
                                        onClick={() => handleImprimirComprobante(row.nro_recibo)}
                                        title="Imprimir comprobante oficial de recibo"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                            <rect x="6" y="14" width="12" height="8"></rect>
                                        </svg>
                                        <span>Imprimir comprobante</span>
                                    </button>
                                );
                            }}
                        />
                    </DataGrid>
                </div>

                {/* Modal de Previsualización y Revisión interactiva estilo GR-82 / Telepases */}
                {showModal && (
                    <div style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.65)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px"
                    }}>
                        <div style={{
                            backgroundColor: "#fff",
                            borderRadius: "10px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                            width: "95%",
                            maxWidth: "1300px",
                            maxHeight: "90vh",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden"
                        }}>
                            {/* Header del modal */}
                            <div style={{
                                padding: "18px 24px",
                                borderBottom: "1px solid #eee",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "#fafafa"
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, color: "#800020", fontSize: "19px", fontWeight: "bold" }}>
                                        Revisión y Asignación de Pagos Cabify
                                    </h3>
                                    <p style={{ margin: "4px 0 0 0", color: "#666", fontSize: "13px" }}>
                                        Se preprocesaron <strong>{cabifyPreprocesados.length}</strong> registros. Podés editar el importe a cobrar o reasignar el cliente si fuera necesario.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        fontSize: "22px",
                                        cursor: "pointer",
                                        color: "#999",
                                        fontWeight: "bold"
                                    }}
                                >
                                    &times;
                                </button>
                            </div>

                            {/* Barra de Acciones y Filtros rápidos */}
                            <div style={{
                                padding: "12px 24px",
                                backgroundColor: "#fff",
                                borderBottom: "1px solid #f0f0f0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleSelectAll(true)}
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: "4px",
                                            border: "1px solid #d9d9d9",
                                            backgroundColor: "#fff",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                            color: "#333",
                                            fontWeight: 500
                                        }}
                                    >
                                        Seleccionar todos los válidos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleSelectAll(false)}
                                        style={{
                                            padding: "6px 14px",
                                            borderRadius: "4px",
                                            border: "1px solid #d9d9d9",
                                            backgroundColor: "#fff",
                                            fontSize: "12px",
                                            cursor: "pointer",
                                            color: "#666"
                                        }}
                                    >
                                        Desmarcar todos
                                    </button>
                                </div>
                                <div style={{ fontSize: "13px", color: "#666" }}>
                                    <span>Válidos: <strong style={{ color: "#389e0d" }}>{cabifyPreprocesados.filter(c => c.valido).length}</strong></span>
                                    <span style={{ marginLeft: "15px" }}>Con error / inhabilitados: <strong style={{ color: "#cf1322" }}>{cabifyPreprocesados.filter(c => !c.valido).length}</strong></span>
                                </div>
                            </div>

                            {/* Tabla interactiva */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                                    <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 10, borderBottom: "2px solid #e8e8e8" }}>
                                        <tr>
                                            <th style={{ padding: "12px 8px", width: "40px", textAlign: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={todosValidosSeleccionados}
                                                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                                                    style={{ cursor: "pointer" }}
                                                />
                                            </th>
                                            <th style={{ padding: "12px 8px", width: "50px", textAlign: "center" }}>Fila</th>
                                            <th style={{ padding: "12px 8px", minWidth: "260px" }}>Cliente a Imputar</th>
                                            <th style={{ padding: "12px 8px", width: "130px" }}>CUIT</th>
                                            <th style={{ padding: "12px 8px", width: "100px" }}>Patente</th>
                                            <th style={{ padding: "12px 8px", width: "120px" }}>Modelo</th>
                                            <th style={{ padding: "12px 8px", width: "140px" }}>Importe a Cobrar</th>
                                            <th style={{ padding: "12px 8px", minWidth: "220px" }}>Estado / Diagnóstico</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cabifyPreprocesados.map((row) => {
                                            const tieneError = !row.valido;
                                            const rowBg = tieneError
                                                ? "#fff1f0"
                                                : row.incluir
                                                    ? "#f6ffed"
                                                    : "#fff";

                                            const clienteActualValue = row.id_cliente
                                                ? {
                                                    value: row.id_cliente,
                                                    label: `${row.conductor || 'Cliente'} (Doc: ${row.cuit || 'S/D'})`
                                                }
                                                : null;

                                            return (
                                                <tr
                                                    key={row.id_temp}
                                                    style={{
                                                        backgroundColor: rowBg,
                                                        borderBottom: "1px solid #f0f0f0",
                                                        transition: "background-color 0.2s"
                                                    }}
                                                >
                                                    <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={row.incluir}
                                                            disabled={tieneError || Number(row.importe) <= 0}
                                                            onChange={() => handleToggleIncluir(row.id_temp)}
                                                            style={{ cursor: tieneError || Number(row.importe) <= 0 ? "not-allowed" : "pointer" }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "10px 8px", textAlign: "center", color: "#888" }}>
                                                        {row.numero_fila_excel || row.id_temp}
                                                    </td>
                                                    <td style={{ padding: "10px 8px" }}>
                                                        <div style={{ minWidth: "240px" }}>
                                                            <Select
                                                                value={clienteActualValue}
                                                                options={opcionesClientes}
                                                                onChange={(option) => handleClienteChange(row.id_temp, option)}
                                                                placeholder="Seleccionar o cambiar cliente..."
                                                                isClearable={false}
                                                                menuPortalTarget={document.body}
                                                                styles={{
                                                                    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                                                    control: (base) => ({
                                                                        ...base,
                                                                        fontSize: "12px",
                                                                        minHeight: "30px",
                                                                        borderColor: !row.id_cliente ? "#ff4d4f" : "#d9d9d9"
                                                                    })
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "10px 8px", fontFamily: "monospace", fontSize: "12.5px" }}>
                                                        {row.cuit || <span style={{ color: "#999" }}>S/D</span>}
                                                    </td>
                                                    <td style={{ padding: "10px 8px", fontWeight: "bold", letterSpacing: "0.5px" }}>
                                                        {row.patente || <span style={{ color: "#999" }}>S/D</span>}
                                                    </td>
                                                    <td style={{ padding: "10px 8px", color: "#555" }}>
                                                        {row.modelo || "-"}
                                                    </td>
                                                    <td style={{ padding: "10px 8px" }}>
                                                        <div style={{ display: "flex", alignItems: "center" }}>
                                                            <span style={{ marginRight: "4px", color: "#666", fontWeight: "bold" }}>$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={row.importe}
                                                                onChange={(e) => handleImporteChange(row.id_temp, e.target.value)}
                                                                style={{
                                                                    width: "100px",
                                                                    padding: "4px 8px",
                                                                    fontSize: "13px",
                                                                    borderRadius: "4px",
                                                                    border: (!row.importe || Number(row.importe) <= 0) ? "1px solid #ff4d4f" : "1px solid #d9d9d9",
                                                                    backgroundColor: (!row.importe || Number(row.importe) <= 0) ? "#fff2f0" : "#fff",
                                                                    fontWeight: 500
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "10px 8px" }}>
                                                        {tieneError ? (
                                                            <span style={{
                                                                display: "inline-block",
                                                                color: "#cf1322",
                                                                backgroundColor: "#fff1f0",
                                                                border: "1px solid #ffa39e",
                                                                borderRadius: "4px",
                                                                padding: "3px 8px",
                                                                fontSize: "11.5px"
                                                            }}>
                                                                ⚠️ {row.advertencia}
                                                            </span>
                                                        ) : row.advertencia ? (
                                                            <span style={{
                                                                display: "inline-block",
                                                                color: "#d46b08",
                                                                backgroundColor: "#fff7e6",
                                                                border: "1px solid #ffd591",
                                                                borderRadius: "4px",
                                                                padding: "3px 8px",
                                                                fontSize: "11.5px"
                                                            }}>
                                                                ℹ️ {row.advertencia}
                                                            </span>
                                                        ) : (
                                                            <span style={{
                                                                display: "inline-block",
                                                                color: "#389e0d",
                                                                backgroundColor: "#f6ffed",
                                                                border: "1px solid #b7eb8f",
                                                                borderRadius: "4px",
                                                                padding: "3px 8px",
                                                                fontSize: "11.5px"
                                                            }}>
                                                                ✓ Listo para imputar
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer del modal */}
                            <div style={{
                                padding: "16px 24px",
                                borderTop: "1px solid #eee",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "#fafafa"
                            }}>
                                <span style={{ fontSize: "13.5px", color: "#444" }}>
                                    Seleccionados: <strong>{cantidadSeleccionados} de {cabifyPreprocesados.length} pagos</strong> | Total a Imputar: <strong style={{ color: "#800020", fontSize: "15px" }}>${totalAImputar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
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
                                            fontWeight: 500,
                                            fontSize: "13px"
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmarImportacion}
                                        disabled={isConfirming || cantidadSeleccionados === 0}
                                        style={{
                                            padding: "8px 22px",
                                            borderRadius: "6px",
                                            border: "none",
                                            backgroundColor: (isConfirming || cantidadSeleccionados === 0) ? "#bfbfbf" : "#800020",
                                            color: "#fff",
                                            cursor: (isConfirming || cantidadSeleccionados === 0) ? "not-allowed" : "pointer",
                                            fontWeight: 600,
                                            fontSize: "13px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px"
                                        }}
                                    >
                                        {isConfirming ? (
                                            <>
                                                <ClipLoader size={15} color="#fff" />
                                                <span>Imputando pagos...</span>
                                            </>
                                        ) : (
                                            `Confirmar Imputación Masiva (${cantidadSeleccionados})`
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ImportacionesCabify;
