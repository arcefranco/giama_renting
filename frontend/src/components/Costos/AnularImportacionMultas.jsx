import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { ClipLoader } from "react-spinners";
import { getUltimoLoteMultas, anularMultasImportadas } from '../../reducers/Costos/costosSlice';

const ESTADOS = {
    anulable: { texto: "✓ Anulable", color: "#389e0d", fondo: "#f6ffed", borde: "#b7eb8f" },
    deuda_anulada: { texto: "Deuda ya anulada", color: "#0958d9", fondo: "#e6f7ff", borde: "#91caff" },
    anulada: { texto: "Anulada", color: "#595959", fondo: "#f5f5f5", borde: "#d9d9d9" },
    con_factura: { texto: "Con factura", color: "#d46b08", fondo: "#fffbe6", borde: "#ffe58f" },
    sin_vinculo: { texto: "Sin deuda vinculada", color: "#cf1322", fondo: "#fff1f0", borde: "#ffa39e" },
    sin_asiento: { texto: "Sin asiento", color: "#cf1322", fondo: "#fff1f0", borde: "#ffa39e" },
};

const esSeleccionable = (multa) => ["anulable", "deuda_anulada"].includes(multa.estado);

const formatFecha = (valor) => {
    if (!valor) return '-';
    const [yyyy, mm, dd] = String(valor).slice(0, 10).split('-');
    return `${dd}/${mm}/${yyyy}`;
};

const formatFechaHora = (valor) => {
    if (!valor) return '-';
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime())
        ? String(valor)
        : fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
};

