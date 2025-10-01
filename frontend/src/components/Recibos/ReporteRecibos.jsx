import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from "react-redux"
import DataGrid, {
    Column, Scrolling, Paging, TotalItem, Summary,
    SearchPanel, HeaderFilter, FilterRow
} from "devextreme-react/data-grid"
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';
import { getRecibos, reset, getReciboByIdSlice } from '../../reducers/Recibos/recibosSlice'
import { getClientes } from '../../reducers/Clientes/clientesSlice';
import { getVehiculos } from '../../reducers/Vehiculos/vehiculosSlice';
import styles from "./ReporteRecibos.module.css"

const ReporteRecibos = () => {
    const dispatch = useDispatch()
    useEffect(() => {
        dispatch(getRecibos())
        dispatch(getClientes())
        dispatch(getVehiculos())
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
    const renderVehiculo = (data) => {
        console.log(data.value)
        if (data.value) {
            const vehiculo = vehiculos?.find(e => e.id == data.value)
            return <div>
                <span>{vehiculo?.dominio ? vehiculo?.dominio : vehiculo?.dominio_provisorio ?
                    vehiculo?.dominio_provisorio : "SIN DOMINIO"}</span>
            </div>
        }
    }
    const renderNombreCliente = (data) => {
        console.log(data.value)
        if (data.value) {
            const cliente = clientes?.find(e => e.id == data.value)
            return cliente ? <div>
                <span>{cliente?.nombre} {" "} {cliente?.apellido}</span>
            </div> : <div></div>
        }
    }
    const renderNroDoc = (data) => {
        console.log(data.value)
        if (data.value) {
            const cliente = clientes?.find(e => e.id == data.value)
            return cliente ? <div>
                <span>{cliente?.nro_documento}</span>
            </div> : <div></div>
        }
    }
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
            {/*     <div className={styles.filter}>
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
                <SearchPanel visible={true} highlightCaseSensitive={true} />
                <HeaderFilter visible={true} />
                <Scrolling mode="standard" />
                <Paging defaultPageSize={10} />
                <Column dataField="id" caption="Nro. Recibo" width={100} dataType="string" alignment="left" />
                <Column dataField="fecha" allowSearch={false} allowHeaderFiltering={false} caption="Fecha" cellRender={renderFecha} alignment="center" />
                <Column dataField="id_cliente" caption="Cliente" dataType="string" alignment="center" cellRender={renderNombreCliente} />
                <Column dataField="id_cliente" caption="CUIL/CUIT" dataType="string" alignment="center" cellRender={renderNroDoc} />
                <Column dataField="id_vehiculo" caption="Dominio" alignment="center" cellRender={renderVehiculo} />
                <Column dataField="importe_total" caption="Importe" dataType="string" alignment="right" />
                <Column dataField="id" allowSearch={false} allowHeaderFiltering={false} alignment="center" caption="" cellRender={renderImprimirRecibo} />


                {/*                 <Summary calculateCustomSummary={handleCustomSummary}>
                    <TotalItem
                        name="importeTotal"
                        column="importe_neto"
                        summaryType="custom"
                        displayFormat="Total: {0}"
                        showInColumn="importe_neto"
                        customizeText={(e) => `Total: ${e.value.toLocaleString()}`}
                    />
                    <TotalItem
                        name="countVehiculos"
                        column="id_vehiculo"
                        summaryType="custom"
                        displayFormat="Total registros: {0}"
                        showInColumn="id_vehiculo" />
                </Summary> */}
            </DataGrid>
        </div>
    )
}

export default ReporteRecibos