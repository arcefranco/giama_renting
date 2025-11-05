import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from 'react-router-dom';
import {
    getContratoById, anulacionContrato, reset, getAlquilerByIdContrato
} from "../../../reducers/Alquileres/alquileresSlice.js";
import { getVehiculos } from "../../../reducers/Vehiculos/vehiculosSlice.js";
import { getModelos, getSucursales, getFormasDeCobro } from "../../../reducers/Generales/generalesSlice.js";
import { getClientes } from "../../../reducers/Clientes/clientesSlice.js";
import styles from "../AlquileresForm/AlquileresForm.module.css"
import DatePicker from "react-datepicker";
import Select from 'react-select';
import { ToastContainer } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import { parseISO } from "date-fns";
import { renderEstadoVehiculo } from "../../../utils/renderEstadoVehiculo.jsx";
import sinResolucionIcon from "../../../assets/sin_resolucion.png"
import rechazadoIcon from "../../../assets/rechazado.png"
import aprobadoIcon from "../../../assets/aprobado.png"
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx'
import { addDays } from "date-fns";

const UpdateContrato = () => {
    const { id } = useParams()
    const dispatch = useDispatch();
    registerLocale("es", es);
    useEffect(() => {
        Promise.all([
            dispatch(getFormasDeCobro()),
            dispatch(getVehiculos()),
            dispatch(getModelos()),
            dispatch(getClientes()),
            dispatch(getSucursales()),
            dispatch(getContratoById({ id: id })),
            dispatch(getAlquilerByIdContrato({ id: id }))
        ])
        return () => {
            dispatch(reset())
        }
    }, [])
    const { isError, isSuccess, isLoading, message, contratoById, alquilerByIdContrato } = useSelector((state) => state.alquileresReducer)
    const { username } = useSelector((state) => state.loginReducer)
    const { vehiculos, vehiculo } = useSelector((state) => state.vehiculosReducer)
    const { clientes, estado_cliente } = useSelector((state) => state.clientesReducer)
    const { modelos, sucursales, formasDeCobro } = useSelector((state) => state.generalesReducer)
    const [formContrato, setFormContrato] = useState({
        id_vehiculo: '',
        id_cliente: '',
        usuario: username,
        fecha_desde_contrato: id ? "" : fechaDesdePorDefecto,
        fecha_hasta_contrato: id ? "" : fechaHastaPorDefecto,
    });
    useToastFeedback({
        isError,
        isSuccess,
        message,
        resetAction: reset,
        onSuccess: () => {
            setFormContrato({
                id_vehiculo: '',
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

            setFormContrato({
                id_vehiculo: contratoById[0]["id_vehiculo"],
                id_cliente: contratoById[0]["id_cliente"],
                deposito: contratoById[0]["deposito_garantia"],
                id_forma_cobro_contrato: contratoById[0]["id_forma_cobro"],
                fecha_desde_contrato: fechaDesde,
                fecha_hasta_contrato: fechaHasta
            });
            const fechaDesdePickers = parseISO(contratoById[0]["fecha_desde"]);
            const fechaHastaPickers = parseISO(contratoById[0]["fecha_hasta"]);

            fechaDesdePickers.setHours(3, 0, 0, 0);
            fechaHastaPickers.setHours(0, 0, 0, 0);

        }
    }, [contratoById, id]);
    const submitUpdate = async (e) => {
        e.preventDefault();
        dispatch(anulacionContrato({
            id_contrato: id,
            fecha_desde_contrato: formContrato["fecha_desde_contrato"],
            fecha_hasta_contrato: formContrato["fecha_hasta_contrato"]
        }))
    }

    const getIconFromResolucion = (valor) => {
        const opciones = {
            0: sinResolucionIcon,
            1: aprobadoIcon,
            2: rechazadoIcon,
        };
        return opciones[valor] || sinResolucionIcon;
    };
    const opcionesVehiculos = vehiculos?.filter((v) => !v.fecha_venta).map((e) => {
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
    const obtenerRangosOcupados = (alquileres) => //funcion para utilizar en el datepicker
        alquileres?.filter(e => e.anulado === 0)?.map(a => ({
            start: new Date(a.fecha_desde),
            end: new Date(a.fecha_hasta),
        }));
    return (
        <div>
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
            <div className={styles.container}>
                <h2>Datos del contrato</h2>
                <form action="" className={styles.form} style={{
                    gridTemplateColumns: "1fr 1fr"
                }}>

                    <div className={styles.inputContainer}>
                        <span>Vehículo</span>
                        <Select
                            options={opcionesVehiculos}
                            isDisabled={id ? true : false}
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
                                isDisabled={id ? true : false}
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
                            selected={formContrato.fecha_desde_contrato}
                            onChange={(date) => setFormContrato(prev => ({ ...prev, fecha_desde_contrato: date }))}
                            minDate={formContrato.fecha_desde_contrato}
                            maxDate={formContrato.fecha_hasta_contrato}
                            placeholderText="Seleccione una fecha"
                            excludeDateIntervals={obtenerRangosOcupados(alquilerByIdContrato)}
                            locale="es"
                        />
                    </div>
                    <div className={styles.inputContainer}>
                        <span>Fecha hasta</span>
                        <DatePicker
                            dateFormat="dd/MM/yyyy"
                            selected={formContrato.fecha_hasta_contrato}
                            onChange={(date) => setFormContrato(prev => ({ ...prev, fecha_hasta_contrato: date }))}
                            minDate={formContrato.fecha_desde_contrato}
                            maxDate={formContrato.fecha_hasta_contrato}
                            placeholderText="Seleccione una fecha"
                            excludeDateIntervals={obtenerRangosOcupados(alquilerByIdContrato)}
                            locale="es"
                        />
                    </div>
                </form>
                <button className={styles.sendBtn} onClick={submitUpdate}>Enviar</button>
            </div>
        </div>
    )
}

export default UpdateContrato