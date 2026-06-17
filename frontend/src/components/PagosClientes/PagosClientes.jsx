import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import DataGrid, { Column, Scrolling, Summary, TotalItem } from "devextreme-react/data-grid"
import styles from "./PagosClientes.module.css"
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import Select from "react-select"
import { getClientes, getClientesById } from '../../reducers/Clientes/clientesSlice'
import {
    ctacteCliente as getCtaCteCliente, reset, postPago, anulacionFactura,
    anulacionRecibo, getEstadoDeuda,
    anulacionDeuda
} from '../../reducers/PagosClientes/pagosClientesSlice';
import { useToastFeedback } from '../../customHooks/useToastFeedback';
import { getFormasDeCobro } from '../../reducers/Generales/generalesSlice.js'
import { getReciboByIdSlice, reset as resetRecibos } from '../../reducers/Recibos/recibosSlice.js'
import Swal from 'sweetalert2';

export const PagosClientes = () => {
    const { id } = useParams();
    const [opcionesClientes, setOpcionesClientes] = useState([])
    const { username } = useSelector((state) => state.loginReducer)
    const { formasDeCobro } = useSelector((state) => state.generalesReducer)
    const [form, setForm] = useState({
        id_cliente: id ? id : '',
        fecha: '',
        usuario: username,
        id_forma_cobro: '',
        id_forma_cobro_2: '',
        id_forma_cobro_3: '',
        importe_cobro: '',
        importe_cobro_2: '',
        importe_cobro_3: '',
        observacion: '',
    })
    const [saldoActual, setSaldoActual] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [errorsInputs, setErrorsInputs] = useState({})
    const dispatch = useDispatch()
    useEffect(() => {
        Promise.all([
            dispatch(getClientes()),
            dispatch(getFormasDeCobro()),
        ])
        return () => {
            dispatch(reset())
            dispatch(resetRecibos())
        }
    }, [])
    useEffect(() => {
        dispatch(getCtaCteCliente({ id_cliente: form.id_cliente }))
    }, [form.id_cliente])
    useEffect(() => {
        if (id) {
            dispatch(getCtaCteCliente({ id_cliente: id }))
            dispatch(getClientesById({ id: id }))
        }
    }, [id])


    const { clientes, cliente } = useSelector((state) => state.clientesReducer)
    const { isError, isSuccess, isLoading, message, ctacteCliente, nro_recibo,
        codigo, tipo_factura, cliente_factura, id_registro, id_factura, tipo_deuda
    } = useSelector((state) => state.pagosClientesReducer)
    const { html_recibo } = useSelector((state) => state.recibosReducer);
    useEffect(() => { /**OPCIONES DE CLIENTES PARA EL SELECT */
        if (clientes?.length) {
            setOpcionesClientes(clientes?.map(e => {
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
    useEffect(() => {
        if (ctacteCliente?.length) {
            const total = ctacteCliente.reduce((acc, mov) => {
                const debe = Number(mov.debe) || 0;
                const haber = Number(mov.haber) || 0;
                return acc + debe - haber;
            }, 0);

            setSaldoActual(total);
        } else {
            setSaldoActual(0);
        }
    }, [ctacteCliente]);
    useEffect(() => {
        if (nro_recibo) {
            dispatch(getReciboByIdSlice({ id: nro_recibo }));
        }
    }, [nro_recibo]);
    useEffect(() => {
        if (html_recibo) {
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
                    win.document.write(html_recibo);
                    win.document.close();

                    // Esperamos un poco para que cargue todo el HTML (incluida la imagen)
                    setTimeout(() => {
                        win.focus();
                        win.print();

                        // Opcional: cerrar automáticamente después de imprimir
                        win.onafterprint = () => {
                            win.close();
                        };
                    }, 500); // Ajustá el delay si fuera necesario
                }
            }).finally(() => {
                dispatch(resetRecibos())
            });
        }
    }, [html_recibo]);
    useEffect(() => {
        if (codigo && codigo !== 4) {
            Swal.fire({
                title: message,
                showCancelButton: true,
                confirmButtonText: 'Sí',
                cancelButtonText: 'Cancelar',
                icon: 'warning',
                didOpen: () => {
                    document.body.classList.remove('swal2-height-auto');
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    dispatch(reset())
                    dispatch(anulacionFactura({
                        id_registro: id_registro, id_factura: id_factura,
                        tipo_factura: tipo_factura, cliente: cliente_factura, tipo: tipo_deuda
                    }))
                }

                else if (result.isDismissed) {
                    dispatch(reset())
                }
            })
        }
        if (codigo == 4) {
            Swal.fire({
                title: message,
                showCancelButton: true,
                confirmButtonText: 'Sí',
                cancelButtonText: 'Cancelar',
                icon: 'warning',
                didOpen: () => {
                    document.body.classList.remove('swal2-height-auto');
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    dispatch(reset())
                    dispatch(anulacionDeuda({
                        id_registro: id_registro, tipo: tipo_deuda
                    }))
                }

                else if (result.isDismissed) {
                    dispatch(reset())
                }
            })
        }

    }, [isError, isSuccess, codigo])
    const onSuccess = () => {
        closeModal()
        
        if (id) {
            dispatch(getCtaCteCliente({ id_cliente: id }))
        } else if (form.id_cliente) {
            dispatch(getCtaCteCliente({ id_cliente: form.id_cliente }))
        }
    }
    useEffect(() => {
        if (!codigo) {
            if (isError && message) {
                toast.error(message, {
                    position: "bottom-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored",
                });
                dispatch(reset());
            }

            if (isSuccess && message) {
                toast.success(message, {
                    position: "bottom-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored",
                });
                dispatch(reset());
                if (onSuccess) onSuccess();
            }

        }
    }, [isError, isSuccess, message, dispatch, reset, onSuccess]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value,
        });
    };
    const closeModal = () => {
        setIsModalOpen(false)
        setForm(prev => ({
            id_cliente: id ? id : prev.id_cliente ? prev.id_cliente : '',
            fecha: '',
            usuario: username,
            id_forma_cobro: '',
            id_forma_cobro_2: '',
            id_forma_cobro_3: '',
            importe_cobro: '',
            importe_cobro_2: '',
            importe_cobro_3: '',
            observacion: '',
        }))
        setErrorsInputs({})
    }
    const openModal = () => {
        setForm(prev => ({
            ...prev,
            fecha: '',
            id_forma_cobro: '',
            id_forma_cobro_2: '',
            id_forma_cobro_3: '',
            importe_cobro: '',
            importe_cobro_2: '',
            importe_cobro_3: '',
            observacion: '',
        }))
        setErrorsInputs({})
        setIsModalOpen(true)
    }
    const handleSubmit = () => {
        // Cliente: toast porque el select queda detrás del modal
        if (!id && !form.id_cliente) {
            toast.warning("Seleccioná un cliente antes de registrar el cobro", {
                position: "top-center",
                autoClose: 3000,
                theme: "colored",
            })
            return
        }
        const newErrors = validate()
        if (Object.keys(newErrors).length) {
            setErrorsInputs(newErrors)
            return
        }
        dispatch(postPago(form))
        // No cerramos el modal acá — onSuccess lo cierra cuando llega la respuesta
    }
    const handleEstadoDeuda = (id, tipo) => {
        dispatch(getEstadoDeuda({ id: id, tipo: tipo }))
    }
    const handleAnulacionRecibo = (nro_comprobante) => {
        Swal.fire({
            title: '¿Desea anular el recibo?',
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'Cancelar',
            icon: 'warning',
            didOpen: () => {
                document.body.classList.remove('swal2-height-auto');
            }
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(reset())
                dispatch(anulacionRecibo({
                    nro_recibo: nro_comprobante
                }))
            }

            else if (result.isDismissed) {
                dispatch(reset())
            }
        })
    }
    const renderFecha = (data) => {
        if (data.value) {
            let fechaSplit = data.value.split("-")
            return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
        }

    }
    const renderAnulacion = (data) => {
        const row = data.data
        if (row.tipo == 4) {
            return (
                <button
                    onClick={() => handleAnulacionRecibo(row.nro_comprobante)}
                    style={{
                        color: '#1976d2', fontSize: "11px",
                        textDecoration: 'underline', background: 'none', border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Anular
                </button>
            );
        }
        else {
            return (
                <button
                    onClick={() => handleEstadoDeuda(row.id_registro, row.tipo)}
                    style={{
                        color: '#1976d2', fontSize: "11px",
                        textDecoration: 'underline', background: 'none', border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Anular
                </button>
            );
        }
    }
    const renderImportes = (data) => {
        const value = Number(data.value) || 0;

        return value > 0
            ? value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : "";
    }
    const renderSaldo = (data) => {
        const value = Number(data.value) || 0;

        return value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    }
    const customStyles = {
        container: (provided) => ({
            ...provided,
            width: '18rem',
            fontSize: "10px"
        })
    };

    const handleActualizar = () => {
        if (form.id_cliente) {
            dispatch(getCtaCteCliente({ id_cliente: form.id_cliente }))
        }
        if (id) {
            dispatch(getCtaCteCliente({ id_cliente: id }))
        }
    }
    const validate = () => {
        const newErrors = {}
        if (!form.fecha) newErrors.fecha = "La fecha es obligatoria"
        if (!form.id_forma_cobro) newErrors.id_forma_cobro = "Seleccioná una forma de cobro"
        if (!form.importe_cobro) newErrors.importe_cobro = "El importe es obligatorio"
        return newErrors
    }
    return (

        <div className={styles.container}>
            <ToastContainer style={{ zIndex: 99999 }} />
            {isLoading && (
                <div className={styles.spinnerOverlay}>
                    <ClipLoader
                        size={60}
                        color="#800020" // bordó
                        loading={true}
                    />
                    <span className={styles.loadingText}>Cargando...</span>
                </div>
            )}
            <h2>Cobros clientes</h2>
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                {
                    !id &&

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
                                    setErrorsInputs(p => ({ ...p, id_cliente: undefined }))
                                }}
                                placeholder="Seleccione un cliente"
                                filterOption={(option, inputValue) =>
                                    option.data.searchKey.includes(inputValue.toLowerCase())
                                }
                                styles={customStyles}

                            />
                            {errorsInputs.id_cliente && (
                                <span style={{ color: "#d32f2f", fontSize: "11px", marginTop: "4px", display: "block" }}>
                                    {errorsInputs.id_cliente}
                                </span>
                            )}

                        </div>
                    </div>
                }
                {
                    id && cliente?.length && (
                        <h2>
                            {cliente[0]["nombre"] ? cliente[0]["nombre"] + " " + cliente[0]["apellido"] : cliente[0]["razon_social"]}
                        </h2>)
                }

                <button
                    onClick={openModal}
                    className={styles.refreshButton}
                    style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: 0 }}
                >
                    <span style={{ fontSize: "16px", lineHeight: 1, fontWeight: 400 }}>+</span>
                    Alta de cobro
                </button>
            </div>

            <DataGrid
                className={styles.dataGrid}
                dataSource={ctacteCliente ? ctacteCliente : null}
                showBorders={true}
                style={{ fontFamily: "IBM" }}
                rowAlternationEnabled={true}
                allowColumnResizing={true}

                height={300}

                columnAutoWidth={true}>
                <Scrolling mode="standard" />
                <Column dataField="fecha" cellRender={renderFecha} caption="Fecha" width={120} />
                <Column dataField="concepto" caption="Concepto" />
                <Column dataField="nro_comprobante" caption="Nro. recibo/factura" />
                <Column dataField="debe" alignment="right" caption="Debe" cellRender={renderImportes} />
                <Column dataField="haber" alignment="right" caption="Haber" cellRender={renderImportes} />
                <Column dataField="saldo" alignment="right" caption="Saldo" cellRender={renderSaldo} />
                <Column caption="" cellRender={renderAnulacion} />

            </DataGrid>
            <div className={styles.saldoBox}>
                Saldo actual:
                <p style={{ color: saldoActual < 0 ? "red" : "black" }}>
                    {saldoActual < 0
                        ? `(${Math.abs(saldoActual).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })})`
                        : saldoActual.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })
                    }
                </p>
            </div>

            {isModalOpen && (
                <div
                    onClick={e => e.target === e.currentTarget && closeModal()}
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.55)",
                        backdropFilter: "blur(3px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000
                    }}
                >
                    <div style={{
                        backgroundColor: "#fff",
                        borderRadius: "12px",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                        width: "520px",
                        maxWidth: "95vw",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        {/* Header del modal */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "20px 24px",
                            borderBottom: "1px solid #f0f0f0",
                            backgroundColor: "#800000",
                            borderRadius: "12px 12px 0 0"
                        }}>
                            <h3 style={{ margin: 0, color: "#fff", fontSize: "17px", fontWeight: 600 }}>
                                Alta de cobro
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    background: "rgba(255,255,255,0.2)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "32px", height: "32px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                    color: "#fff",
                                    lineHeight: 1,
                                    transition: "background 0.2s"
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.35)"}
                                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Cuerpo del modal */}
                        <form action="" encType="multipart/form-data" style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0",
                            padding: "24px"
                        }}>
                            {/* Fecha */}
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Fecha <span style={{ color: "#999", fontWeight: 400, textTransform: "none" }}>(asientos y recibo)</span>
                                </label>
                                <input
                                    type="date"
                                    value={form.fecha}
                                    onChange={(e) => { handleChange(e); setErrorsInputs(p => ({ ...p, fecha: undefined })) }}
                                    name='fecha'
                                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${errorsInputs.fecha ? "#d32f2f" : "#ddd"}`, fontSize: "14px" }}
                                />
                                {errorsInputs.fecha && <span style={{ color: "#d32f2f", fontSize: "11px", marginTop: "4px", display: "block" }}>{errorsInputs.fecha}</span>}
                            </div>

                            {/* Separador de sección */}
                            <p style={{ margin: "8px 0 14px", fontSize: "12px", fontWeight: 700, color: "#800000", textTransform: "uppercase", letterSpacing: "0.8px", borderBottom: "2px solid #f0e0e0", paddingBottom: "6px" }}>
                                Medios de pago
                            </p>

                            {/* Fila 1 */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "12px", marginBottom: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Forma de cobro 1</label>
                                    <select name="id_forma_cobro"
                                        onChange={(e) => { handleChange(e); setErrorsInputs(p => ({ ...p, id_forma_cobro: undefined })) }}
                                        value={form.id_forma_cobro}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${errorsInputs.id_forma_cobro ? "#d32f2f" : "#ddd"}`, fontSize: "14px" }}>
                                        <option value="" disabled>Seleccione...</option>
                                        {formasDeCobro?.length && formasDeCobro.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                    </select>
                                    {errorsInputs.id_forma_cobro && <span style={{ color: "#d32f2f", fontSize: "11px", marginTop: "4px", display: "block" }}>{errorsInputs.id_forma_cobro}</span>}
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Importe</label>
                                    <input type="number" value={form.importe_cobro} name='importe_cobro'
                                        onChange={(e) => { handleChange(e); setErrorsInputs(p => ({ ...p, importe_cobro: undefined })) }}
                                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${errorsInputs.importe_cobro ? "#d32f2f" : "#ddd"}`, fontSize: "14px" }} />
                                    {errorsInputs.importe_cobro && <span style={{ color: "#d32f2f", fontSize: "11px", marginTop: "4px", display: "block" }}>{errorsInputs.importe_cobro}</span>}
                                </div>
                            </div>

                            {/* Fila 2 */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "12px", marginBottom: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Forma de cobro 2</label>
                                    <select name="id_forma_cobro_2" onChange={handleChange} value={form.id_forma_cobro_2}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}>
                                        <option value="" disabled>Seleccione...</option>
                                        {formasDeCobro?.length && formasDeCobro.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Importe</label>
                                    <input type="number" value={form.importe_cobro_2} name='importe_cobro_2' onChange={handleChange}
                                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }} />
                                </div>
                            </div>

                            {/* Fila 3 */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: "12px", marginBottom: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Forma de cobro 3</label>
                                    <select name="id_forma_cobro_3" onChange={handleChange} value={form.id_forma_cobro_3}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }}>
                                        <option value="" disabled>Seleccione...</option>
                                        {formasDeCobro?.length && formasDeCobro.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Importe</label>
                                    <input type="number" value={form.importe_cobro_3} name='importe_cobro_3' onChange={handleChange}
                                        style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px" }} />
                                </div>
                            </div>

                            {/* Observación */}
                            <div style={{ marginBottom: "24px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Observación</label>
                                <textarea
                                    value={form.observacion}
                                    name='observacion'
                                    onChange={handleChange}
                                    rows={3}
                                    style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", resize: "vertical", fontFamily: "inherit" }}
                                />
                            </div>

                            {/* Footer del modal */}
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => closeModal()}
                                    disabled={isLoading}
                                    style={{
                                        padding: "10px 20px", borderRadius: "8px",
                                        border: "1px solid #ddd", background: "#fff",
                                        color: isLoading ? "#bbb" : "#555", fontSize: "14px", fontWeight: 600,
                                        cursor: isLoading ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    style={{
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                        padding: "10px 24px", borderRadius: "8px",
                                        border: "none",
                                        backgroundColor: isLoading ? "#b36060" : "#800000",
                                        color: "#fff", fontSize: "14px", fontWeight: 600,
                                        cursor: isLoading ? "not-allowed" : "pointer",
                                        boxShadow: "0 4px 12px rgba(128,0,0,0.3)",
                                        position: "relative"
                                    }}
                                    onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = "#a00000" }}
                                    onMouseLeave={e => { if (!isLoading) e.currentTarget.style.backgroundColor = "#800000" }}
                                >
                                    <span style={{ visibility: isLoading ? "hidden" : "visible" }}>Confirmar cobro</span>
                                    {isLoading && (
                                        <span className={styles.spinner} style={{ position: "absolute" }}></span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PagosClientes