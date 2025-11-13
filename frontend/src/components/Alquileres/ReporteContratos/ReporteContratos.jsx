import React, { useEffect, useState, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getContratos, reset } from "./../../../reducers/Alquileres/alquileresSlice"
import { getVehiculos } from "./../../../reducers/Vehiculos/vehiculosSlice"
import { getClientes } from "./../../../reducers/Clientes/clientesSlice"
import { getModelos } from "./../../../reducers/Generales/generalesSlice"
import { useDispatch, useSelector } from "react-redux"
import DataGrid, {
  Column, Scrolling, Paging, TotalItem, Summary,
  FilterRow, HeaderFilter, Export, Lookup
} from "devextreme-react/data-grid"
import styles from "./ReporteContratos.module.css"
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { esAnteriorAHoy } from '../../../helpers/esAnteriorAHoy'
import { ToastContainer, toast } from 'react-toastify';
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx'
import { Workbook } from 'devextreme-exceljs-fork';
import { saveAs } from 'file-saver-es';
import { exportDataGrid } from 'devextreme/excel_exporter';

const ReporteContratos = () => {
  const dispatch = useDispatch()
  const location = useLocation();
  const esAVencer = location.pathname === "/alquileres/contrato/reporte/a-vencer";
  useEffect(() => {
    Promise.all([
      dispatch(getContratos({ fecha_desde: "", fecha_hasta: "", vigentes: 1 })),
      dispatch(getVehiculos()),
      dispatch(getClientes()),
      dispatch(getModelos())
    ])
  }, [])

  const {
    contratos,
    contratosAVencer,
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
    vigentes: 1
  })
  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
  })
  useEffect(() => {
    dispatch(getContratos({ fecha_desde: "", fecha_hasta: "", vigentes: form.vigentes }))
  }, [form.vigentes]);
  const handleActualizar = () => {
    dispatch(getContratos({ fecha_desde: form["fecha_desde"], fecha_hasta: form["fecha_hasta"], vigentes: form["vigentes"] }))
  }
  const handleCheckChange = (e) => {
    const { name, checked } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: checked ? 1 : 0
    }));
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
        <span> </span>
        <span>{cliente?.apellido}</span>
      </div>
    }
  }


  const normalizar = (str) => {
    if (!str) return "";
    return str.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Creamos una versión de 'clientes' con campos normalizados para búsqueda
  const clientesParaGrid = useMemo(() => {
    if (!clientes?.length) return [];
    return clientes.map(c => ({
      ...c,
      // Campos nuevos que usará el lookup para buscar
      nombreNorm: normalizar(c.nombre),
      apellidoNorm: normalizar(c.apellido)
    }));
  }, [clientes]);

  const vehiculosGrid = useMemo(() => {
    if (!clientes?.length) return [];
    return vehiculos.map(c => ({
      ...c,
      // Campos nuevos que usará el lookup para buscar
      dominio: normalizar(c.dominio),
      modelo: normalizar(c.modelo)
    }));
  }, [vehiculos]);

  const renderModificar = (data) => {
    const row = data.data
    if (row.dias_pendientes === 0) {
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
    } else if (row.dias_pendientes > 0) {
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
    if (row.dias_pendientes === 0) {
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
    } else if (row.dias_pendientes > 0) {
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



  const handleCustomSummary = (e) => {
    if (e.name === "countVehiculos") {
      if (e.summaryProcess === "start") {
        e.totalValue = 0;
      }
      if (e.summaryProcess === "calculate") {
        e.totalValue += 1;
      }
    }
  };
  const getVehiculoExportValue = (id_vehiculo) => {
    if (!id_vehiculo) return '';
    const vehiculo = vehiculos?.find(e => e.id == id_vehiculo);
    if (!vehiculo) return "SIN DATOS";

    // Obtener dominio
    const dominio = vehiculo.dominio || vehiculo.dominio_provisorio || "SIN DOMINIO";

    // Obtener modelo
    const modeloNombre = modelos?.find(e => e.id == vehiculo.modelo)?.nombre || "";

    return `${dominio} ${modeloNombre}`;
  };

  // Cliente: Nombre y Apellido
  const getClienteExportValue = (id_cliente) => {
    if (!id_cliente) return '';
    const cliente = clientes?.find(e => e.id == id_cliente);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : '';
  };

  // Fechas: YYYY-MM-DD a DD/MM/YYYY
  const getFechaExportValue = (fecha_iso) => {
    if (!fecha_iso) return '';
    const fechaSplit = fecha_iso.split("-");
    // Formato DD/MM/YYYY
    return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`;
  };
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
            excelCell.value = getVehiculoExportValue(rawValue);
          }
          // Columna Cliente (id_cliente)
          else if (dataField === 'id_cliente') {
            excelCell.value = getClienteExportValue(rawValue);
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
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'Listado_Contratos.xlsx');
      });
    });
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
      {/*       <div className={styles.filter}>
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
      </div> */}
      <button onClick={handleActualizar} className={styles.refreshButton}>
        🔄 Actualizar reporte
      </button>
      <div className={styles.inputContainer} style={{ alignItems: "self-end" }}>
        <span>Vigentes</span>
        <input type="checkbox" name='vigentes' value={form["vigentes"]}
          onChange={handleCheckChange} checked={!!form.vigentes} />
      </div>
      <DataGrid
        className={styles.dataGrid}
        dataSource={esAVencer ? (contratosAVencer || []) : contratos || []}
        showBorders={true}
        style={{ fontFamily: "IBM" }}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height={550}
        onExporting={onExporting}
      >
        <Scrolling mode="standard" />
        <FilterRow visible={true} showAllText={""} />
        <Export enabled={true} fileName="Listado_Contratos" />
        <HeaderFilter visible={true} />
        <Paging defaultPageSize={20} />
        <Column dataField="id" caption="ID" allowHeaderFiltering={false} alignment="center" />
        <Column dataField="id_vehiculo" caption="Vehículo" allowHeaderFiltering={false} cellRender={renderVehiculo} alignment="center" >
          <Lookup
            dataSource={vehiculosGrid}
            valueExpr="id"
            displayExpr={(item) => item ? `${item.dominio}` : ""}
            searchExpr={["dominio"]}
          />

        </Column>
        <Column
          dataField="id_cliente"
          dataType="number" // Asegúrate de que coincida con el tipo de 'id' (tu ejemplo dice 5)
          caption="Cliente"
          cellRender={renderCliente} // Puedes mantener tu render personalizado
          alignment="center"
          allowHeaderFiltering={false}
        >
          <Lookup
            dataSource={clientesParaGrid}
            valueExpr="id"
            displayExpr={(item) => item ? `${item.nombre} ${item.apellido}` : ""}
            searchExpr={["nombreNorm", "apellidoNorm"]}
          />
        </Column>
        <Column dataField="fecha_desde" caption="Desde" allowHeaderFiltering={false} allowFiltering={false} cellRender={renderFecha} alignment="center" />
        <Column dataField="fecha_hasta" caption="Hasta" allowHeaderFiltering={false} allowFiltering={false} cellRender={renderFecha} alignment="center" />
        <Column dataField="deposito_garantia" alignment="right" allowHeaderFiltering={false} allowFiltering={false} caption="Depósito"
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