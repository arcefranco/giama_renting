import React, { useEffect, useState } from 'react';
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
        dispatch(getSucursales()),
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
const [vehiculosConEstado, setVehiculosConEstado] = useState(null)

useEffect(() => {
if(vehiculos){
  setVehiculosConEstado(vehiculos?.map(v => {
  let estado = "";

  if (v.fecha_venta) {
    estado = "Vendido";
  } else if (v.vehiculo_alquilado === 1) {
    estado = "Alquilado";
  } else if (
    v.estado_actual == 2
  ) {
    estado = "Listo para alquilar";
  }
  else if (v.estado_actual == 3){
    estado = "En reparación"
  }
  else if (v.estado_actual == 4){
    estado = "Seguro a recuperar"
  }
    else if (v.estado_actual == 1){
    estado = "Sin preparar"
  }
  else {
    estado = "Sin estado disponible";
  }

  const dominio_visible = v.dominio
  ? v.dominio
  : v.dominio_provisorio
  ? v.dominio_provisorio
  : "SIN DOMINIO";

  return {
    ...v,
    estado,
    dominio_visible
  };
}))
}
}, [vehiculos])

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
const renderCostosCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/costos/ingresos_egresos/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', fontSize: "11px" ,textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Costos
      </button>
    );
};
const renderAlquilerCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/alquileres/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', fontSize: "11px" ,
          textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Alquilar
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
    return ""
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
        height={400}
        
      >
        <SearchPanel visible={true} highlightCaseSensitive={true} />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Export enabled={true} allowExportSelectedData={true} />
        <Scrolling mode="standard" />
        <Paging defaultPageSize={10} />
        <Column
          dataField="estado"
          caption="Estado actual"
          width={160}
          cellRender={({ data }) => {
            switch (data.estado) {
              case "Vendido":
                return <span className={styles.spanVendido}>Vendido</span>;
              case "Alquilado":
                return <span className={styles.spanAlquilado}>Alquilado</span>;
              case "Listo para alquilar":
                return <span className={styles.spanPreparado}>Listo para alquilar</span>;
              case "En reparación":
                return <span className={styles.spanReparacion}>En reparación</span>;
              case "Seguro a recuperar":
                return <span className={styles.spanSeguro}>Seguro a recuperar</span>;
              case "Sin preparar":
                return <span className={styles.spanNoPreparado}>Sin preparar</span>;
              default:
                return <span className={styles.spanNoDisponible}>Sin estado disponible</span>;
            }
          }}
        />
        <Column dataField="id" caption="ID" width={50} />
        <Column dataField="modelo" width={75} caption="Modelo" 
        cellRender={({ data }) => getNombreModelo(data.modelo)}/>
        <Column dataField="fecha_ingreso" width={85} caption="Ingreso" dataType="date" alignment="center"/>
        <Column dataField="precio_inicial" caption="Precio Inicial" alignment="right" width={100} format="currency" />
        <Column
        dataField="dominio_visible"
        caption="Dominio"
        cellRender={({ data }) => {
          return (
            data.dominio ? (
              <span>{data.dominio}</span>
            ) : data.dominio_provisorio ? (
              <span>{data.dominio_provisorio}</span>
            ) : (
              <span>SIN DOMINIO</span>
            )
          );
        }}
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
        <Column dataField="fecha_preparacion" caption="Fecha de preparación" alignment="center" cellRender={renderFecha}/>
        <Column dataField="id"  width={100} alignment="center" cellRender={renderImagenesCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderModificarCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderCostosCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderAlquilerCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderFichaCell} />
      </DataGrid>
    </div>
)
}

export default ReporteVehiculos