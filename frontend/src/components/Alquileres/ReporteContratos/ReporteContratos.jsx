import React, { useEffect, useState } from 'react'
import { getContratos, reset } from "./../../../reducers/Alquileres/alquileresSlice"
import { getVehiculos } from "./../../../reducers/Vehiculos/vehiculosSlice"
import { getClientes } from "./../../../reducers/Clientes/clientesSlice"
import { getModelos } from "./../../../reducers/Generales/generalesSlice"
import { useDispatch, useSelector } from "react-redux"
import DataGrid, { Column, Scrolling, Paging, TotalItem, Summary } from "devextreme-react/data-grid"
import styles from "./ReporteContratos.module.css"
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { esAnteriorAHoy } from '../../../helpers/esAnteriorAHoy'
import { ToastContainer, toast } from 'react-toastify';
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx'

const ReporteContratos = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    Promise.all([
      dispatch(getContratos({ fecha_desde: "", fecha_hasta: "" })),
      dispatch(getVehiculos()),
      dispatch(getClientes()),
      dispatch(getModelos())
    ])
  }, [])

  const {
    contratos,
    message,
    isError,
    isSuccess,
    isLoading
  } = useSelector((state) => state.alquileresReducer)
  const { vehiculos } = useSelector((state) => state.vehiculosReducer)
  const { modelos } = useSelector((state) => state.generalesReducer)
  const { clientes } = useSelector((state) => state.clientesReducer)
  const [form, setForm] = useState({
    fecha_desde: '',
    fecha_hasta: '',
  })
  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
  })
  const handleActualizar = () => {
    dispatch(getContratos({ fecha_desde: form["fecha_desde"], fecha_hasta: form["fecha_hasta"] }))
  }
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    })
  }
  const renderFecha = (data) => {
    if (data.value) {
      let fechaSplit = data?.value?.split("-")
      return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
    }
  }
  const renderVehiculo = (data) => {
    if (data.value) {
      const vehiculo = vehiculos?.find(e => e.id == data.value)
      return <div style={{ display: "flex", justifyContent: "space-evenly" }}>
        <span>{vehiculo?.dominio ? vehiculo?.dominio : vehiculo?.dominio_provisorio ?
          vehiculo?.dominio_provisorio : "SIN DOMINIO"}</span>
        <span>{" "}</span>
        <span>{modelos?.find(e => e.id == vehiculo?.modelo)?.nombre}</span>
      </div>
    }
  }

  const renderCliente = (data) => {
    if (data.value) {
      const cliente = clientes?.find(e => e.id == data.value)
      return <div>
        <span>{cliente?.nombre}</span>
        <span>{cliente?.apellido}</span>
      </div>
    }
  }

  const renderModificar = (data) => {
    const row = data.data
    if (esAnteriorAHoy(row.fecha_hasta)) {
      return (
        <button
          style={{
            color: "grey", fontSize: "11px",
            textDecoration: 'underline', background: 'none', border: 'none',
            cursor: "none"
          }}
          disabled
        >
          Modificar
        </button>
      )
    } else if (!esAnteriorAHoy(row.fecha_hasta)) {
      return (
        <button
          onClick={() => window.open(`${import.meta.env.VITE_BASENAME}contrato/actualizar/${data.data.id}`, '_blank')}
          style={{
            color: '#1976d2', fontSize: "11px",
            textDecoration: 'underline', background: 'none', border: 'none',
            cursor: 'pointer'
          }}
        >
          Modificar
        </button>
      );
    }
  }

  const renderRenovarAlquiler = (data) => {
    const row = data.data
    if (esAnteriorAHoy(row.fecha_hasta)) {
      return (
        <button
          style={{
            color: "grey", fontSize: "11px",
            textDecoration: 'underline', background: 'none', border: 'none',
            cursor: "none"
          }}
          disabled
        >
          Renovar alquiler
        </button>
      )
    } else if (!esAnteriorAHoy(row.fecha_hasta)) {
      return (
        <button
          onClick={() => window.open(`${import.meta.env.VITE_BASENAME}alquileres/${data.data.id}`, '_blank')}
          style={{
            color: '#1976d2', fontSize: "11px",
            textDecoration: 'underline', background: 'none', border: 'none',
            cursor: 'pointer'
          }}
        >
          Renovar alquiler
        </button>
      );
    }
  }

  const handleSubmit = () => {
    dispatch(getContratos(form))
  }

  const handleCustomSummary = (e) => {
    console.log("summaryProcess", e.summaryProcess);
    if (e.name === "countVehiculos") {
      if (e.summaryProcess === "start") {
        e.totalValue = 0;
      }
      if (e.summaryProcess === "calculate") {
        e.totalValue += 1;
      }
    }
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
          <span className={styles.loadingText}>Cargando contratos...</span>
        </div>
      )}
      <h2>Listado de contratos</h2>
      <div className={styles.filter}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: "4rem"
        }}>
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
      </div>
      <button onClick={handleActualizar} className={styles.refreshButton}>
        🔄 Actualizar reporte
      </button>
      <DataGrid
        className={styles.dataGrid}
        dataSource={contratos || []}
        showBorders={true}
        style={{ fontFamily: "IBM" }}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height={400}
      >
        <Scrolling mode="standard" />
        <Paging defaultPageSize={10} />
        <Column dataField="id_vehiculo" caption="Vehículo" cellRender={renderVehiculo} alignment="center" />
        <Column dataField="id_cliente" caption="Cliente" cellRender={renderCliente} alignment="center" />
        <Column dataField="fecha_desde" caption="Desde" cellRender={renderFecha} alignment="center" />
        <Column dataField="fecha_hasta" caption="Hasta" cellRender={renderFecha} alignment="center" />
        <Column dataField="deposito_garantia" alignment="right" caption="Depósito"
          customizeText={(e) => Math.trunc(e.value).toLocaleString("es-AR")} />
        <Column caption="" cellRender={renderModificar} alignment="center" />
        <Column caption="" cellRender={renderRenovarAlquiler} alignment="center" />
        <Summary calculateCustomSummary={handleCustomSummary}>
          <TotalItem
            name="countVehiculos"
            column="id_vehiculo"
            summaryType="custom"
            displayFormat="Total registros: {0}"
            showInColumn="id_vehiculo" />
        </Summary>
      </DataGrid>
    </div>
  )
}

export default ReporteContratos