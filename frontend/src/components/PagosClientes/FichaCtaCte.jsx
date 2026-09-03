import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styles from "./PagosClientes.module.css"
import { ClipLoader } from "react-spinners";
import { fichaCtaCte as getFichaCtaCte } from '../../reducers/PagosClientes/pagosClientesSlice';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver-es"
const FichaCtaCte = () => {
    const dispatch = useDispatch();
    const { ficha, isLoading } = useSelector(
        (state) => state.pagosClientesReducer
    );

    const [open, setOpen] = useState({}); // id_cliente => true/false
    const [fecha, setFecha] = useState("")
    useEffect(() => {
        dispatch(getFichaCtaCte({ fecha: "" }));
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
    const [tipoCliente, setTipoCliente] = useState("todos");
    const [estadoContrato, setEstadoContrato] = useState("todos");

    useEffect(() => {
        const arr = Object.values(ficha || {});
        if (arr.length) {
            setClientesBase(arr);
            setClientes(arr);
        }
    }, [ficha]);

    const [saldoTotal, setSaldoTotal] = useState(0);

    useEffect(() => {
        const total = clientes.reduce(
            (acc, c) => acc + (Number(c.saldo) || 0),
            0
        );
        setSaldoTotal(Math.abs(total).toLocaleString("es-AR"));
    }, [clientes]);

    useEffect(() => {
        setClientes(
            clientesBase.filter(c => {
                const matchTexto = c.nombre_cliente
                    ?.toLowerCase()
                    .includes(filtro.toLowerCase());

                let matchTipo = true;
                if (tipoCliente === "choferes") {
                    matchTipo = !c.es_empresa;
                } else if (tipoCliente === "empresas") {
                    matchTipo = c.es_empresa;
                }

                let matchContrato = true;
                if (estadoContrato === "vigente") {
                    matchContrato = c.tiene_contrato_vigente;
                } else if (estadoContrato === "no_vigente") {
                    matchContrato = !c.tiene_contrato_vigente;
                }

                return matchTexto && matchTipo && matchContrato;
            })
        );
    }, [filtro, tipoCliente, estadoContrato, clientesBase]);

    useEffect(() => {
        dispatch(getFichaCtaCte({ fecha: fecha }))
    }, [fecha])

    const exportToExcelPlano = async () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Cuentas Corrientes Plana");

        // 1. Single header row
        const headerRow = ws.getRow(1);
        const headers = ["CHOFER", "DOMINIO", "FECHA", "CONCEPTO", "DEBE", "HABER", "SALDO"];

        headers.forEach((h, i) => {
            const cell = headerRow.getCell(i + 1);
            cell.value = h;
            cell.font = { bold: true };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFF00" }, // Amarillo
            };
        });

        let rowIndex = 2;

        clientes.forEach((cliente) => {
            let saldoCorriente = 0;
            const chofer = cliente.nombre_cliente;

            cliente.detalle.forEach((mov) => {
                const row = ws.getRow(rowIndex);

                // Extraer dominio del concepto usando regex (patente nueva o vieja)
                let dominio = "";
                if (mov.concepto) {
                    const match = mov.concepto.match(/\b([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3})\b/i);
                    if (match) {
                        dominio = match[0].toUpperCase();
                    }
                }

                row.getCell(1).value = chofer;
                row.getCell(2).value = dominio;

                if (mov.fecha) {
                    const date = new Date(mov.fecha);
                    const cell = row.getCell(3);
                    cell.value = date;
                    cell.numFmt = "dd/mm/yyyy";
                } else {
                    row.getCell(3).value = "";
                }

                row.getCell(4).value = mov.concepto || "";
                row.getCell(5).value = mov.debe ? Math.trunc(mov.debe) : "";
                row.getCell(6).value = mov.haber ? Math.trunc(mov.haber) : "";

                saldoCorriente += (Number(mov.debe) || 0) - (Number(mov.haber) || 0);

                row.getCell(7).value = Math.trunc(saldoCorriente);
                row.getCell(7).numFmt = '#,##0';

                rowIndex++;
            });
        });

        ws.columns = [
            { width: 35 }, // CHOFER
            { width: 15 }, // DOMINIO
            { width: 15 }, // FECHA
            { width: 65 }, // CONCEPTO
            { width: 15 }, // DEBE
            { width: 15 }, // HABER
            { width: 15 }, // SALDO
        ];

        const buffer = await wb.xlsx.writeBuffer();
        const dateStr = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');

        saveAs(
            new Blob([buffer]),
            `Ficha_Cta_Cte_Plana_${dateStr}.xlsx`
        );
    };

    const exportToExcelAgrupado = async () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Cuentas Corrientes");

        let rowIndex = 1;

        clientes.forEach((cliente) => {
            const saldo = Math.trunc(cliente.saldo || 0).toLocaleString("es-AR");

            // =========================
            // TITULO CLIENTE / CHOFER
            // =========================
            const titleRow = ws.getRow(rowIndex);
            const text = `${cliente.nombre_cliente} - Saldo: ${saldo}`;

            titleRow.getCell(1).value = text;

            // Merge columnas A-D
            ws.mergeCells(rowIndex, 1, rowIndex, 4);

            [1, 2, 3, 4].forEach((col) => {
                const cell = titleRow.getCell(col);
                cell.font = { bold: true };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF4B084" }, // Canela oscuro
                };
            });

            rowIndex++;

            // =========================
            // ENCABEZADOS
            // =========================
            const headerRow = ws.getRow(rowIndex);
            const headers = ["Fecha", "Concepto", "Debe", "Haber"];

            headers.forEach((h, i) => {
                const cell = headerRow.getCell(i + 1);
                cell.value = h;
                cell.font = { bold: true };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8CBAD" }, // Canela claro
                };
            });

            rowIndex++;

            // =========================
            // DETALLE (AGRUPADO)
            // =========================
            cliente.detalle?.forEach((mov) => {
                const row = ws.getRow(rowIndex);

                if (mov.fecha) {
                    const date = new Date(mov.fecha);
                    const cell = row.getCell(1);
                    cell.value = date;
                    cell.numFmt = "dd/mm/yyyy";
                } else {
                    row.getCell(1).value = "";
                }

                row.getCell(2).value = mov.concepto || "";
                row.getCell(3).value = mov.debe ? Math.trunc(mov.debe) : "";
                row.getCell(4).value = mov.haber ? Math.trunc(mov.haber) : "";

                row.outlineLevel = 1; // Plegable en Excel

                rowIndex++;
            });

            // Espacio entre clientes
            rowIndex += 2;
        });

        ws.columns = [
            { width: 15 }, // FECHA
            { width: 50 }, // CONCEPTO
            { width: 15 }, // DEBE
            { width: 15 }, // HABER
        ];

        ws.properties.outlineProperties = {
            summaryBelow: false,
        };

        const buffer = await wb.xlsx.writeBuffer();
        const dateStr = new Date().toLocaleDateString('es-AR').replace(/\//g, '-');

        saveAs(
            new Blob([buffer]),
            `Ficha_Cta_Cte_Agrupada_${dateStr}.xlsx`
        );
    };

    return (
        <div className={styles.container}>
            <h2>Ficha cuentas corrientes</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', width: '13rem' }}>
                    <span style={{ fontSize: '13px', marginBottom: '4px', color: '#333' }}>Buscar cliente</span>
                    <input 
                        type="text" 
                        name='filtro' 
                        value={filtro} 
                        onChange={(e) => setFiltro(e.target.value)} 
                        style={{ height: '34px', border: 'none', borderBottom: '2px solid #800000', padding: '0 8px', outline: 'none', background: 'transparent' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', width: '13rem' }}>
                    <span style={{ fontSize: '13px', marginBottom: '4px', color: '#333' }}>Tipo de cliente</span>
                    <select 
                        value={tipoCliente} 
                        onChange={(e) => setTipoCliente(e.target.value)}
                        style={{ height: '34px', border: 'none', borderBottom: '2px solid #800000', padding: '0 8px', outline: 'none', background: 'transparent', fontSize: '12px', cursor: 'pointer' }}
                    >
                        <option value="todos">Todos</option>
                        <option value="choferes">Choferes (Personas)</option>
                        <option value="empresas">Empresas (Razón Social)</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', width: '13rem' }}>
                    <span style={{ fontSize: '13px', marginBottom: '4px', color: '#333' }}>Estado de Contrato</span>
                    <select 
                        value={estadoContrato} 
                        onChange={(e) => setEstadoContrato(e.target.value)}
                        style={{ height: '34px', border: 'none', borderBottom: '2px solid #800000', padding: '0 8px', outline: 'none', background: 'transparent', fontSize: '12px', cursor: 'pointer' }}
                    >
                        <option value="todos">Todos</option>
                        <option value="vigente">Con contrato vigente</option>
                        <option value="no_vigente">Sin contrato vigente</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', width: '11rem' }}>
                    <span style={{ fontSize: '13px', marginBottom: '4px', color: '#333' }}>Fecha corte</span>
                    <input 
                        type="date" 
                        name='fecha' 
                        value={fecha} 
                        onChange={(e) => setFecha(e.target.value)} 
                        style={{ height: '34px', border: 'none', borderBottom: '2px solid #800000', padding: '0 8px', outline: 'none', background: 'transparent' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={styles.exportBtn} onClick={exportToExcelPlano}>
                        <i className="fa-solid fa-file-excel"></i> Exportar Plano
                    </button>
                    <button className={styles.exportBtn} onClick={exportToExcelAgrupado}>
                        <i className="fa-solid fa-file-excel"></i> Exportar Agrupado
                    </button>
                </div>
            </div>

            <div>
                <p>Saldo total: {saldoTotal}</p>
            </div>
            {isLoading && <ClipLoader />}
            <div className={styles.containerFicha}>
                {!isLoading && clientes.map(c => {
                    let saldoCorriente = 0;
                    const detalleConSaldo = c.detalle?.map(m => {
                        saldoCorriente += (Number(m.debe) || 0) - (Number(m.haber) || 0);
                        return { ...m, saldoCorriente };
                    });
                    return (
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
                                        <td>Saldo</td>
                                    </tr>
                                    {detalleConSaldo?.map((m, i) => (
                                        <tr key={i} className={styles.detalleRow}>
                                            <td>{m.fecha}</td>
                                            <td className={styles.concepto}>{m.concepto}</td>
                                            <td className={styles.concepto}>{m.nro_comprobante}</td>
                                            <td>{Math.abs(m.debe) != 0 ? Math.trunc(m.debe).toLocaleString("es-AR") : ""}</td>
                                            <td>{Math.abs(m.haber) != 0 ? Math.trunc(m.haber).toLocaleString("es-AR") : ""}</td>
                                            <td>{Math.trunc(m.saldoCorriente).toLocaleString("es-AR")}</td>
                                        </tr>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

            </div>
        </div>
    );
};


export default FichaCtaCte;