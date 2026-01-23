import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from "./PagosClientes.module.css"
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import { fichaCtaCte as getFichaCtaCte, reset, postPago } from '../../reducers/PagosClientes/pagosClientesSlice';
import { useToastFeedback } from '../../customHooks/useToastFeedback';

const FichaCtaCte = () => {
    const dispatch = useDispatch();
    const { ficha, isLoading } = useSelector(
        (state) => state.pagosClientesReducer
    );

    const [open, setOpen] = useState({}); // id_cliente => true/false

    useEffect(() => {
        dispatch(getFichaCtaCte());
    }, []);

    const toggle = (id) => {
        setOpen(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
    const [clientes, setClientes] = useState([]);
    const [clientesBase, setClientesBase] = useState([]);
    const [filtro, setFiltro] = useState("");

    useEffect(() => {
        const arr = Object.values(ficha || {});
        if (arr.length) {
            setClientesBase(arr);
            setClientes(arr);
        }
    }, [ficha]);

    useEffect(() => {
        setClientes(
            clientesBase.filter(c =>
                c.nombre_cliente
                    .toLowerCase()
                    .includes(filtro.toLowerCase())
            )
        );
    }, [filtro, clientesBase]);

    return (
        <div className={styles.container}>
            <h2>Ficha cuentas corrientes</h2>
            <div className={styles.inputContainer}>
                <span>Buscar cliente</span>
                <input type="text" name='filtro' value={filtro} onChange={(e) => {
                    console.log(e)
                    setFiltro(e.target.value)
                }} />
            </div>

            {isLoading && <ClipLoader />}
            <div className={styles.containerFicha}>
                {!isLoading && clientes.map(c => (
                    <div key={c.id_cliente} className={styles.clienteCard}>
                        {/* CABECERA */}
                        <div
                            className={styles.header}
                            onClick={() => toggle(c.id_cliente)}
                        >
                            <span className={styles.nombre}>{c.nombre_cliente}</span>

                            <span
                                className={
                                    c.saldo < 0 ? styles.saldoNegativo : styles.saldoPositivo
                                }
                            >
                                {c.saldo < 0 ? "Debe" : "A favor"}:{" "}
                                {Math.abs(c.saldo).toLocaleString("es-AR")}
                            </span>
                        </div>

                        {/* DETALLE */}
                        {open[c.id_cliente] && (
                            <div className={styles.detalleBox}>
                                <tr className={styles.detalleRow} style={{
                                    background: "#c7c7c7", position: "sticky",
                                    top: 0, right: 0
                                }}>
                                    <td>Fecha</td>
                                    <td>Detalle</td>
                                    <td>Debe</td>
                                    <td>Haber</td>
                                </tr>
                                {c.detalle.map((m, i) => (
                                    <tr key={i} className={styles.detalleRow}>
                                        <td>{m.fecha}</td>
                                        <td className={styles.concepto}>{m.concepto}</td>
                                        <td>{m.debe || "-"}</td>
                                        <td>{m.haber || "-"}</td>
                                    </tr>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

            </div>
        </div>
    );
};


export default FichaCtaCte;