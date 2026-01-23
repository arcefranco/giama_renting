import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import DataGrid, { Column, Scrolling, Summary, TotalItem } from "devextreme-react/data-grid"
import styles from "./PagosClientes.module.css"
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import Select from "react-select"
import { getClientes, getClientesById } from '../../reducers/Clientes/clientesSlice'
import { ctacteCliente as getCtaCteCliente, reset, postPago } from '../../reducers/PagosClientes/pagosClientesSlice';
import { useToastFeedback } from '../../customHooks/useToastFeedback';
import { getFormasDeCobro } from '../../reducers/Generales/generalesSlice.js'


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
        importe_cobro: '',
        observacion: '',
    })
    const [saldoActual, setSaldoActual] = useState(0)
    const dispatch = useDispatch()
    useEffect(() => {
        Promise.all([
            dispatch(getClientes()),
            dispatch(getFormasDeCobro()),
        ])
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
    const { isError, isSuccess, isLoading, message, ctacteCliente } = useSelector((state) => state.pagosClientesReducer)
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
                return acc + haber - debe;
            }, 0);

            setSaldoActual(total);
        } else {
            setSaldoActual(0);
        }
    }, [ctacteCliente]);

    useToastFeedback({
        isError,
        isSuccess,
        message,
        resetAction: reset,
        onSuccess: () => {
            setForm({
                id_cliente: id ? id : '',
                fecha: '',
                usuario_alta_registro: '',
                id_forma_cobro: '',
                importe_cobro: '',
                observacion: '',
                //faltan
                usuario: '',
                id_vehiculo: ''
            })
            if (id) {
                dispatch(getCtaCteCliente({ id_cliente: id }))
            }
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
        if (form.fecha && form.id_cliente && form.importe_cobro && form.id_forma_cobro) {
            dispatch(postPago(form))
        } else {
            toast.info("Completar los campos obligatorios", {
                position: "bottom-center",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "colored",
            })
        }
    }
    const renderFecha = (data) => {
        let fechaSplit = data.value.split("-")
        return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
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
            <h2>Pagos clientes</h2>
            <div style={{
                display: "flex",
                columnGap: "15rem"
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
                                }}
                                placeholder="Seleccione un cliente"
                                filterOption={(option, inputValue) =>
                                    option.data.searchKey.includes(inputValue.toLowerCase())
                                }
                                styles={customStyles}

                            />


                        </div>
                    </div>
                }
                {
                    id && cliente?.length && (
                        <h2>
                            {cliente[0]["nombre"] ? cliente[0]["nombre"] + " " + cliente[0]["apellido"] : cliente[0]["razon_social"]}
                        </h2>)
                }

            </div>

            <button className={styles.refreshButton}>
                🔄 Actualizar
            </button>
            <DataGrid
                className={styles.dataGrid}
                dataSource={ctacteCliente ? ctacteCliente : null}
                showBorders={true}
                style={{ fontFamily: "IBM" }}
                rowAlternationEnabled={true}
                allowColumnResizing={true}
                scrolling={true}
                height={300}

                columnAutoWidth={true}>
                <Scrolling mode="standard" />
                <Column dataField="fecha" cellRender={renderFecha} caption="Fecha" width={120} />
                <Column dataField="concepto" caption="Concepto" />
                <Column dataField="debe" alignment="right" caption="Debe" />
                <Column dataField="haber" alignment="right" caption="Haber" />
                <Column dataField="saldo" alignment="right" caption="Saldo" />

            </DataGrid>
            <div className={styles.saldoBox}>
                Saldo actual: {saldoActual}
            </div>
            <h2>Alta pagos clientes</h2>
            <div className={styles.formContainer} >
                <form action="" enctype="multipart/form-data" className={styles.form} style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    justifyContent: "space-around"
                }}>



                    <div className={styles.inputContainer}>
                        <span>Forma de cobro</span>
                        <select name="id_forma_cobro"
                            onChange={handleChange}
                            value={form.id_forma_cobro}
                            id="">
                            <option value={""} disabled selected>{"Seleccione una opción"}</option>
                            {
                                formasDeCobro?.length && formasDeCobro?.map(e => {
                                    return <option key={e.id} value={e.id}>{e.nombre}</option>
                                })
                            }
                        </select>
                    </div>
                    <div className={styles.inputContainer}>
                        <div style={{ display: "flex", flexDirection: "row", placeItems: "center", justifyContent: "space-between" }}>
                            <span>Fecha</span> <span style={{ fontSize: "9px" }}>(asientos y recibo)</span>
                        </div>
                        <input type="date" value={form.fecha} onChange={handleChange} name='fecha' />
                    </div>

                    <div className={styles.inputContainer}>
                        <span>Importe</span>
                        <input type="number" value={form.importe_cobro} name='importe_cobro' onChange={handleChange} />
                    </div>


                    <div className={styles.inputContainer}>
                        <span>Observacion</span>
                        <textarea value={form.observacion} name='observacion' onChange={handleChange} />
                    </div>
                    {/*    </div> */}
                </form>
                <button
                    className={styles.sendBtn}
                    onClick={handleSubmit}
                >
                    Enviar
                </button>

            </div>
        </div>
    )
}

export default PagosClientes