import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from "react-redux"
import DataGrid, {
    Column, Scrolling, Paging, TotalItem, Summary, Lookup,
    SearchPanel, HeaderFilter, FilterRow
} from "devextreme-react/data-grid"
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';
import { getRecibos, reset, getReciboByIdSlice, anulacionRecibo } from '../../reducers/Recibos/recibosSlice.js'
import { getClientes } from '../../reducers/Clientes/clientesSlice';
import { getVehiculos } from '../../reducers/Vehiculos/vehiculosSlice';
import { getFormasDeCobro } from '../../reducers/Generales/generalesSlice.js';
import styles from "./ReporteRecibos.module.css"


const ReporteRecibos = () => {
    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(getRecibos())
        dispatch(getClientes())
        dispatch(getVehiculos())
        dispatch(getFormasDeCobro())
        return () => {
            dispatch(reset())
        }
    }, [dispatch])
    const {
        recibos,
        isLoading,
        message,
        isError,
        isSuccess,
        html_recibo
    } = useSelector((state) => state.recibosReducer)
    const {
        clientes
    } = useSelector((state) => state.clientesReducer)
    const {
        vehiculos
    } = useSelector((state) => state.vehiculosReducer)
    const { formasDeCobro } = useSelector((state) => state.generalesReducer)
    useToastFeedback({
        isError,
        isSuccess,
        message,
        resetAction: reset,
    })
    useEffect(() => {
        if (html_recibo) {
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
            }, 500)
        }
    }, [html_recibo]);

    const renderFecha = (data) => {
        if (data.value) {
            let fechaSplit = data?.value?.split("-")
            return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
        }
    }
    const calculateFechaFilter = (filterValue, operation) => {
        if (!filterValue) {
            return null;
        }

        // Expresión regular que valida el formato DD/MM/YYYY (o DD-MM-YYYY)
        const dateRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
        const match = filterValue.match(dateRegex);

        if (match) {
            // match[1]=Día, match[2]=Mes, match[3]=Año
            const [full, day, month, year] = match;

            // Aseguramos que Mes y Día tengan dos dígitos
            const normalizedDay = day.padStart(2, '0');
            const normalizedMonth = month.padStart(2, '0');

            // Transformar a formato YYYY-MM-DD
            const formattedDate = `${year}-${normalizedMonth}-${normalizedDay}`;

            // Devolver la expresión de filtro
            // [dataField, 'operacion', valor_formateado_a_YMD]
            return ["fecha", operation, formattedDate];

        }

        // Si no es un formato DD/MM/YYYY válido, se busca el valor tal cual
        return ["fecha", operation, filterValue];
    };
    const renderNombreCliente = (data) => {
        if (data.value) {
            const cliente = clientes?.find(e => e.id == data.value)
            return cliente ? <div>
                <span>{cliente?.nombre} {" "} {cliente?.apellido}</span>
            </div> : <div></div>
        }
    }
    const getIdClientePorNombre = (texto) => {
        if (!texto || !clientes?.length) return null;
        const normalizar = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const textoNorm = normalizar(texto);
        const clienteEncontrado = clientes.find(c => {
            const nombreCompleto = normalizar(`${c.nombre} ${c.apellido}`);
            return nombreCompleto.includes(textoNorm);
        });
        return clienteEncontrado?.id || null;
    };

    const handleActualizar = () => {
        dispatch(getRecibos())
    }
    const renderImprimirRecibo = (data) => {
        const row = data.value
        return (
            <button
                style={{
                    color: "#175fbb", fontSize: "11px",
                    textDecoration: 'underline', background: 'none', border: 'none',
                    cursor: "pointer"
                }}
                onClick={() => {
                    dispatch(getReciboByIdSlice({ id: row }))
                }}
            >
                Imprimir
            </button>
        )

    }
    const renderAnularRecibo = (data) => {
        const row = data.value
        const recibo = recibos?.find(e => e.id == data.value)

        return (
            recibo?.anulado == 1 ?
                <button
                    style={{
                        color: "#888888ff", fontSize: "11px",
                        textDecoration: 'underline', background: 'none', border: 'none',

                    }}
                >
                    Anular
                </button>
                :
                <button
                    style={{
                        color: "#175fbb", fontSize: "11px",
                        textDecoration: 'underline', background: 'none', border: 'none',
                        cursor: "pointer"
                    }}
                    onClick={() => {
                        dispatch(anulacionRecibo({ id: row }))
                    }}
                >
                    Anular
                </button>
        )

    }
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
                    <span className={styles.loadingText}>Cargando recibos...</span>
                </div>
            )}
            <h2>Listado de recibos</h2>
            {/*<div className={styles.filter}>
    <div style={{display: "grid",
    gridTemplateColumns: "1fr 1fr",
    columnGap: "4rem"}}>
      <div className={styles.inputContainer}>
      <span>Fecha desde: </span>
      <input name='fecha_desde' value={form["fecha_desde"]} onChange={handleChange} type="date" />
      </div>
      <div className={styles.inputContainer}>
      <span>Fecha hasta: </span>
      <input name='fecha_hasta' value={form["fecha_hasta"]} onChange={handleChange} type="date" />
      </div>
    </div>
      <button className={styles.searchButton} onClick={handleSubmit}>Buscar</button>
            </div> */}
            <button onClick={handleActualizar} className={styles.refreshButton}>
                🔄 Actualizar reporte
            </button>
            <DataGrid
                className={styles.dataGrid}
                dataSource={recibos || []}
                showBorders={true}
                style={{ fontFamily: "IBM" }}
                rowAlternationEnabled={true}
                allowColumnResizing={true}
                columnAutoWidth={true}
                height={400}
            >
                <FilterRow visible={true} showAllText={""} />
                <SearchPanel visible={true} highlightCaseSensitive={true} />
                <HeaderFilter visible={true} />
                <Scrolling mode="standard" />
                <Paging defaultPageSize={10} />
                <Column dataField="id" caption="Nro. Recibo" width={100} dataType="string" alignment="left" />
                <Column
                    dataField="fecha"
                    caption="Fecha"
                    cellRender={renderFecha}
                    alignment="center"
                    dataType="string" // Forzar editor de texto
                    allowSearch={true}
                    allowHeaderFiltering={false} // Eliminar el desplegable del encabezado
                    calculateFilterExpression={calculateFechaFilter}
                >
                </Column>
                {/* COLUMNA CLIENTE (Nombre) */}
                <Column
                    dataField="id_cliente"
                    caption="Cliente"
                    dataType="string"
                    alignment="center"
                    cellRender={renderNombreCliente}
                    allowHeaderFiltering={false}
                    calculateFilterExpression={(filterValue, selectedFilterOperation, target) => {
                        if (!filterValue) return;
                        // Creamos una expresión personalizada: buscamos coincidencias en nombre o apellido
                        return [
                            ["id_cliente", "=", getIdClientePorNombre(filterValue)]
                        ];
                    }}
                />

                {/* COLUMNA CUIL/CUIT */}
                <Column
                    caption="CUIL/CUIT"
                    alignment="center"
                    allowFiltering={true}
                    allowHeaderFiltering={false}
                    calculateCellValue={(rowData) => {
                        if (!clientes?.length) return "";
                        const cliente = clientes.find(c => c.id === rowData.id_cliente);
                        return cliente?.nro_documento || "";
                    }}
                    cellRender={({ value }) => <span>{value}</span>}
                />

                <Column
                    caption="Dominio"
                    alignment="center"
                    allowFiltering={true}
                    allowHeaderFiltering={false}
                    dataType="string" // 🔹 importante
                    calculateCellValue={(rowData) => {
                        const vehiculo = vehiculos?.find(e => e.id == rowData.id_vehiculo);
                        return vehiculo?.dominio || vehiculo?.dominio_provisorio || "SIN DOMINIO";
                    }}
                    cellRender={({ value }) => <span>{value}</span>}
                />
                <Column
                    dataField="id_forma_cobro"
                    caption="Forma de pago"
                    alignment="right"
                >
                    <Lookup
                        dataSource={formasDeCobro} // El array con ID y nombre
                        valueExpr="id"             // El campo de 'formasDeCobro' que coincide con 'dataField' (id_forma_cobro)
                        displayExpr="nombre"       // El campo de 'formasDeCobro' que se mostrará
                    />
                </Column>
                <Column dataField="importe_total" caption="Importe" dataType="string" alignment="right" allowFiltering={false} allowHeaderFiltering={true} />
                <Column dataField="id" allowSearch={false} allowHeaderFiltering={false} alignment="center" caption=""
                    cellRender={renderImprimirRecibo} />
                <Column dataField="id" allowSearch={false} allowHeaderFiltering={false} alignment="center" caption=""
                    cellRender={renderAnularRecibo} />
            </DataGrid>
        </div>
    )
}

export default ReporteRecibos