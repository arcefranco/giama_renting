import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {Column, Scrolling, Export, SearchPanel, FilterRow, HeaderFilter, Paging} from "devextreme-react/data-grid"
import { getVehiculos } from '../../reducers/Vehiculos/vehiculosSlice';
import { getModelos, getProveedoresGPS , getSucursales} from '../../reducers/Generales/generalesSlice';
import styles from "./ReporteVehiculos.module.css"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
const ReporteVehiculos = () => {
const dispatch = useDispatch();
useEffect(() => {
    Promise.all([
        dispatch(getVehiculos()),
        dispatch(getModelos()),
        dispatch(getProveedoresGPS()),
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
const {modelos, proveedoresGPS, sucursales} = useSelector(state => state.generalesReducer)
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
};const getNombreSucursales = (id) => {
  const sucursal = sucursales.find((p) => p.id == id);
  return sucursal ? sucursal.nombre : '';
};
const renderImagenesCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/vehiculos/imagenes/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Ver
      </button>
    );
};
const renderModificarCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/vehiculos/actualizar/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Modificar
      </button>
    );
};
const renderEstado = (data) => {
  if(data.data.proveedor_gps !== 0 /* || null */ && 
    data.data.nro_serie_gps !== 0 /* || null */ &&
    data.data.calcomania !== 0 &&
    data.data.gnc !== 0){
      return <span className={styles.spanPreparado}>Preparado</span>
  }else{
    return <span className={styles.spanNoPreparado}>Sin preparar</span>
  }
}
const renderFecha = (data) => {
  if(data.value){
    let fechaSplit = data.value?.split("-")
    return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
  }else{
    return ""
  }
}
return (
<div className={styles.container}>
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
        style={{fontFamily: "IBM"}}
        dataSource={vehiculos || []}
        showBorders={true}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        height={400}
        
      >
        <SearchPanel visible={true} highlightCaseSensitive={true} />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Export enabled={true} allowExportSelectedData={true} />
        <Scrolling mode="standard" />
        <Paging defaultPageSize={10} />
        <Column dataField="id" caption="Estado" cellRender={renderEstado} width={130} />
        <Column dataField="id" caption="ID" width={50} />
        <Column dataField="modelo" width={75} caption="Modelo" 
        cellRender={({ data }) => getNombreModelo(data.modelo)}/>
        <Column dataField="fecha_ingreso" width={85} caption="Ingreso" dataType="date" />
        <Column dataField="precio_inicial" caption="Precio Inicial" width={100} format="currency" />
        <Column dataField="dominio" caption="Dominio" />
        <Column dataField="nro_chasis" caption="Nro. Chasis" />
        <Column dataField="nro_motor" caption="Nro. Motor" />
        <Column dataField="kilometros_iniciales" width={100} caption="Km Iniciales" format="fixedPoint" />
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
        <Column dataField="fecha_preparacion" caption="Fecha de preparación" cellRender={renderFecha}/>
        <Column dataField="id" caption="Imágenes" width={100} alignment="center" cellRender={renderImagenesCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderModificarCell} />
      </DataGrid>
    </div>
)
}

export default ReporteVehiculos