import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from 'react-router-dom';
import {
    getContratoById, anulacionContrato, reset, getAlquilerByIdContrato, cambioVehiculo,
    getMovimientosContrato, postMovimientoContrato
} from "../../../reducers/Alquileres/alquileresSlice.js";
import { getVehiculos } from "../../../reducers/Vehiculos/vehiculosSlice.js";
import { getModelos, getSucursales, getFormasDeCobro } from "../../../reducers/Generales/generalesSlice.js";
import { getClientes } from "../../../reducers/Clientes/clientesSlice.js";
import styles from "../AlquileresForm/AlquileresForm.module.css"
import DatePicker from "react-datepicker";
import Select from 'react-select';
import { ToastContainer } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { parseISO, format } from "date-fns";
import DataGrid, {
    Column,
    Scrolling,
    Paging,
} from 'devextreme-react/data-grid';
import 'devextreme/dist/css/dx.carmine.css';
import { renderEstadoVehiculo } from "../../../utils/renderEstadoVehiculo.jsx";
import sinResolucionIcon from "../../../assets/sin_resolucion.png"
import rechazadoIcon from "../../../assets/rechazado.png"
import aprobadoIcon from "../../../assets/aprobado.png"
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx'
import { addDays } from "date-fns";
import Swal from 'sweetalert2';

