import React, {useState, useEffect, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import DataGrid, {Column} from "devextreme-react/data-grid"
import { ClipLoader } from "react-spinners";
import styles from "./AltaCostos.module.css"
import { getCuentasContables, postConceptoCostos, 
reset, getConceptosCostos, deleteConcepto } from '../../reducers/Costos/costosSlice'
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import Swal from 'sweetalert2';

const AltaCostos = () => {
const dispatch = useDispatch()
    useEffect(() => {
    Promise.all([
        dispatch(getConceptosCostos()),
        dispatch(getCuentasContables()),
        locale('es')
    ])
}, [])

const {isError, isSuccess, isLoading, message, cuentasContables, conceptos} = useSelector((state) => state.costosReducer)
const [form, setForm] = useState({
    nombre: '',
    cuenta_contable: '',
    cuenta_secundaria: '',
    ingreso_egreso: ''
})
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
        setForm({
            nombre: '',
            cuenta_contable: '',
            cuenta_secundaria: '',
            ingreso_egreso: ''
        })
    }

  }, [isError, isSuccess]) 
const handleChange = (e) => {
    const { name, value } = e.target;
    if(name === "cuenta_contable"){
        setForm({
            ...form,
            "cuenta_contable": value,
            "cuenta_secundaria": cuentasContables?.find(e => e.Codigo == value)?.CuentaSecundaria
        })
    }else{
        setForm({
         ...form,
         [name]: value,
       }); 

    }
};
const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postConceptoCostos(form))
} 
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
    <div>
      <div className={styles.container}>
          <ToastContainer /> 
          {isLoading && (
      <div className={styles.spinnerOverlay}>
        <ClipLoader
          size={60}
          color="#800020" // bordó
          loading={true}
        />
        <p className={styles.loadingText}>Cargando...</p>
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
        height={300}
        columnAutoWidth={true}>
        <Column dataField="nombre" caption="Nombre" alignment="left" />
        <Column dataField="cuenta_contable" caption="Cuenta contable" alignment="center" cellRender={renderCuentaContable}/>
        <Column dataField="cuenta_secundaria" caption="Cuenta secundaria" alignment="center" />
        <Column dataField="id"  width={100} caption="" alignment="center" cellRender={renderModificarCell} />
        <Column dataField="id" width={100} caption="" alignment="center" cellRender={renderEliminarCell} />
      </DataGrid>
            <h2>Alta de conceptos de costos</h2>
            <form action="" enctype="multipart/form-data" className={styles.form}>
            <div className={styles.inputContainer}>
                <span>Concepto</span>
                <input type="text" name='nombre' value={form["nombre"]} 
              onChange={handleChange}/>
            </div>
            <div className={styles.inputContainer}>
              <span>Cuenta contable</span>
              <select name="cuenta_contable"  value={form["cuenta_contable"]} 
              onChange={handleChange} id="">
                <option value={""} disabled selected>{"Seleccione una cuenta"}</option>
                {
                  cuentasContables?.length && cuentasContables?.map(e => {
                    return <option key={e.Codigo} value={e.Codigo}>{e.Codigo} - {e.Nombre}</option>
                  })
                }
              </select>
            </div>
            <div className={styles.inputContainer}>
            <span>Tipo</span>
            <label>
              <input
                type="radio"
                name="ingreso_egreso"
                value="I"
                checked={form.ingreso_egreso === "I"}
                onChange={handleChange}
              />
              Ingreso
            </label>
            <label>
              <input
                type="radio"
                name="ingreso_egreso"
                value="E"
                checked={form.ingreso_egreso === "E"}
                onChange={handleChange}
              />
              Egreso
            </label>
          </div>
            </form>
            <button 
            className={styles.sendBtn} onClick={handleSubmit} 
            disabled={!form["cuenta_contable"] || !form["nombre"]  || !form["ingreso_egreso"]}>
              Enviar
            </button>
      </div>
</div>
  )
}

export default AltaCostos