import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {Column} from "devextreme-react/data-grid"
import { deleteConcepto, getConceptosCostos, reset, getCuentasContables } from '../../reducers/Costos/costosSlice.js';
import styles from "./ReporteConceptos.module.css"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import Swal from 'sweetalert2';
const ReporteConceptos = () => {
const dispatch = useDispatch();
useEffect(() => {
    Promise.all([
        dispatch(getConceptosCostos()),
        dispatch(getCuentasContables()),
        locale('es')
    ])

}, [])
const {isError, isSuccess, isLoading, message, conceptos, cuentasContables} = useSelector((state) => state.costosReducer)
useEffect(() => {

    if(isError){
        toast.error(message, {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          })
          dispatch(reset())
      }
      if(isSuccess){
        toast.success(message, {
          position: "bottom-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
          })
          dispatch(reset())
      }
  
}, [isError, isSuccess])

const handleActualizar = ( ) => {
  dispatch(getConceptosCostos())
}
const renderModificarCell = (data) => {
    return (
      <button
        onClick={() => window.open(`/costos/conceptos/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Modificar
      </button>
    );
};

const renderCuentaContable = (data) => {
  return `${data.data.cuenta_contable} - ${cuentasContables.find(e => e.Codigo == data.data.cuenta_contable)?.Nombre}`
}

const handleDeleteClick = (id) => {
Swal.fire({
    title: '¿Seguro que querés eliminar este concepto?',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    icon: 'warning',
    didOpen: () => {
    document.body.classList.remove('swal2-height-auto');
    }
}).then((result) => {
    if (result.isConfirmed) {
    dispatch(deleteConcepto({id: id}));
    }
});
};
const renderEliminarCell = (data) => {
    return (
      <button
        onClick={() => handleDeleteClick(data.data.id)} 
        style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Eliminar
      </button>
    );
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
      <span className={styles.loadingText}>Cargando...</span>
    </div>
  )}
    <h2>Conceptos de costos</h2>
    <button onClick={handleActualizar} className={styles.refreshButton}>
    🔄 Actualizar
    </button>
      <DataGrid
        className={styles.dataGrid}
        dataSource={conceptos || []}
        showBorders={true}
        style={{fontFamily: "IBM"}}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        columnAutoWidth={true}>
        <Column dataField="nombre" caption="Nombre" alignment="left" />
        <Column dataField="cuenta_contable" caption="Cuenta contable" alignment="center" cellRender={renderCuentaContable}/>
        <Column dataField="cuenta_secundaria" caption="Cuenta secundaria" alignment="center" />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderModificarCell} />
        <Column dataField="id" width={100} caption="" alignment="center" cellRender={renderEliminarCell} />
      </DataGrid>
    </div>
)
}

export default ReporteConceptos