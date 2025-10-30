import React, { useEffect, useState } from 'react'
import { getAlquileres, reset } from "./../../../reducers/Alquileres/alquileresSlice"
import { getVehiculos } from "./../../../reducers/Vehiculos/vehiculosSlice"
import { getClientes } from "./../../../reducers/Clientes/clientesSlice"
import { getModelos } from "./../../../reducers/Generales/generalesSlice"
import { useDispatch, useSelector } from "react-redux"
import DataGrid, {
  Column, Scrolling, Paging, TotalItem, Summary,
  SearchPanel, HeaderFilter, FilterRow, Export
} from "devextreme-react/data-grid"
import styles from "./ReporteAlquileres.module.css"
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { redondear } from "../../../helpers/redondear"
import { ToastContainer, toast } from 'react-toastify';
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx'
import { Workbook } from 'devextreme-exceljs-fork';
import { saveAs } from 'file-saver-es';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { getVehiculoExportValue, getClienteExportValue, getFechaExportValue } from '../../../helpers/exportValueDataGrid.js'
const ReporteAlquileres = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    Promise.all([
      dispatch(getAlquileres({ fecha_desde: "", fecha_hasta: "" })),
      dispatch(getVehiculos()),
      dispatch(getClientes()),
      dispatch(getModelos()),
      dispatch(reset())
    ])
    return () => {
      dispatch(reset())
    }
  }, [dispatch])

  const {
    alquileres,
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
  const [alquileresConDatos, setAlquileresConDatos] = useState([]);
  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
  })
  useEffect(() => {
    if (!alquileres || !vehiculos || !clientes || !modelos) return;

    const mapeado = alquileres.map(a => {
      const vehiculo = vehiculos.find(v => v.id === a.id_vehiculo);
      const cliente = clientes.find(c => c.id === a.id_cliente);
      const modelo = modelos.find(m => m.id === vehiculo?.modelo);

      const dominio = vehiculo?.dominio || vehiculo?.dominio_provisorio || "SIN DOMINIO";
      const modeloNombre = modelo?.nombre || "";
      const vehiculoTexto = `${dominio} ${modeloNombre}`

      const clienteTexto = `${cliente?.nombre || ""} ${cliente?.apellido || ""}`

      return {
        ...a,
        vehiculo_texto: vehiculoTexto,
        cliente_texto: clienteTexto,
      };
    });

    setAlquileresConDatos(mapeado);
  }, [alquileres, vehiculos, clientes, modelos]);
  const handleActualizar = () => {
    dispatch(getAlquileres({ fecha_desde: form["fecha_desde"], fecha_hasta: form["fecha_hasta"] }))
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
  /*   const renderVehiculo = (data) => {
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
    } */
  const handleSubmit = () => {
    dispatch(getAlquileres(form))
  }
  const onExporting = (e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Contratos');

    exportDataGrid({
      component: e.component,
      worksheet: worksheet,
      autoFilterEnabled: true,

      // ******* Lógica para sobrescribir los valores en el Excel *******
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === 'data') {
          const dataField = gridCell.column.dataField;
          const rawValue = gridCell.data[dataField]; // Valor original del array 'contratos'

          // Columna Vehículo (id_vehiculo)
          if (dataField === 'id_vehiculo') {
            excelCell.value = getVehiculoExportValue(rawValue, vehiculos, modelos);
          }
          // Columna Cliente (id_cliente)
          else if (dataField === 'id_cliente') {
            excelCell.value = getClienteExportValue(rawValue, clientes);
          }
          // Columnas de Fecha (fecha_desde, fecha_hasta)
          else if (dataField === 'fecha_desde' || dataField === 'fecha_hasta') {
            excelCell.value = getFechaExportValue(rawValue);
          }
        }
      },
      // ***************************************************************
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Listado_Alquileres.xlsx');
      });
    });
  };
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
    if (e.name === "importeTotal") {
      if (e.summaryProcess === "start") {
        e.totalValue = 0;
      }
      if (e.summaryProcess === "calculate") {
        const valor = Number(e.value) || 0;
        e.totalValue += valor;
      }
      if (e.summaryProcess === "finalize") {
        e.totalValue = redondear(e.totalValue);
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
          <span className={styles.loadingText}>Cargando alquileres...</span>
        </div>
      )}
      <h2>Listado de alquileres</h2>
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
        dataSource={alquileresConDatos || []}
        showBorders={true}
        style={{ fontFamily: "IBM" }}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height={400}
        onExporting={onExporting}
      >
        <SearchPanel visible={true} highlightCaseSensitive={true} />
        <HeaderFilter visible={true} />
        <Export enabled={true} fileName="Listado_Contratos" />
        <Scrolling mode="standard" />
        <Paging defaultPageSize={10} />
        <Column dataField="vehiculo_texto" caption="Vehículo" dataType="string" alignment="center" />
        <Column dataField="cliente_texto" caption="Cliente" dataType="string" alignment="center" />
        <Column dataField="fecha_desde" allowSearch={false} allowHeaderFiltering={false} caption="Desde" cellRender={renderFecha} alignment="center" />
        <Column dataField="fecha_hasta" allowSearch={false} allowHeaderFiltering={false} caption="Hasta" cellRender={renderFecha} alignment="center" />
        <Column dataField="importe_neto" allowSearch={false} allowHeaderFiltering={false} alignment="right" caption="Importe neto" customizeText={(e) => Math.trunc(e.value).toLocaleString()} />
        <Summary calculateCustomSummary={handleCustomSummary}>
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
        </Summary>
      </DataGrid>
    </div>
  )
}

export default ReporteAlquileres