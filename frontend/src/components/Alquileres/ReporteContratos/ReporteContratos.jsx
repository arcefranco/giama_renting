import React, { useEffect, useState } from 'react'
import { getContratos, reset } from "./../../../reducers/Alquileres/alquileresSlice"
import { getVehiculos } from "./../../../reducers/Vehiculos/vehiculosSlice"
import { getClientes } from "./../../../reducers/Clientes/clientesSlice"
import { getModelos } from "./../../../reducers/Generales/generalesSlice"
import { useDispatch, useSelector } from "react-redux"
import DataGrid, { Column, Scrolling, Paging, TotalItem, Summary, FilterRow, HeaderFilter, Export } from "devextreme-react/data-grid"
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
    dispatch(getContratos({ fecha_desde: form["fecha_desde"], fecha_hasta: form["fecha_hasta"] }))
  }
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    })
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
  const getClienteNombreCompletoParaOrdenar = (id_cliente) => {
    const cliente = clientes?.find(e => e.id == id_cliente);
    // Combina apellido y nombre para ordenar correctamente por apellido primero
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : '';
  };

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
        dataSource={contratos || []}
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
        <Paging defaultPageSize={12} />
        <Column dataField="id_vehiculo" caption="Vehículo" allowHeaderFiltering={false} allowFiltering={false} cellRender={renderVehiculo} alignment="center" />
        <Column dataField="id_cliente" dataType="string" caption="Cliente" cellRender={renderCliente} alignment="center"
          calculateSortValue={(data) => getClienteNombreCompletoParaOrdenar(data.id_cliente)}
          allowHeaderFiltering={false}
          calculateFilterExpression={(filterValue, selectedFilterOperation, target) => {
            if (!filterValue) return;
            // Creamos una expresión personalizada: buscamos coincidencias en nombre o apellido
            return [
              ["id_cliente", "=", getIdClientePorNombre(filterValue)]
            ];
          }} />
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