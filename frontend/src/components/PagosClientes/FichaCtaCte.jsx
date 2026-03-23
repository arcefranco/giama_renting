import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from "./PagosClientes.module.css"
import { ClipLoader } from "react-spinners";
import { fichaCtaCte as getFichaCtaCte, reset, postPago } from '../../reducers/PagosClientes/pagosClientesSlice';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver-es"
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

    const [saldoTotal, setSaldoTotal] = useState(0);

    useEffect(() => {
        const total = clientesBase.reduce(
            (acc, c) => acc + (Number(c.saldo) || 0),
            0
        );
        setSaldoTotal(Math.abs(total).toLocaleString("es-AR"));
    }, [clientesBase]);

    useEffect(() => {
        setClientes(
            clientesBase.filter(c =>
                c.nombre_cliente
                    .toLowerCase()
                    .includes(filtro.toLowerCase())
            )
        );
    }, [filtro, clientesBase]);

    const exportToExcel = async () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Cuentas Corrientes");

        let rowIndex = 1;

        clientesBase.forEach((cliente) => {
            const saldo = Math.trunc(cliente.saldo).toLocaleString("es-AR");

            // =========================
            // TITULO CLIENTE
            // =========================
            const titleRow = ws.getRow(rowIndex);

            // Valores separados
            titleRow.getCell(1).value = cliente.nombre_cliente;
            titleRow.getCell(2).value = "Saldo";
            titleRow.getCell(3).value = Math.trunc(cliente.saldo);

            // Estilos
            [1, 2, 3].forEach((col) => {
                const cell = titleRow.getCell(col);

                cell.font = { bold: true };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF4B084" }, // canela oscuro
                };
            });

            // (opcional pero MUY recomendable)
            titleRow.getCell(3).numFmt = '#,##0'; // formato número
            titleRow.getCell(3).alignment = { horizontal: "right" };

            rowIndex++;

            // =========================
            // ENCABEZADOS
            // =========================
            const headerRow = ws.getRow(rowIndex);
            const headers = ["Concepto", "Debe", "Haber"];

            headers.forEach((h, i) => {
                const cell = headerRow.getCell(i + 1);

                cell.value = h;
                cell.font = { bold: true };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8CBAD" }, // canela claro
                };
            });

            rowIndex++;

            // =========================
            // DETALLE (AGRUPADO)
            // =========================
            cliente.detalle.forEach((mov) => {
                const row = ws.getRow(rowIndex);

                row.getCell(1).value = mov.concepto || "";
                row.getCell(2).value = mov.debe ? Math.trunc(mov.debe) : "";
                row.getCell(3).value = mov.haber ? Math.trunc(mov.haber) : "";

                row.outlineLevel = 1; // 👈 hace plegable

                rowIndex++;
            });

            // espacio entre clientes
            rowIndex += 2;
        });

        // =========================
        // CONFIGURACIONES
        // =========================

        ws.columns = [
            { width: 50 },
            { width: 15 },
            { width: 15 },
        ];

        // comportamiento del grouping
        ws.properties.outlineProperties = {
            summaryBelow: false,
        };

        // =========================
        // EXPORT
        // =========================
        const buffer = await wb.xlsx.writeBuffer();

        saveAs(
            new Blob([buffer]),
            "Ficha_Cta_Cte.xlsx"
        );
    };

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
            <button className={styles.sendBtn} onClick={exportToExcel}>
                Exportar
            </button>
            <div>
                <p>Saldo total: {saldoTotal}</p>
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
                                {/*           {c.saldo < 0 ? "Debe" : "A favor"}:{" "} */}
                                {c.saldo < 0
                                    ? `(${Math.abs(Math.trunc(c.saldo)).toLocaleString("es-AR")})`
                                    : Math.trunc(c.saldo).toLocaleString("es-AR")
                                }
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
                                    <td>Nro recibo/factura</td>
                                    <td>Debe</td>
                                    <td>Haber</td>
                                </tr>
                                {c.detalle.map((m, i) => (
                                    <tr key={i} className={styles.detalleRow}>
                                        <td>{m.fecha}</td>
                                        <td className={styles.concepto}>{m.concepto}</td>
                                        <td className={styles.concepto}>{m.nro_comprobante}</td>
                                        <td>{Math.abs(m.debe) != 0 ? Math.trunc(m.debe).toLocaleString("es-AR") : ""}</td>
                                        <td>{Math.abs(m.haber) != 0 ? Math.trunc(m.haber).toLocaleString("es-AR") : ""}</td>
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