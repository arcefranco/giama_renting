import React, {useState, useEffect, useRef} from 'react'
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import styles from "./AltaCostos.module.css"
import { getCuentasContables, getConceptosCostosById, updateConcepto, reset } from '../../reducers/Costos/costosSlice'
import { useToastFeedback } from '../../customHooks/useToastFeedback';
const  UpdateConcepto = () => {
const { id } = useParams();
const dispatch = useDispatch()
    useEffect(() => {
    Promise.all([
        dispatch(getConceptosCostosById({id: id})),
        dispatch(getCuentasContables()),
    ])
}, [])

const {isError, isSuccess, isLoading, message, cuentasContables, concepto} = useSelector((state) => state.costosReducer)
const [tipo, setTipo] = useState(null)
const [form, setForm] = useState({
    nombre: '',
    cuenta_contable: '',
    cuenta_secundaria: '',
    ingreso_egreso: '',
    activable: 0,
    genera_factura: 0,
    genera_recibo: 0,
    id: id
})
useToastFeedback({
  isError,
  isSuccess,
  message,
  resetAction: reset
})
useEffect(() => {
if(concepto?.length){
setTipo(concepto[0]["ingreso_egreso"])
}
}, [concepto, id])
useEffect(() => {
if(concepto?.length){
    setForm({
        nombre: concepto[0]?.nombre,
        cuenta_contable: concepto[0]?.cuenta_contable,
        cuenta_secundaria: concepto[0]?.cuenta_secundaria,
        ingreso_egreso: concepto[0]?.ingreso_egreso,
        activable: concepto[0]?.activable,
        genera_factura: concepto[0]?.genera_factura,
        genera_recibo: concepto[0]?.genera_recibo,
        id: id
    })
}
}, [concepto, id])
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
    if(form.ingreso_egreso === "I" && form.activable == 1){
      toast.info("Un ingreso no puede ser un gasto activable")
    }else{
      dispatch(updateConcepto(form))
    }
} 
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
            <h2>Actualizar {tipo === "I" ? "ingreso" : tipo === "E" ? "egreso" : ""}</h2>
            <form action="" enctype="multipart/form-data" className={styles.form} style={{
              gridTemplateColumns: "1fr 1fr"
            }}>
            <div className={styles.inputContainer}>
              <span>Cuenta contable</span>
              <select name="cuenta_contable"  value={form["cuenta_contable"]} 
              onChange={handleChange} id="">
                <option value={""} disabled selected>{"Seleccione un modelo"}</option>
                {
                  cuentasContables?.length && cuentasContables?.map(e => {
                    return <option key={e.Codigo} value={e.Codigo}>{e.Codigo} - {e.Nombre}</option>
                  })
                }
              </select>
            </div>
            <div className={styles.inputContainer}>
                <span>Concepto</span>
                <input type="text" name='nombre' value={form["nombre"]} 
              onChange={handleChange}/>
            </div>
            {
              tipo && tipo === "E" &&
            <div className={styles.inputContainer} style={{
              flexDirection: "row",
              alignItems: "anchor-center"
            }}>
              <span>Gasto activable</span>
              <input name='activable'
              checked={form["activable"] === 1} onChange={handleCheckChange} type="checkbox" />
            </div>
            }
            {
              tipo && tipo === "I" &&
            <div className={styles.inputContainer} style={{
              flexDirection: "row",
              alignItems: "anchor-center"
            }}>
              <span>Genera factura</span>
              <input name='genera_factura'
              checked={form["genera_factura"] === 1} onChange={handleCheckChange} type="checkbox" />
            </div>
            }
            {
              tipo && tipo === "I" &&
            <div className={styles.inputContainer} style={{
              flexDirection: "row",
              alignItems: "anchor-center"
            }}>
              <span>Genera recibo</span>
              <input name='genera_recibo'
              checked={form["genera_recibo"] === 1} onChange={handleCheckChange} type="checkbox" />
            </div>
            }
            </form>
            <button 
            className={styles.sendBtn} onClick={handleSubmit}
            disabled={!form["cuenta_contable"] || !form["nombre"]}>
              Enviar
            </button>
          </div>
</div>
  )
}

export default UpdateConcepto