const formatImporte = (valor) => `$${Number(valor || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const AnularImportacionMultas = ({ onClose }) => {
    const dispatch = useDispatch();
    const [lote, setLote] = useState(null);
    const [multas, setMultas] = useState([]);
    const [seleccionadas, setSeleccionadas] = useState([]);
    const [motivo, setMotivo] = useState("");
    const [motivoTocado, setMotivoTocado] = useState(false);
    const [errores, setErrores] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnulando, setIsAnulando] = useState(false);

    const cargarUltimoLote = async () => {
        setIsLoading(true);
        try {
            const res = await dispatch(getUltimoLoteMultas()).unwrap();
            const data = res?.data?.multas || [];
            setLote(res?.data?.lote || null);
            setMultas(data);
            setSeleccionadas(data.filter(esSeleccionable).map(m => m.id));
        } catch (error) {
            setLote(null);
            setMultas([]);
            setSeleccionadas([]);
            toast.error(error?.message || "Error al obtener la última importación de multas.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        cargarUltimoLote();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const seleccionables = useMemo(() => multas.filter(esSeleccionable), [multas]);
    const totalSeleccionado = useMemo(
        () => multas.filter(m => seleccionadas.includes(m.id)).reduce((acc, m) => acc + (Number(m.importe) || 0), 0),
        [multas, seleccionadas]
    );
    const todasSeleccionadas = seleccionables.length > 0 && seleccionadas.length === seleccionables.length;
    const motivoInvalido = !motivo.trim();

    const handleToggle = (id) => {
        setSeleccionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleToggleTodas = () => {
        setSeleccionadas(todasSeleccionadas ? [] : seleccionables.map(m => m.id));
    };

    const ejecutarAnulacion = async () => {
        setIsAnulando(true);
        setErrores([]);
        try {
            const res = await dispatch(anularMultasImportadas({ id_lote: lote.id, ids_multas: seleccionadas, motivo: motivo.trim() })).unwrap();
            toast.success(res?.message || "Multas anuladas correctamente.");
            setErrores(res?.errores || []);
            setMotivo("");
            setMotivoTocado(false);
            await cargarUltimoLote();
        } catch (error) {
            toast.error(error?.message || "Error al anular las multas.");
            setErrores(error?.errores || []);
            // Si otra persona importó un lote nuevo, se muestra el vigente
            await cargarUltimoLote();
        } finally {
            setIsAnulando(false);
        }
    };

    const handleAnular = () => {
        setMotivoTocado(true);
        if (seleccionadas.length === 0) {
            toast.error("Seleccioná al menos una multa para anular.");
            return;
        }
        if (motivoInvalido) {
            toast.error("Ingresá el motivo de la anulación.");
            return;
        }
        Swal.fire({
            title: `¿Anular ${seleccionadas.length} multas?`,
            html: `Total: <strong>${formatImporte(totalSeleccionado)}</strong><br/>Se generará el contra-asiento de cada una, se anulará su deuda en cuenta corriente y quedarán habilitadas para volver a importarse.`,
            showCancelButton: true,
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#800020',
            icon: 'warning',
            didOpen: () => {
                document.body.classList.remove('swal2-height-auto');
            }
        }).then((result) => {
            if (result.isConfirmed) ejecutarAnulacion();
        });
    };

    const ocupado = isLoading || isAnulando;

    return (
        <div
            onClick={(e) => e.target === e.currentTarget && !ocupado && onClose()}
            style={{
                position: "fixed",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.65)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // Por debajo de sweetalert2 (1060) para que la confirmación quede visible
                zIndex: 1050
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
                overflow: "hidden",
                position: "relative"
            }}>
                {ocupado && (
                    <div style={{
                        position: "absolute", inset: 0, zIndex: 2,
                        backgroundColor: "rgba(255,255,255,0.7)",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px"
                    }}>
                        <ClipLoader size={50} color="#800020" loading={true} />
                        <span style={{ fontSize: "14px", color: "#800020", fontWeight: 600 }}>
                            {isAnulando ? "Anulando multas y generando contra-asientos..." : "Buscando la última importación..."}
                        </span>
                    </div>
                )}

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
                            Anular última importación de multas
                        </h3>
                        <span style={{ fontSize: "13px", opacity: 0.9 }}>
                            {lote
                                ? `Importación N° ${lote.id} · ${formatFechaHora(lote.fecha_alta)} · ${lote.usuario || 'sin usuario'} · ${multas.length} multas`
                                : "No hay importaciones registradas"}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={ocupado}
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
                    color: "#873800"
                }}>
                    Por cada multa seleccionada se genera el contra-asiento contable, se anula su deuda en la cuenta corriente del cliente
                    y la multa queda habilitada para volver a importarse. Solo se puede anular la última importación masiva.
                    Las multas con factura emitida se anulan desde Cuenta Corriente (Nota de Crédito).
                </div>


                {/* Tabla de multas procesadas */}
                <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1 }}>
                    {multas.length === 0 ? (
                        <p style={{ fontSize: "13px", color: "#666", textAlign: "center", margin: "24px 0" }}>
                            No hay importaciones de multas para anular.
                        </p>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #e8e8e8", textAlign: "left" }}>
                                    <th style={{ padding: "10px 8px", textAlign: "center" }}>
                                        <input
                                            type="checkbox"
                                            checked={todasSeleccionadas}
                                            disabled={seleccionables.length === 0}
                                            onChange={handleToggleTodas}
                                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                        />
                                    </th>
                                    <th style={{ padding: "10px 8px" }}>Dominio</th>
                                    <th style={{ padding: "10px 8px" }}>Fecha / Hora</th>
                                    <th style={{ padding: "10px 8px" }}>N° Acta</th>
                                    <th style={{ padding: "10px 8px" }}>Cliente</th>
                                    <th style={{ padding: "10px 8px" }}>Importe</th>
                                    <th style={{ padding: "10px 8px" }}>Asiento</th>
                                    <th style={{ padding: "10px 8px" }}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {multas.map((row) => {
                                    const seleccionable = esSeleccionable(row);
                                    const estado = ESTADOS[row.estado] || ESTADOS.sin_vinculo;
                                    return (
                                        <tr key={row.id} style={{ borderBottom: "1px solid #f0f0f0", opacity: seleccionable ? 1 : 0.7 }}>
                                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                                <input
                                                    type="checkbox"
                                                    checked={seleccionadas.includes(row.id)}
                                                    disabled={!seleccionable}
                                                    onChange={() => handleToggle(row.id)}
                                                    style={{ width: "16px", height: "16px", cursor: seleccionable ? "pointer" : "not-allowed" }}
                                                />
                                            </td>
                                            <td style={{ padding: "10px 8px", fontWeight: "bold" }}>{row.dominio}</td>
                                            <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{formatFecha(row.fecha_infraccion)} {row.hora || ''}</td>
                                            <td style={{ padding: "10px 8px", fontWeight: 600 }}>{row.acta_nro || '-'}</td>
                                            <td style={{ padding: "10px 8px" }}>{row.nombre_cliente || '-'}</td>
                                            <td style={{ padding: "10px 8px", fontWeight: 600, color: "#800020", whiteSpace: "nowrap" }}>
                                                {formatImporte(row.importe)}
                                            </td>
                                            <td style={{ padding: "10px 8px" }}>{row.nro_asiento || '-'}</td>
                                            <td style={{ padding: "10px 8px" }}>
                                                <span
                                                    title={row.detalle || ''}
                                                    style={{
                                                        backgroundColor: estado.fondo, color: estado.color, border: `1px solid ${estado.borde}`,
                                                        borderRadius: "4px", padding: "3px 8px", fontSize: "11.5px", fontWeight: 600, display: "inline-block"
                                                    }}
                                                >
                                                    {estado.texto}
                                                </span>
                                                {row.detalle && (
                                                    <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>{row.detalle}</div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {errores.length > 0 && (
                        <div style={{ marginTop: "16px", border: "1px solid #ffa39e", backgroundColor: "#fff1f0", borderRadius: "8px", padding: "12px 16px" }}>
                            <strong style={{ fontSize: "13px", color: "#cf1322" }}>No se pudieron anular:</strong>
                            <ul style={{ margin: "8px 0 0", paddingLeft: "18px", fontSize: "12.5px", color: "#a8071a" }}>
                                {errores.map((err, idx) => <li key={idx}>{err}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Motivo */}
                <div style={{ padding: "12px 24px", borderTop: "1px solid #f0f0f0" }}>
                    <label htmlFor="motivo_anulacion_multas" style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                        Motivo de la anulación *
                    </label>
                    <textarea
                        id="motivo_anulacion_multas"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        onBlur={() => setMotivoTocado(true)}
                        rows={2}
                        placeholder="Ej: Reimportación para agregar fecha y hora de infracción en el motivo"
                        style={{
                            width: "100%", boxSizing: "border-box", padding: "8px", borderRadius: "6px", fontSize: "13px", resize: "vertical",
                            border: `1px solid ${motivoTocado && motivoInvalido ? "#ff4d4f" : "#d9d9d9"}`
                        }}
                    />
                    {motivoTocado && motivoInvalido && (
                        <span style={{ fontSize: "12px", color: "#ff4d4f" }}>El motivo es obligatorio.</span>
                    )}
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
                        Seleccionadas: <strong>{seleccionadas.length} de {multas.length} multas</strong> | Total a anular: <strong>{formatImporte(totalSeleccionado)}</strong>
                    </span>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            onClick={onClose}
                            disabled={ocupado}
                            style={{
                                padding: "8px 18px",
                                borderRadius: "6px",
                                border: "1px solid #d9d9d9",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                                fontWeight: 500
                            }}
                        >
                            Cerrar
                        </button>
                        <button
                            onClick={handleAnular}
                            disabled={ocupado || seleccionadas.length === 0}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "#800020",
                                color: "#fff",
                                cursor: (ocupado || seleccionadas.length === 0) ? "not-allowed" : "pointer",
                                opacity: (ocupado || seleccionadas.length === 0) ? 0.6 : 1,
                                fontWeight: 600,
                                boxShadow: "0 2px 6px rgba(128, 0, 32, 0.3)"
                            }}
                        >
                            {isAnulando ? "Anulando..." : "Anular seleccionadas"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnularImportacionMultas;
