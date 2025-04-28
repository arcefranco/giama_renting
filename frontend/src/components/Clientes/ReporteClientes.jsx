import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {Column, Scrolling, Export, SearchPanel, FilterRow, HeaderFilter, Paging} from "devextreme-react/data-grid"
import { getClientes } from '../../reducers/Clientes/clientesSlice';
import { getTiposDocumento, getTiposResponsable, getProvincias } from '../../reducers/Generales/generalesSlice.js';
import styles from "./ReporteClientes.module.css"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
const ReporteClientes = () => {
const dispatch = useDispatch();
useEffect(() => {
    Promise.all([
        dispatch(getClientes()),
        dispatch(getTiposResponsable()),
        dispatch(getTiposDocumento()),
        dispatch(getProvincias()),
        locale('es')
    ])

}, [])
const {
    clientes,
    message,
    isError,
    isSuccess,
    isLoading
} = useSelector((state) => state.clientesReducer)
const {
    provincias,
    tipos_responsable,
    tipos_documento
} = useSelector((state) => state.generalesReducer)

const handleActualizar = ( ) => {
  dispatch(getClientes())
}
const getTipoDocumento = (id) => {

    const tipoDoc = tipos_documento.find((m) => m.id === id); 
    return tipoDoc ? tipoDoc.nombre : id;
}

const getTipoResponsableCell = (id) => {
    const tipoRes = tipos_responsable.find((m) => m.id == id); 
    console.log(tipos_responsable, id)
    return tipoRes ? tipoRes.nombre : id;
}

const getProvinciasCell = (id) => {
    const provincia = provincias.find((m) => m.id === id); 
    return provincia ? provincia.nombre : id;
}
const renderFecha = (data) => {
  let fechaSplit = data.value.split("-")
  return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
}
const renderImagenesCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/clientes/imagenes/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Ver
      </button>
    );
};
const renderModificarCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/clientes/actualizar/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Modificar
      </button>
    );
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
      <span className={styles.loadingText}>Cargando clientes...</span>
    </div>
  )}
    <h2>Reporte de clientes ingresados</h2>
    <button onClick={handleActualizar} className={styles.refreshButton}>
    🔄 Actualizar reporte
    </button>
      <DataGrid
        className={styles.dataGrid}
        dataSource={clientes || []}
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
        <Column dataField="id" caption="ID" width={40} />
        <Column dataField="nombre" caption="Nombre" width={85}/>
        <Column dataField="apellido" caption="Apellido" width={85}/>
        <Column dataField="razon_social" caption="Razón social" width={85} />
        <Column dataField="fecha_nacimiento"
        cellRender={renderFecha}
        caption="
         de nacimiento" width={90}/>
        <Column dataField="nacionalidad" caption="Nacionalidad" width={90} />
        <Column dataField="tipo_contribuyente" caption="Tipo responsable"
        cellRender={({ data }) => getTipoResponsableCell(data["tipo_contribuyente"])}
        width={125}/>
        <Column dataField="tipo_documento" 
        cellRender={({ data }) => getTipoDocumento(data["tipo_documento"])}
        caption="Tipo documento" width={90} />
        <Column dataField="nro_documento" caption="Nro. documento" width={90} />
        <Column dataField="doc_expedido_por" caption="Doc. exp. por" width={90}/>
        <Column dataField="licencia" caption="Licencia" width={90}/>
        <Column dataField="lic_expedida_por" caption="Lic. exp. por" width={90}/>
        <Column dataField="fecha_vencimiento_licencia"
        cellRender={renderFecha}
        caption="Fecha de vencimiento (licencia)" width={90} />
        <Column dataField="direccion" caption="Dirección" width={90}/>
        <Column dataField="nro_direccion" caption="Nro. dirección" width={90}/>
        <Column dataField="piso" caption="Piso" width={60}/>
        <Column dataField="depto" caption="Depto." width={60}/>
        <Column dataField="codigo_postal" caption="Código postal" width={90}/>
        <Column dataField="provincia" caption="Provincia"
        cellRender={({ data }) => getProvinciasCell(data["provincia"])} 
        width={100}/>
        <Column dataField="ciudad" caption="Ciudad" width={90}/>
        <Column dataField="celular" caption="Celular" width={90}/>
        <Column dataField="mail" caption="Mail" width={90}/>
        <Column dataField="notas" caption="Notas" width={90} />
        <Column dataField="id" caption="Imágenes" width={100} alignment="center" cellRender={renderImagenesCell} />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderModificarCell} />
      </DataGrid>
    </div>
)
}

export default ReporteClientes