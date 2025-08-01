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
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';

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
    ingreso_egreso: '',
    activable: 0
})
useToastFeedback({
  isError,
  isSuccess,
  message,
  resetAction: reset,
  onSuccess: () => {
    setForm({
        nombre: '',
        cuenta_contable: '',
        cuenta_secundaria: '',
        ingreso_egreso: '',
        activable: 0
    })
  }
})

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
const handleCheckChange = (e) => {
  const { name, checked } = e.target;
  setForm(prevForm => ({
    ...prevForm,
    [name]: checked ? 1 : 0
  }));
}
const handleSubmit = async (e) => {
    e.preventDefault();
    if(form["ingreso_egreso"] == "I" && form["activable"] == 1){
      Swal.fire("Un ingreso no puede ser un gasto activable")
    }else{

      dispatch(postConceptoCostos(form))
    }
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
  return <div style={{
        display: "flex",
    justifyContent: "space-evenly",
  }}>
    <span>{data.data.cuenta_contable}</span>
    <span>{" "}</span>
    <span style={{width: "5rem"}}>{cuentasContables.find(e => e.Codigo == data.data.cuenta_contable)?.Nombre}</span>
  </div>
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
        <h2>Conceptos de costos e ingresos</h2>
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
        <Column dataField="nombre" width={200} caption="Nombre" alignment="left" />
        <Column dataField="cuenta_contable" width={400} caption="Cuenta contable" alignment="center" cellRender={renderCuentaContable}/>
        <Column dataField="cuenta_secundaria" width={100} caption="Cuenta secundaria" alignment="center" />
        <Column dataField="activable" width={100} caption="Es activable" 
        alignment="center" cellRender={(data) => {
          return data.data.activable == 1 ? "Sí" : "No"
        }}/>
        <Column dataField="ingreso_egreso" width={100} caption="Es ingreso/egreso" 
        alignment="center" cellRender={(data) => {
          return data.data.ingreso_egreso == "I" ? "Ingreso" : data.data.ingreso_egreso == "E" ? "Egreso" : null
        }}/>
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
            <div className={styles.inputContainer} style={{
                  width: "7rem"
            }}>
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
          <div className={styles.inputContainer} style={{
                flexDirection: "row",
                alignItems: "anchor-center"
          }}>
            <span>Gasto activable</span>
            <input name='activable'
            checked={form["activable"] === 1} onChange={handleCheckChange} type="checkbox" />
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