const UpdateContrato = () => {
    const { id, vehiculo } = useParams()
    const dispatch = useDispatch();
    const navigate = useNavigate();
    registerLocale("es", es);
    useEffect(() => {
        Promise.all([
            dispatch(getFormasDeCobro()),
            dispatch(getVehiculos()),
            dispatch(getModelos()),
            dispatch(getClientes()),
            dispatch(getSucursales()),
            dispatch(getContratoById({ id: id })),
            dispatch(getAlquilerByIdContrato({ id: id })),
            dispatch(getMovimientosContrato({ id_contrato: id }))
        ])
        return () => {
            dispatch(reset())
        }
    }, [])
    const { isError, isSuccess, isLoading, message, contratoById, alquilerByIdContrato, movimientosContrato } = useSelector((state) => state.alquileresReducer)
    const { username } = useSelector((state) => state.loginReducer)
    const { vehiculos } = useSelector((state) => state.vehiculosReducer)
    const { clientes } = useSelector((state) => state.clientesReducer)
    const { modelos } = useSelector((state) => state.generalesReducer)
    const [rangosOcupados, setRangosOcupados] = useState([])
    const [formContrato, setFormContrato] = useState({
        id_vehiculo: vehiculo ? vehiculo : '',
        id_cliente: '',
        usuario: username,
        fecha_desde_contrato: id ? "" : fechaDesdePorDefecto,
        fecha_hasta_contrato: id ? "" : fechaHastaPorDefecto,
        hora_desde_contrato: "00:00",
        hora_hasta_contrato: "00:00",
    });
    const [formMovimiento, setFormMovimiento] = useState({
        fecha_movimiento: new Date(),
        hora_movimiento: "00:00",
        tipo: "egreso",
        observaciones: "",
    });
    useToastFeedback({
        isError,
        isSuccess,
        message,
        resetAction: reset,
        onSuccess: () => {
            setFormContrato({
                id_vehiculo: vehiculo ? vehiculo : '',
                id_cliente: '',
                apellido_cliente: '',
                ingresa_deposito: 1,
                deposito: '',
                deposito_2: '',
                deposito_3: '',
                id_forma_cobro_contrato: '',
                id_forma_cobro_contrato_2: '',
                id_forma_cobro_contrato_3: '',
                usuario: username,
                sucursal_vehiculo: "",
                fecha_desde_contrato: id ? "" : fechaDesdePorDefecto,
                fecha_hasta_contrato: id ? "" : fechaHastaPorDefecto,
                hora_desde_contrato: "00:00",
                hora_hasta_contrato: "00:00",
                fecha_recibo_deposito: '',
                cuenta_contable_forma_cobro_contrato: '',
                cuenta_secundaria_forma_cobro_contrato: '',
                cuenta_contable_forma_cobro_contrato_2: '',
                cuenta_secundaria_forma_cobro_contrato_2: '',
                cuenta_contable_forma_cobro_contrato_3: '',
                cuenta_secundaria_forma_cobro_contrato_3: '',
            })
            dispatch(reset())
        }
    })
    useEffect(() => {
        if (contratoById.length) {
            const fechaDesde = parseISO(contratoById[0]["fecha_desde"]);
            const fechaHasta = parseISO(contratoById[0]["fecha_hasta"]);

            // Corregir desfase de zona horaria
            fechaDesde.setHours(0, 0, 0, 0);
            fechaHasta.setHours(0, 0, 0, 0);

            const horaDesdeStr = (contratoById[0]["hora_desde"] || "00:00:00").substring(0, 5);
            const horaHastaStr = (contratoById[0]["hora_hasta"] || "00:00:00").substring(0, 5);

            setFormContrato({
                id_vehiculo: contratoById[0]["id_vehiculo"],
                id_cliente: contratoById[0]["id_cliente"],
                deposito: contratoById[0]["deposito_garantia"],
                id_forma_cobro_contrato: contratoById[0]["id_forma_cobro"],
                fecha_desde_contrato: fechaDesde,
                fecha_hasta_contrato: fechaHasta,
                hora_desde_contrato: horaDesdeStr,
                hora_hasta_contrato: horaHastaStr,
            });
            const fechaDesdePickers = parseISO(contratoById[0]["fecha_desde"]);
            const fechaHastaPickers = parseISO(contratoById[0]["fecha_hasta"]);

            fechaDesdePickers.setHours(3, 0, 0, 0);
            fechaHastaPickers.setHours(0, 0, 0, 0);

        }
    }, [contratoById, id]);
    useEffect(() => {
        if (vehiculo && message && isSuccess) {
            Swal.fire({
                title: message,
                showCancelButton: false,
                confirmButtonText: 'Ok',
                icon: 'success',
                didOpen: () => {
                    document.body.classList.remove('swal2-height-auto');
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate("/alquileres/contrato/reporte")
                }
            });
        }
    }, [isSuccess, message])

    const submitMovimiento = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!formMovimiento.fecha_movimiento || !formMovimiento.hora_movimiento || !formMovimiento.tipo) {
            Swal.fire("Atención", "Debe completar fecha, hora y tipo de movimiento", "warning");
            return;
        }

        const fechaStr = format(formMovimiento.fecha_movimiento, "yyyy-MM-dd");
        const fechaHoraStr = `${fechaStr} ${formMovimiento.hora_movimiento}:00`;

        const res = await dispatch(postMovimientoContrato({
            id_contrato: id,
            fecha_movimiento: fechaHoraStr,
            tipo: formMovimiento.tipo,
            observaciones: formMovimiento.observaciones,
            usuario_alta: username
        }));

        if (res.meta.requestStatus === "fulfilled" && res.payload?.status !== false) {
            Swal.fire("Éxito", res.payload?.message || "Movimiento registrado con éxito", "success");
            setFormMovimiento({
                fecha_movimiento: new Date(),
                hora_movimiento: "00:00",
                tipo: "egreso",
                observaciones: "",
            });
            dispatch(getMovimientosContrato({ id_contrato: id }));
        } else {
            Swal.fire("Error", res.payload?.message || "Error al registrar movimiento", "error");
        }
    };

    const submitUpdate = async (e) => {
        e.preventDefault();
        if (id && !vehiculo) {
            dispatch(anulacionContrato({
                id_contrato: id,
                fecha_desde_contrato: formContrato["fecha_desde_contrato"],
                fecha_hasta_contrato: formContrato["fecha_hasta_contrato"],
                hora_desde_contrato: formContrato["hora_desde_contrato"],
                hora_hasta_contrato: formContrato["hora_hasta_contrato"],
            }))
        }
        else if (id && vehiculo) {
            dispatch(cambioVehiculo({
                id_contrato: id,
                id_vehiculo: formContrato.id_vehiculo
            }))
        }
    }

    const getIconFromResolucion = (valor) => {
        const opciones = {
            0: sinResolucionIcon,
            1: aprobadoIcon,
            2: rechazadoIcon,
        };
        return opciones[valor] || sinResolucionIcon;
    };
    const opcionesVehiculos = vehiculos?.filter((v) => !v.fecha_venta && v.activo === 1).map((e) => {
        const dominio = e.dominio || e.dominio_provisorio || "";
        const modeloNombre = modelos.find((m) => m.id == e.modelo)?.nombre || "";

        return {
            value: e.id,
            label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '15px' }}>
                    <span>{dominio} - {modeloNombre}</span>
                    {renderEstadoVehiculo(e, 'chico')}
                </div>
            ),
            isDisabled: e.estado_actual !== 2,
            searchKey: `${dominio} ${modeloNombre}`.toLowerCase(),
        };
    });
    const clienteOptions = clientes.map(cliente => ({
        value: cliente.id,
        label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={getIconFromResolucion(cliente.resolucion_datero)} alt="" style={{ width: 16, height: 16 }} />
                {`${cliente.nro_documento} - ${cliente.nombre} ${cliente.apellido}`}
            </div>
        ),
        isDisabled: cliente.resolucion_datero === 2 || cliente.resolucion_datero === 0,
        searchKey: `${cliente.nombre} ${cliente.apellido}`.toLowerCase(),
    }));
    const customStyles = {
        container: (provided) => ({
            ...provided,
            width: '22rem'
        })
    };
    useEffect(() => {
        if (alquilerByIdContrato.length) {
            setRangosOcupados(alquilerByIdContrato?.filter(e => e.anulado === 0)?.map(a => ({
                start: new Date(a.fecha_desde),
                end: new Date(a.fecha_hasta),
            })))
        }
    }, [alquilerByIdContrato])
    return (
        <div style={{ paddingBottom: "40px", marginBottom: "40px" }}>
            <ToastContainer />
            {isLoading && (
                <div className={styles.spinnerOverlay}>
                    <ClipLoader
                        size={60}
                        color="#800020" // bordó
                        loading={true}
                    />
                    <p className={styles.loadingText}>Cargando...</p>
                </div>
            )}
            <div className={styles.container} style={!vehiculo ? { marginBottom: "20px" } : {}}>
                <h2>Datos del contrato</h2>
                <form action="" className={styles.form} style={{
                    gridTemplateColumns: "1fr 1fr"
                }}>

                    <div className={styles.inputContainer}>
                        <span>Vehículo</span>
                        <Select
                            options={opcionesVehiculos}
                            isDisabled={id && !vehiculo ? true : false}
                            value={
                                opcionesVehiculos.find(
                                    (opt) => String(opt.value) === String(formContrato.id_vehiculo)
                                ) || null
                            }
                            onChange={(option) => {
                                setFormContrato((prevForm) => ({
                                    ...prevForm,
                                    id_vehiculo: option?.value || "",
                                }));
                            }}
                            placeholder="Seleccione un vehículo"
                            styles={customStyles}
                            filterOption={(option, inputValue) =>
                                option.data.searchKey.includes(inputValue.toLowerCase())
                            }
                        />
                    </div>
                    <div>
                        <div className={styles.inputWrapper}>
                            <span>Clientes</span>
                            <Select
                                options={clienteOptions}
                                placeholder="Seleccione un cliente"
                                value={formContrato.id_cliente
                                    ? clienteOptions.find(opt => opt.value == formContrato.id_cliente)
                                    : null}
                                onChange={(e) => {
                                    const selectedCliente = clientes.find(c => c.id === e.value);
                                    setFormContrato({
                                        ...formContrato,
                                        id_cliente: selectedCliente.id,
                                        apellido_cliente: selectedCliente.apellido,
                                    });
                                }}
                                isDisabled={true}
                                filterOption={(option, inputValue) =>
                                    option.data.searchKey.includes(inputValue.toLowerCase())
                                }
                            />
                        </div>
                    </div>
                    <div className={styles.inputContainer}>
                        <span>Fecha desde</span>
                        <DatePicker
                            dateFormat="dd/MM/yyyy"
                            disabled={vehiculo ? true : false}
                            selected={formContrato.fecha_desde_contrato}
                            onChange={(date) => setFormContrato(prev => ({ ...prev, fecha_desde_contrato: date }))}
                            maxDate={formContrato.fecha_hasta_contrato}
                            placeholderText="Seleccione una fecha"
                            locale="es"
                        />
                    </div>
                    {/* <div className={styles.inputContainer}>
                        <span>Hora de salida</span>
                        <input
                            type="time"
                            name="hora_desde_contrato"
                            disabled={vehiculo ? true : false}
                            value={formContrato.hora_desde_contrato}
                            onChange={(e) => setFormContrato(prev => ({ ...prev, hora_desde_contrato: e.target.value }))}
                        />
                    </div> */}
                    <div className={styles.inputContainer}>
                        <span>Fecha hasta</span>
                        <DatePicker
                            dateFormat="dd/MM/yyyy"
                            disabled={vehiculo ? true : false}
                            selected={formContrato.fecha_hasta_contrato}
                            onChange={(date) => setFormContrato(prev => ({ ...prev, fecha_hasta_contrato: date }))}
                            minDate={formContrato.fecha_desde_contrato}
                            placeholderText="Seleccione una fecha"
                            locale="es"
                        />
                    </div>
                    {/* <div className={styles.inputContainer}>
                        <span>Hora de ingreso</span>
                        <input
                            type="time"
                            name="hora_hasta_contrato"
                            disabled={vehiculo ? true : false}
                            value={formContrato.hora_hasta_contrato}
                            onChange={(e) => setFormContrato(prev => ({ ...prev, hora_hasta_contrato: e.target.value }))}
                        />
                    </div> */}
                </form>
                <button className={styles.sendBtn} onClick={submitUpdate}>Enviar</button>
            </div>

            {!vehiculo && id && (
                <div className={styles.container} style={{ marginBottom: "40px" }}>
                    <h2>Movimientos de la unidad</h2>
                    <style>{`
                        .custom-datepicker-wrapper .react-datepicker-wrapper,
                        .custom-datepicker-wrapper .react-datepicker__input-container {
                            width: 100%;
                            display: block;
                        }
                    `}</style>
                    <form 
                        onSubmit={submitMovimiento}
                        style={{
                            marginBottom: "24px",
                        }}
                    >
                        <div style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "16px",
                            alignItems: "flex-end"
                        }}>
                            <div style={{ flex: "0 0 220px", display: "flex", flexDirection: "column" }}>
                                <label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#475569" }}>
                                    Tipo de movimiento *
                                </label>
                                <select 
                                    value={formMovimiento.tipo}
                                    onChange={(e) => setFormMovimiento({ ...formMovimiento, tipo: e.target.value })}
                                    style={{
                                        width: "100%",
                                        height: "38px",
                                        padding: "0 10px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        color: "#1e293b",
                                        backgroundColor: "#fff",
                                        outline: "none",
                                        cursor: "pointer",
                                        boxSizing: "border-box"
                                    }}
                                >
                                    <option value="egreso">Egreso (Alquiler / Salida)</option>
                                    <option value="ingreso">Ingreso (Devolución / Entrada)</option>
                                </select>
                            </div>
                            <div className="custom-datepicker-wrapper" style={{ flex: "0 0 150px", display: "flex", flexDirection: "column" }}>
                                <label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#475569" }}>
                                    Fecha *
                                </label>
                                <DatePicker
                                    selected={formMovimiento.fecha_movimiento}
                                    onChange={(date) => setFormMovimiento({ ...formMovimiento, fecha_movimiento: date })}
                                    dateFormat="dd/MM/yyyy"
                                    locale="es"
                                    customInput={
                                        <input
                                            style={{
                                                width: "100%",
                                                height: "38px",
                                                padding: "0 12px",
                                                borderRadius: "6px",
                                                border: "1px solid #cbd5e1",
                                                fontSize: "14px",
                                                color: "#1e293b",
                                                backgroundColor: "#fff",
                                                outline: "none",
                                                boxSizing: "border-box"
                                            }}
                                        />
                                    }
                                />
                            </div>
                            <div style={{ flex: "0 0 130px", display: "flex", flexDirection: "column" }}>
                                <label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#475569" }}>
                                    Hora *
                                </label>
                                <input
                                    type="time"
                                    value={formMovimiento.hora_movimiento}
                                    onChange={(e) => setFormMovimiento({ ...formMovimiento, hora_movimiento: e.target.value })}
                                    style={{
                                        width: "100%",
                                        height: "38px",
                                        padding: "0 10px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        color: "#1e293b",
                                        backgroundColor: "#fff",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column" }}>
                                <label style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#475569" }}>
                                    Observaciones
                                </label>
                                <input
                                    type="text"
                                    value={formMovimiento.observaciones}
                                    onChange={(e) => setFormMovimiento({ ...formMovimiento, observaciones: e.target.value })}
                                    placeholder="Observaciones del movimiento (opcional)"
                                    style={{
                                        width: "100%",
                                        height: "38px",
                                        padding: "0 12px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "14px",
                                        color: "#1e293b",
                                        backgroundColor: "#fff",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", alignItems: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={submitMovimiento}
                                    style={{
                                        backgroundColor: "#800020",
                                        color: "#fff",
                                        border: "none",
                                        padding: "0 22px",
                                        height: "38px",
                                        borderRadius: "6px",
                                        fontWeight: 600,
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        boxSizing: "border-box",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#5c0017"}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#800020"}
                                >
                                    Registrar
                                </button>
                            </div>
                        </div>
                    </form>

                    <h4 style={{ margin: "0 0 12px 0", color: "#334155", fontSize: "1rem" }}>
                        Listado de Movimientos de la Unidad
                    </h4>
                    <DataGrid
                        dataSource={movimientosContrato || []}
                        showBorders={true}
                        rowAlternationEnabled={true}
                        allowColumnResizing={true}
                        columnAutoWidth={true}
                        noDataText="No se registran movimientos para este contrato"
                    >
                        <Scrolling mode="standard" />
                        <Paging defaultPageSize={5} />
                        <Column
                            caption="Fecha y Hora"
                            alignment="center"
                            cellRender={(data) => (
                                <span>
                                    {data.data.fecha_movimiento
                                        ? format(parseISO(data.data.fecha_movimiento), "dd/MM/yyyy HH:mm")
                                        : "-"}
                                </span>
                            )}
                        />
                        <Column
                            dataField="tipo"
                            caption="Tipo"
                            alignment="center"
                            cellRender={(data) => (
                                <span style={{ textTransform: "capitalize" }}>
                                    {data.data.tipo || "-"}
                                </span>
                            )}
                        />
                        <Column
                            dataField="motivo"
                            caption="Motivo"
                            alignment="center"
                            cellRender={(data) => (
                                <span style={{ textTransform: "capitalize" }}>
                                    {data.data.motivo || "-"}
                                </span>
                            )}
                        />
                        <Column
                            dataField="observaciones"
                            caption="Observaciones"
                            alignment="left"
                            cellRender={(data) => <span>{data.data.observaciones || "-"}</span>}
                        />
                        <Column
                            dataField="usuario_alta"
                            caption="Usuario"
                            alignment="center"
                            cellRender={(data) => <span>{data.data.usuario_alta || "-"}</span>}
                        />
                    </DataGrid>
                </div>
            )}
        </div>
    )
}

export default UpdateContrato