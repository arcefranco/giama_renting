import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {Column, Scrolling, Export, SearchPanel, FilterRow, HeaderFilter, Paging} from "devextreme-react/data-grid"
import { getVehiculos } from '../../reducers/Vehiculos/vehiculosSlice';
import { getModelos, getProveedoresGPS } from '../../reducers/Generales/generalesSlice';
import styles from "./ReporteVehiculos.module.css"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
const ReporteVehiculos = () => {
const dispatch = useDispatch()
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
const {modelos, proveedoresGPS} = useSelector(state => state.generalesReducer)
const getNombreModelo = (id) => {
    const modelo = modelos.find((m) => m.id === id);
    return modelo ? modelo.nombre : id;
  };

  const getNombreProveedorGPS = (id) => {
    console.log(id)
    const proveedor = proveedoresGPS.find((p) => p.id == id);
    return proveedor ? proveedor.nombre : '';
  };
return (
<div className={styles.container}>
    <h2>Reporte de vehículos ingresados</h2>
      <DataGrid
        className={styles.dataGrid}
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

        <Column dataField="id" caption="ID" width={50} />
        <Column dataField="modelo" caption="Modelo" 
        cellRender={({ data }) => getNombreModelo(data.modelo)}/>
        <Column dataField="fecha_ingreso" caption="Fecha Ingreso" dataType="date" />
        <Column dataField="precio_inicial" caption="Precio Inicial" format="currency" />
        <Column dataField="dominio" caption="Dominio" />
        <Column dataField="nro_chasis" caption="Nro. Chasis" />
        <Column dataField="nro_motor" caption="Nro. Motor" />
        <Column dataField="kilometros_iniciales" caption="Km Iniciales" format="fixedPoint" />
        <Column
          dataField="proveedor_gps"
          caption="Proveedor GPS"
          cellRender={({ data }) => getNombreProveedorGPS(data.proveedor_gps)}
        />
        <Column dataField="nro_serie_gps" caption="Serie GPS" />
        <Column dataField="dispositivo_peaje" caption="Peaje" />
        <Column dataField="meses_amortizacion" caption="Amortización (Meses)" />
        <Column dataField="color" caption="Color" />
      </DataGrid>
    </div>
)
}

export default ReporteVehiculos