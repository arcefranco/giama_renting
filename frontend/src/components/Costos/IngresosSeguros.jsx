import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import {
    reset as resetCostos,
    ingresos_seguros, getConceptosCostos,
    resetCostosVehiculo, reset_nro_recibo_ingreso
} from '../../reducers/Costos/costosSlice.js';
import { reset } from "../../reducers/Costos/ingresosSlice.js"
import { getVehiculos, resetVehiculo } from '../../reducers/Vehiculos/vehiculosSlice.js'
import { getClientes } from '../../reducers/Clientes/clientesSlice.js';
import { getModelos, getFormasDeCobro } from '../../reducers/Generales/generalesSlice.js'
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import styles from "./IngresosEgresos.module.css"
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import { renderEstadoVehiculo } from '../../utils/renderEstadoVehiculo.jsx';
import Select from 'react-select';
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';
import { getReciboIngresoById, resetIngreso } from '../../reducers/Recibos/recibosSlice.js';
import Swal from 'sweetalert2';


const IngresosSeguros = () => {

    const dispatch = useDispatch()
    const { conceptos, isLoading: isLoadingCostos, isSuccess: isSuccessCostos,
        isError: isErrorCostos, message: messageCostos } = useSelector((state) => state.costosReducer)
    const { isError, isSuccess, isLoading, message, nro_recibo_ingreso } = useSelector((state) => state.ingresosReducer)
    const { vehiculo, vehiculos } = useSelector((state) => state.vehiculosReducer)
    const { clientes } = useSelector((state) => state.clientesReducer)
    const { username } = useSelector((state) => state.loginReducer)
    const { modelos, formasDeCobro } = useSelector((state) => state.generalesReducer)
    const { html_recibo_ingreso } = useSelector((state) => state.recibosReducer);
    const [form, setForm] = useState({
        id_vehiculo: '',
        fecha: '',
        id_cliente: '',
        observacion: '',
        importe_total: '',
        usuario: username,
        id_concepto: '',
        id_forma_cobro: ''
    })
    const [opcionesVehiculos, setOpcionesVehiculos] = useState([])
    const [opcionesClientes, setOpcionesClientes] = useState([])
    const [conceptosFiltrados, setConceptosFiltrados] = useState([])

    useEffect(() => {
        dispatch(getConceptosCostos());
        dispatch(getModelos());
        dispatch(getVehiculos());
        dispatch(getClientes());
        dispatch(getFormasDeCobro());
        locale("es");

        return () => {
            dispatch(reset());
            dispatch(resetCostos());
            dispatch(resetCostosVehiculo());
            dispatch(resetVehiculo());
            dispatch(resetIngreso());
            dispatch(reset_nro_recibo_ingreso());
        };
    }, [dispatch])

    useEffect(() => { /**OPCIONES DE VEHICULOS PARA EL SELECT */
        if (vehiculos?.length) {
            setOpcionesVehiculos(vehiculos?.filter(v => { return !v.fecha_venta })?.map(e => {
                let modeloNombre = modelos?.find(m => m.id == e.modelo)?.nombre
                let dominio = e.dominio ? e.dominio :
                    e.dominio_provisorio ? e.dominio_provisorio : ""
                return {
                    value: e.id,
                    label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: "15px" }}>
                            <span>{dominio} - {modeloNombre}</span>
                            {renderEstadoVehiculo(e, "chico")}
                        </div>
                    ),
                    searchKey: `${dominio} ${modeloNombre}`.toLowerCase(),
                };
            }))
        }
    }, [vehiculos, modelos])

    useEffect(() => { /**OPCIONES DE CLIENTES PARA EL SELECT */
        if (clientes?.length) {
            setOpcionesClientes(clientes?.filter(f => f.no_es_chofer == 1).map(e => {
                let CUIT = e.nro_documento
                let nombre = e.nombre
                let apellido = e.apellido
                let razon_social = e.razon_social
                return {
                    value: e.id,
                    label: (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: "15px" }}>
                            {
                                nombre ? <span>{CUIT} {nombre} {apellido}</span> :
                                    razon_social ? <span>{CUIT} {razon_social}</span> :
                                        <span>{CUIT}</span>
                            }

                        </div>
                    ),
                    searchKey: `${CUIT} ${nombre ? nombre : razon_social} ${apellido ? apellido : razon_social} ${razon_social}`.toLowerCase(),
                };
            }))
        }
    }, [clientes])


    useEffect(() => { /**FILTRADO DE CONCEPTOS */
        if (conceptos?.length) {
            setConceptosFiltrados(conceptos.filter(e => e.ingreso_egreso === "I" && e.genera_factura == 0))
        }
    }, [conceptos])

    useEffect(() => { /**OBTENGO RECIBO PARA IMPRIMIR */
        if (nro_recibo_ingreso) {
            dispatch(getReciboIngresoById({ id: nro_recibo_ingreso }));
        }
    }, [nro_recibo_ingreso])

    useEffect(() => { /**SWAL PARA IMPRIMIR RECIBO */
        if (html_recibo_ingreso) {
            Swal.fire({
                title: '¿Desea imprimir el recibo?',
                showCancelButton: true,
                confirmButtonText: 'Sí',
                cancelButtonText: 'Cancelar',
                icon: 'warning',
                didOpen: () => {
                    document.body.classList.remove('swal2-height-auto');
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const win = window.open('', '_blank');
                    win.document.write(html_recibo_ingreso);
                    win.document.close();
                    setTimeout(() => {
                        win.focus();
                        win.print();
                        win.onafterprint = () => {
                            win.close();
                        };
                    }, 500);
                }
            }).finally(() => {
                dispatch(resetIngreso())
            });
        }
    }, [html_recibo_ingreso])

    useToastFeedback({
        isError,
        isSuccess,
        message,
        resetAction: reset,
        onSuccess: () => {

            setForm({
                id_vehiculo: '',
                fecha: '',
                id_cliente: '',
                observacion: '',
                importe_total: '',
                usuario: username,
                id_concepto: '',
                id_forma_cobro: ''
            })
        }
    });
    useToastFeedback({
        isError: isErrorCostos,
        isSuccess: isSuccessCostos,
        message: messageCostos,
        resetAction: resetCostos,
        onSuccess: () => {

            setForm({
                id_vehiculo: '',
                fecha: '',
                id_cliente: '',
                observacion: '',
                importe_total: '',
                usuario: username,
                id_concepto: '',
                id_forma_cobro: ''
            })
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value,
        });
    };



    const handleSubmit = () => {
        if (!form.id_cliente) {
            toast.error("Debe seleccionar un cliente", {
                position: "bottom-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "colored",
            });
        } else {
            dispatch(ingresos_seguros(form))
        }
    }

    const customStyles = {
        container: (provided) => ({
            ...provided,
            width: '18rem',
            fontSize: "10px"
        })
    };
    return (
        <div className={styles.container}>
            <ToastContainer />
            {(isLoading || isLoadingCostos) && (
                <div className={styles.spinnerOverlay}>
                    <ClipLoader
                        size={60}
                        color="#800020" // bordó
                        loading={true}
                    />
                    <span className={styles.loadingText}>Cargando...</span>
                </div>
            )}
            <h2>Ingresos por seguros</h2>
            {
                vehiculo?.length && modelos?.length ?
                    <div>
                        <h2 style={{ display: "flex", alignItems: "anchor-center" }}>
                            {vehiculo?.length && vehiculo[0]?.dominio ? vehiculo[0]?.dominio :
                                vehiculo?.length && vehiculo[0]?.dominio_provisorio ? vehiculo[0]?.dominio_provisorio : ""}{" "}-{" "}
                            {vehiculo && modelos && modelos?.find(e => e.id === vehiculo[0]["modelo"])?.nombre}{" "}-{" "}
                            {vehiculo && renderEstadoVehiculo(vehiculo[0], "grande")}

                        </h2>

                    </div>
                    :
                    <h2>Seleccionar un vehículo</h2>

            }
            <div style={{
                display: "flex",
                columnGap: "15rem"
            }}>
                <div className={styles.inputContainer}>
                    <span>Vehículo</span>
                    <Select
                        options={opcionesVehiculos}
                        value={
                            opcionesVehiculos?.find(
                                (opt) => String(opt.value) === String(form.id_vehiculo)
                            ) || null
                        }
                        onChange={(option) => {
                            setForm((prevForm) => ({
                                ...prevForm,
                                id_vehiculo: option?.value || "",
                            }));
                        }}
                        placeholder="Seleccione un vehículo"
                        filterOption={(option, inputValue) =>
                            option.data.searchKey.includes(inputValue.toLowerCase())
                        }
                        styles={customStyles}

                    />
                </div>



                <div className={styles.inputWrapper} >
                    <span>Clientes</span>
                    <div className={styles.selectWithIcon} style={{
                        width: "20rem"
                    }}>
                        <Select
                            options={opcionesClientes}
                            value={
                                opcionesClientes?.find(
                                    (opt) => String(opt.value) === String(form.id_cliente)
                                ) || null
                            }
                            onChange={(option) => {
                                setForm((prevForm) => ({
                                    ...prevForm,
                                    id_cliente: option?.value || "",
                                }));
                            }}
                            placeholder="Seleccione un cliente"
                            filterOption={(option, inputValue) =>
                                option.data.searchKey.includes(inputValue.toLowerCase())
                            }
                            styles={customStyles}

                        />
                    </div>
                </div>


            </div>
            <h2>Alta de ingreso</h2>
            <div className={styles.formContainer}>

                <form action="" enctype="multipart/form-data" className={styles.form}>
                    <div className={styles.container5}>
                        <div className={styles.inputContainer}>
                            <span>Fecha</span> <span style={{ fontSize: "9px" }}>(asiento y recibo)</span>
                            <input type="date" name='fecha' value={form["fecha"]}
                                onChange={handleChange} />

                        </div>
                        <div className={styles.inputContainer}>
                            <span>Concepto</span>
                            <select name="id_concepto" style={{ width: "130%" }} value={form["id_concepto"]}
                                onChange={handleChange} id="">
                                <option value={""} disabled selected>{"Seleccione un concepto"}</option>
                                {
                                    conceptosFiltrados?.length && conceptosFiltrados?.map(e => {
                                        return <option key={e.id} value={e.id}>{e.id} - {e.nombre}</option>
                                    })
                                }
                            </select>
                        </div>
                        <div className={styles.inputContainer}>
                            <span>Forma de cobro</span>
                            <select name="id_forma_cobro" value={form.id_forma_cobro}
                                onChange={handleChange} id="">
                                <option value={""} disabled selected>{"Seleccione una opción"}</option>
                                {
                                    formasDeCobro?.length && formasDeCobro?.map(e => {
                                        return <option key={e.id} value={e.id}>{e.nombre}</option>
                                    })
                                }
                            </select>
                        </div>

                        <div className={styles.inputContainer}>
                            <span>Total</span>
                            <input type="text" name='importe_total' value={form["importe_total"]}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className={styles.inputContainer}>
                        <span>Observación</span>
                        <textarea type="text" name='observacion' value={form["observacion"]}
                            onChange={handleChange} />
                    </div>



                </form>
                <button
                    className={styles.sendBtn}
                    onClick={handleSubmit}
                    disabled={!form["fecha"] || !form["id_concepto"] || !form["id_vehiculo"]}
                >
                    Enviar
                </button>

            </div>
        </div>
    )
}

export default IngresosSeguros