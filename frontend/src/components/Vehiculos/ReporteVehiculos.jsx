import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {Column, Scrolling, Export, SearchPanel, FilterRow, HeaderFilter, Paging} from "devextreme-react/data-grid"
import { getVehiculos, reset } from '../../reducers/Vehiculos/vehiculosSlice';
import { getModelos, getProveedoresGPS , getSucursales, getEstados} from '../../reducers/Generales/generalesSlice';
import styles from "./ReporteVehiculos.module.css"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { renderEstadoVehiculo } from '../../utils/renderEstadoVehiculo';
import { useToastFeedback } from '../../customHooks/useToastFeedback';
import { ToastContainer } from 'react-toastify';
const ReporteVehiculos = () => {
const dispatch = useDispatch();
useEffect(() => {
    Promise.all([
        dispatch(getVehiculos()),
        dispatch(getModelos()),
        dispatch(getProveedoresGPS()),
        dispatch(getSucursales()),
        dispatch(getEstados()),
        locale('es')
    ])

}, [])
const {
    vehiculos,
    message,
    isError,
    isSuccess,
    isLoading
} = useSelector((state) => state.vehiculosReducer)
const {modelos, proveedoresGPS, sucursales, estados} = useSelector(state => state.generalesReducer)
const [vehiculosConEstado, setVehiculosConEstado] = useState(null)
useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset
  });
useEffect(() => {
  if (vehiculos && estados?.length) {
    setVehiculosConEstado(
      vehiculos.map((v) => {
        const dominio_visible = v.dominio
          ? v.dominio
          : v.dominio_provisorio
          ? v.dominio_provisorio
          : "SIN DOMINIO";

        let estado_nombre = "";

        if (v.fecha_venta) {
          estado_nombre = "Vendido";
        } else if (v.vehiculo_alquilado === 1) {
          estado_nombre = "Alquilado";
        } else if (v.vehiculo_reservado === 1) {
          estado_nombre = "Reservado";
        } else {
          const estado = estados.find((e) => e.id === v.estado_actual);
          estado_nombre = estado?.nombre || "Sin estado";
        }

        return {
          ...v,
          dominio_visible,
          estado_nombre, // lo usamos para filtrar
        };
      })
    );
  }
}, [vehiculos, estados]);

const getNombreModelo = (id) => {
  const modelo = modelos.find((m) => m.id === id); 
  return modelo ? modelo.nombre : id;
};
const handleActualizar = () => {
  dispatch(getVehiculos())
};
const getNombreProveedorGPS = (id) => {
  const proveedor = proveedoresGPS.find((p) => p.id == id);
  return proveedor ? proveedor.nombre : '';
};
const getNombreSucursales = (id) => {
  const sucursal = sucursales.find((p) => p.id == id);
  return sucursal ? sucursal.nombre : '';
};
const renderImagenesCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/vehiculos/imagenes/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', fontSize: "11px", textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Imagenes
      </button>
    );
};
const renderModificarCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/vehiculos/actualizar/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', fontSize: "11px", textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Modificar
      </button>
    );
};
const renderEgresosCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/costos/egresos/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', fontSize: "11px" ,textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Egresos
      </button>
    );
};
const renderIngresosCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/costos/ingresos/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', fontSize: "11px" ,textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Ingresos
      </button>
    );
};
const renderFichaCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/vehiculos/ficha/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', fontSize: "11px" ,
          textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Ver ficha
      </button>
    );
};
const renderFecha = (data) => {
  if(data.value){
    let fechaSplit = data.value?.split("-")
    return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
  }else{
    return "sin fecha"
  }
}
const renderDominio = (data) => {
    return (
      data.data.dominio ? <span>{data.data.dominio}</span> : 
      data.data.dominio_provisorio ? <span>{data.data.dominio_provisorio}</span> : 
      <span>SIN DOMINIO</span>
    )
};

return (
<div className={styles.container}>
  <ToastContainer/>
{isLoading && (
    <div className={styles.spinnerOverlay}>
    <ClipLoader
      size={60}
      color="#800020" // bordó
      loading={true}
    />
      <span className={styles.loadingText}>Cargando vehículos...</span>
    </div>
  )}
    <h2>Reporte de vehículos ingresados</h2>
    <button onClick={handleActualizar} className={styles.refreshButton}>
    🔄 Actualizar reporte
    </button>
      <DataGrid
        className={styles.dataGrid}
        style={{fontFamily: "IBM", fontSize: "12px"}}
        dataSource={vehiculosConEstado || []}
        showBorders={true}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height={400}>
        <SearchPanel visible={true} highlightCaseSensitive={true} />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Export enabled={true} allowExportSelectedData={true} />
        <Scrolling mode="standard" />
        <Paging defaultPageSize={10} />
        <Column
        dataField="estado_nombre"
        caption="Estado"
        calculateDisplayValue={(rowData) => {   
        if (rowData.fecha_venta) return "Vendido";
        if (rowData.vehiculo_alquilado === 1) return "Alquilado";
        if (rowData.vehiculo_reservado === 1) return "Reservado";

        const estado = estados?.find((e) => e.id === rowData.estado_actual);
        return estado?.nombre || "Sin estado";
        }}
        cellRender={({ data }) => renderEstadoVehiculo(data)}
        />
        <Column dataField="id" caption="ID" width={50} />
        <Column dataField="modelo" width={75} caption="Modelo" 
        cellRender={({ data }) => getNombreModelo(data.modelo)}/>
        <Column dataField="fecha_ingreso" width={85} caption="Ingreso" dataType="date" alignment="center"/>
        <Column dataField="precio_inicial" caption="Precio Inicial" alignment="right" width={100} format="currency" />
        <Column
        dataField="dominio_visible"
        caption="Dominio"
        cellRender={renderDominio}
        />
        <Column dataField="nro_chasis" caption="Nro. Chasis" />
        <Column dataField="nro_motor" caption="Nro. Motor" />
        <Column dataField="kilometros_iniciales" width={100} caption="Km Iniciales" format="fixedPoint" />
        <Column dataField="kilometros_actuales" width={100} caption="Km Actuales" format="fixedPoint" />
        <Column
          dataField="proveedor_gps"
          caption="Proveedor GPS"
          width={100}
          cellRender={({ data }) => getNombreProveedorGPS(data.proveedor_gps)}
        />
        <Column dataField="nro_serie_gps" caption="Serie GPS" />
        <Column dataField="dispositivo_peaje" caption="Peaje" />
        <Column dataField="meses_amortizacion" width={75} caption="Amortización (Meses)" />
        <Column dataField="color" caption="Color" width={75} />
        <Column dataField="sucursal" caption="Sucursal" cellRender={({ data }) => getNombreSucursales(data.sucursal)}/>
        <Column dataField="calcomania" caption="Calcomanía" width={75} 
        cellRender={({ data }) => {
          if(data["calcomania"] === 1){
            return "Sí"
          }else{
            return "No"
          }
        }}/>
        <Column dataField="gnc" caption="GNC" width={75} 
        cellRender={({ data }) => {
          if(data["gnc"] === 1){
            return "Sí"
          }else{
            return "No"
          }
        }}/>
        <Column dataField="fecha_inicio_amortizacion" caption="Fecha amortización" alignment="center" cellRender={renderFecha}/>
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderImagenesCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderModificarCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderIngresosCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderEgresosCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderFichaCell} />
      </DataGrid>
    </div>
)
}

export default ReporteVehiculos