import React, {useEffect, useState} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { getVehiculos } from '../../reducers/Vehiculos/vehiculosSlice';
import { reset, prorrateoIE, getConceptosCostos } from '../../reducers/Costos/costosSlice'
import {getFormasDeCobro} from "../../reducers/Alquileres/alquileresSlice.js"
import {getModelos, getProveedores} from '../../reducers/Generales/generalesSlice'
import { ToastContainer } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import styles from './ProrrateoIE.module.css'
import { useToastFeedback } from '../../customHooks/useToastFeedback';

const ProrrateoIE = () => {
const dispatch = useDispatch();
useEffect(() => {
    Promise.all([
        dispatch(getVehiculos()),
        dispatch(getConceptosCostos()),
        dispatch(getModelos()),
        dispatch(getFormasDeCobro()),
        dispatch(getProveedores())
    ])
    
}, [])
const {username} = useSelector((state) => state.loginReducer)
const [form, setForm] = useState({
    arrayVehiculos: [],
    fecha: '',
    id_forma_cobro: '',
    id_concepto: '',
    comprobante: '',
    neto_no_gravado: 0,
    neto_21: 0,
    neto_10: 0,
    neto_27: 0,
    importe_iva_21: 0,
    importe_iva_10: 0,
    importe_iva_27: 0,
    tasa_IIBB_CABA: 0,
    tasa_IIBB: 0,
    tasa_IVA: 0,
    importe_tasa_IIBB_CABA: 0,
    importe_tasa_IIBB: 0,
    importe_tasa_IVA: 0,
    importe_total: 0,
    importe_neto: 0,
    importe_iva: 0,
    importe_otros_impuestos: 0,
    observacion: '',
    cuenta: '',
    cta_cte_proveedores: '',
    cod_proveedor: '',
    tipo_comprobante: '',
    numero_comprobante_1: '',
    numero_comprobante_2: '',
    usuario: username
})
const { vehiculos } = useSelector((state) => state.vehiculosReducer)
const {modelos, proveedores} = useSelector((state) => state.generalesReducer)
const {isError, isSuccess, isLoading, message, conceptos} = useSelector((state) => state.costosReducer)
const {formasDeCobro} = useSelector((state) => state.alquileresReducer)
const [conceptosFiltrados, setConceptosFiltrados] = useState(null)
const [totalNeto, setTotalNeto] = useState(0)
const [totalIVA, setTotalIVA] = useState(0);
const handleSubmit = () => {
  dispatch(prorrateoIE(form))
}
useToastFeedback({
  isError,
  isSuccess,
  message,
  resetAction: reset,
  onSuccess: () => {
    setForm({
    arrayVehiculos: [],
    fecha: '',
    id_forma_cobro: '',
    id_concepto: '',
    comprobante: '',
    neto_no_gravado: 0,
    neto_21: 0,
    neto_10: 0,
    neto_27: 0,
    importe_iva_21: 0,
    importe_iva_10: 0,
    importe_iva_27: 0,
    tasa_IIBB_CABA: 0,
    tasa_IIBB: 0,
    tasa_IVA: 0,
    importe_tasa_IIBB_CABA: 0,
    importe_tasa_IIBB: 0,
    importe_tasa_IVA: 0,
    importe_total: 0,
    importe_neto: 0,
    importe_iva: 0,
    importe_otros_impuestos: 0,
    observacion: '',
    cuenta: '',
    cta_cte_proveedores: '',
    cod_proveedor: '',
    tipo_comprobante: '',
    numero_comprobante_1: '',
    numero_comprobante_2: '',
    usuario: username
    })
  }
})

useEffect(() => {
  if(conceptos.length){
    setConceptosFiltrados(conceptos.filter(e => e.ingreso_egreso !== "I"))
  }
}, [conceptos])

const [seleccionados, setSeleccionados] = useState([]); // IDs
useEffect(() => {
setForm({
    ...form,
    "arrayVehiculos": seleccionados
})
}, [seleccionados])
const [busquedaGeneral, setBusquedaGeneral] = useState('');
const [busquedaColumna, setBusquedaColumna] = useState({
  restantes: '', alquilados: '', vendidos: ''
});
const clasificarVehiculos = (vehiculos) => {
  const vehiculosFiltrados = vehiculos?.filter(v => //FILTRO GENERAL
  v["dominio"]?.toLowerCase().includes(busquedaGeneral.toLowerCase()) ||
/*   v["id"]?.toString().includes(busquedaGeneral) || DOMINIO PROVISORIO PROX */
  modelos.find(e => e.id === v["modelo"])?.nombre.toLowerCase().includes(busquedaGeneral.toLowerCase()) 
);
  const restantes =  vehiculosFiltrados.filter(v => v.vehiculo_alquilado === 0 && !vehiculos.fecha_venta);
  const alquilados = vehiculosFiltrados.filter(v => v.vehiculo_alquilado === 1);
  const vendidos = vehiculosFiltrados.filter(v => v.fecha_venta);
  return { restantes, alquilados, vendidos };
};
const ordenarPorDominio = (a, b) => {
  if (a.dominio < b.dominio) {
    return -1; // a viene antes que b
  }
  if (a.dominio > b.dominio) {
    return 1; // a viene después que b
  }
  return 0; // a y b son iguales
};
const categorias = clasificarVehiculos(vehiculos);
const filtrarVehiculos = (vehiculos, filtro) => {
  return vehiculos.sort(ordenarPorDominio).filter((v) =>
  /* PROX DOMINIO PROVISORIO ${v.id} -  */  
  `${v.dominio || v.dominio_provisorio || ''} - ${v.modelo}`.toLowerCase().includes(filtro.toLowerCase())
  );
};
const toggleSeleccion = (id) => {
  setSeleccionados((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id] 
//Si el id ya estaba en la lista lo saca y si no estaba lo agrega
  );
};

const toggleSeleccionColumna = (col, checked) => {
  const ids = filtrarVehiculos(categorias[col], busquedaColumna[col]).map((v) => v.id);
  setSeleccionados((prev) =>
    checked 
    ? Array.from(new Set([...prev, ...ids])) // agrega sin duplicar
    : prev.filter((id) => !ids.includes(id)) // quita los que están en esta columna filtrada
  );
};

const toggleSeleccionTotal = (checked) => {
  const todosIds = Object.values(categorias)
    .flat()
    .filter(v => filtrarVehiculos([v], busquedaGeneral).length > 0)
    .map((v) => v.id);
  setSeleccionados(checked ? todosIds : []);
};

const todasSeleccionadas = (col) => {
  const ids = filtrarVehiculos(categorias[col], busquedaColumna[col]).map((v) => v.id);
  return ids.length > 0 && ids.every((id) => seleccionados.includes(id));
};

const todosSeleccionados = () => {
  const todos = Object.values(categorias).flat().map(v => v.id);
  return todos.every((id) => seleccionados.includes(id));
};

const handleChange = (e) => {
  const { name, value } = e.target;
  if(value && name === "id_concepto"){
      setForm({
     ...form,
     [name]: value,
     "cuenta": conceptos.find(e => e.id == value)?.cuenta_contable,
   }); 
  }
  else if(value && name == "numero_comprobante_1"){
    let newValue = value;
    if (value.length > 5) newValue = value.slice(0, 5)
      setForm({
     ...form,
     [name]: newValue,
   }); 
  }
  else if(value && name == "numero_comprobante_2"){
    let newValue = value;
    if (value.length > 8) newValue = value.slice(0, 8)
      setForm({
     ...form,
     [name]: newValue,
   }); 
  }
  else if(value && name == "cod_proveedor"){
    setForm({
     ...form,
     [name]: value,
     tipo_comprobante: proveedores?.find(e => e.Codigo == value)?.TipoResponsable == 1 ? 1 : 3,
      importe_neto: 0,
     importe_iva: 0,
     importe_total: 0
   }); 
  }
  else if(value && name == "tipo_comprobante"){
      setForm({
     ...form,
     [name]: value,
     importe_neto: 0,
     importe_iva: 0,
     importe_total: 0
     
   }); 
  }
  else{
    setForm({
     ...form,
     [name]: value,
   }); 

  }
};

const handleChangeNumbers = (e) => {
  const { name, value, type } = e.target;
  const parsedValue = type === "number" && value !== "" ? parseFloat(value) : value;

  let newForm = { ...form, [name]: parsedValue };

  // Netos e IVA
  if (name === "neto_no_gravado") {
    newForm.neto_no_gravado = parsedValue;
  }

  if (name === "neto_21") {
    newForm.neto_21 = parsedValue;
    newForm.importe_iva_21 = parseFloat((parsedValue * 0.21).toFixed(2));
  }

  if (name === "neto_10") {
    newForm.neto_10 = parsedValue;
    newForm.importe_iva_10 = parseFloat((parsedValue * 0.105).toFixed(2));
  }

  if (name === "neto_27") {
    newForm.neto_27 = parsedValue;
    newForm.importe_iva_27 = parseFloat((parsedValue * 0.27).toFixed(2));
  }

  // Recalcular totalNeto
const totalNetoCalc =
  (newForm.neto_no_gravado || 0) +
  (newForm.neto_21 || 0) +
  (newForm.neto_10 || 0) +
  (newForm.neto_27 || 0);

// Calcular totalIVA con los valores NUEVOS
const totalIVACalc =
  (newForm.importe_iva_21 || 0) +
  (newForm.importe_iva_10 || 0) +
  (newForm.importe_iva_27 || 0);

// Guardar en estados locales
setTotalNeto(totalNetoCalc);
setTotalIVA(totalIVACalc);
newForm.importe_neto = parseFloat(totalNetoCalc.toFixed(2));
newForm.importe_iva = parseFloat(totalIVACalc.toFixed(2));

  // Tasas → importes
  if (name === "tasa_IIBB_CABA") {
    newForm.tasa_IIBB_CABA = parsedValue;
    newForm.importe_tasa_IIBB_CABA = parseFloat(((parsedValue / 100) * totalNeto).toFixed(2));
  }

  if (name === "tasa_IIBB") {
    newForm.tasa_IIBB = parsedValue;
    newForm.importe_tasa_IIBB = parseFloat(((parsedValue / 100) * totalNeto).toFixed(2));
  }

  if (name === "tasa_IVA") {
    newForm.tasa_IVA = parsedValue;
    newForm.importe_tasa_IVA = parseFloat(((parsedValue / 100) * totalNeto).toFixed(2));
  }

  // Otros impuestos = suma de tasas
newForm.importe_otros_impuestos = parseFloat(
  (
    (newForm.importe_tasa_IIBB_CABA || 0) +
    (newForm.importe_tasa_IIBB || 0) +
    (newForm.importe_tasa_IVA || 0)
  ).toFixed(2)
);

  // Recalcular importe_total
  const importeTotal =
    totalNeto +
    (newForm.importe_iva_21 || 0) +
    (newForm.importe_iva_10 || 0) +
    (newForm.importe_iva_27 || 0) +
    newForm.importe_otros_impuestos;

  newForm.importe_total = parseFloat(importeTotal.toFixed(2));

  // Guardar en el estado
  setForm(newForm);
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
        <h2>Prorrateo Egresos</h2>
<div className={styles.generalControls}>
  <div>
  <input
    type="checkbox"
    onChange={(e) => toggleSeleccionTotal(e.target.checked)}
    checked={todosSeleccionados()}
  />
  <span>Seleccionar todos</span>
  </div>
  <input
    type="text"
    placeholder="Buscar"
    value={busquedaGeneral}
    onChange={(e) => setBusquedaGeneral(e.target.value)}
  />
</div>
<div className={styles.gridContainer}>
  {['restantes', 'alquilados', 'vendidos'].map(col => (
    <div key={col} className={styles.column}>
      <div className={styles.columnHeader}>
        <input
          type="checkbox"
          style={{alignSelf: "start"}}
          onChange={(e) => toggleSeleccionColumna(col, e.target.checked)}
          checked={todasSeleccionadas(col)}
        />
        <span style={{color: "#800020"}}>{
        col == "restantes" && "Restantes" ||
        col == "alquilados" && "Alquilados" ||
        col == "vendidos" && "Vendidos" 
        }</span>
        <input
          type="text"
          placeholder="Buscar..."
          value={busquedaColumna[col]}
          onChange={(e) => setBusquedaColumna({ ...busquedaColumna, [col]: e.target.value })}
        />
      </div>
      <div className={styles.scrollableList}>
        {filtrarVehiculos(categorias[col], busquedaColumna[col]).map((vehiculo) => (
          <div key={vehiculo.id} className={styles.vehiculoItem}>
            <input
              type="checkbox"
              checked={seleccionados.includes(vehiculo.id)}
              onChange={() => toggleSeleccion(vehiculo.id)}
            />
            <span>
            {vehiculo.dominio || vehiculo.dominio_provisorio ||"sin dominio"} - {modelos.find(e=> e.id == vehiculo.modelo)?.nombre}
            </span>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
<h4>Vehiculos seleccionados: {form["arrayVehiculos"]?.length}</h4>
              <div className={styles.formContainer}>
              <form action="" enctype="multipart/form-data" className={styles.form}>
              <div className={styles.inputContainer}>
                  <span>Fecha</span>
                  <input type="date" name='fecha' value={form["fecha"]} 
                onChange={handleChange}/>
              </div>
              <div className={styles.inputContainer}>
                <span>Concepto</span>
                <select name="id_concepto" style={{width: "130%"}}  value={form["id_concepto"]} 
                onChange={handleChange} id="">
                  <option value={""} disabled selected>{"Seleccione un concepto"}</option>
                  {
                    conceptosFiltrados?.length && conceptosFiltrados?.map(e => {
                    return <option key={e.id} value={e.id}>{e.id} - {e.nombre}</option>
                    })
                  }
                </select>
              </div>
              <div className={styles.inputContainer} style={{flexDirection: "row", width: "9rem", height: "3rem"}}>
              <label style={{fontSize: "15px"}}>Cuenta corriente proveedores</label>
              <input
                type="checkbox"
                checked={form.cta_cte_proveedores}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cta_cte_proveedores: e.target.checked ? 1 : 0,
                  })
                }
                />
              </div>
               {
              form.cta_cte_proveedores == 1 &&
              <div className={styles.inputContainer}>
                <span>Proveedores</span>
                <select name="cod_proveedor" style={{width: "130%"}}  value={form["cod_proveedor"]} 
                onChange={handleChange} id="">
                  <option value={""} disabled selected>{"Seleccione un proveedor"}</option>
                  {
                    proveedores?.length && proveedores?.map(e => {
                    return <option key={e.Codigo} value={e.Codigo}>{e.RazonSocial}</option>
                    })
                  }
                </select>
              </div>
              }
              <div className={styles.inputContainer}>
              <span>Tipo comprobante</span>
              <select name="tipo_comprobante" style={{width: "130%"}}  value={form["tipo_comprobante"]} 
              onChange={handleChange} id="">
                <option value={0}></option>
                <option value={1}>FA</option>
                <option value={3}>FC</option>
              </select>
              </div>
              <div className={styles.inputContainer}>
                <span>Punto de venta</span>
                <input type="number" name='numero_comprobante_1' value={form.numero_comprobante_1}
                onChange={handleChange} max="99999" />
              </div>
              <div className={styles.inputContainer}>
                <span>Nº Comprobante</span>
                <input type="number" name='numero_comprobante_2' value={form.numero_comprobante_2}
                onChange={handleChange} max="99999999" />
              </div>
              <div className={styles.inputContainer}>
                  <span>Neto no gravado</span>
                  <input type="number" name='neto_no_gravado' value={form.neto_no_gravado} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Neto al 21%</span>
                  <input type="number" name='neto_21' value={form.neto_21} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>IVA 21%</span>
                  <input type="number" name='importe_iva_21' value={form.importe_iva_21} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Neto al 10,5%</span>
                  <input type="number" name='neto_10' value={form.neto_10} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>IVA 10,5%</span>
                  <input type="number" name='importe_iva_10' value={form.importe_iva_10} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Neto al 27%</span>
                  <input type="number" name='neto_27' value={form.neto_27} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>IVA 27%</span>
                  <input type="number" name='importe_iva_27' value={form.importe_iva_27} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Tasa percepción IIBB CABA</span>
                  <input type="number" name='tasa_IIBB_CABA' value={form.tasa_IIBB_CABA} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Tasa percepción IIBB</span>
                  <input type="number" name='tasa_IIBB' value={form.tasa_IIBB} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Tasa percepción IVA</span>
                  <input type="number" name='tasa_IVA' value={form.tasa_IVA} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Importe percepción IIBB CABA</span>
                  <input type="number" name='importe_tasa_IIBB_CABA' value={form.importe_tasa_IIBB_CABA} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Importe percepción IIBB</span>
                  <input type="number" name='importe_tasa_IIBB' value={form.importe_tasa_IIBB} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Importe percepción IVA</span>
                  <input type="number" name='importe_tasa_IVA' value={form.importe_tasa_IVA} onChange={handleChangeNumbers}/>
              </div>
              <div className={styles.inputContainer}>
                  <span>Total</span>
                  <input type="number" name='importe_total' value={form["importe_total"]} disabled
                  onChange={handleChange}/>
              </div>
              <div className={styles.inputContainer}>
                <span>Forma de pago</span>
                <select name="id_forma_cobro" disabled={form.cta_cte_proveedores === 1 ? true : false}
                  value={form["id_forma_cobro"]} 
                onChange={handleChange} id="">
                  <option value={""} disabled selected>{"Seleccione una opción"}</option>
                  {
                    formasDeCobro?.length && formasDeCobro?.map(e => {
                      return <option key={e.id} value={e.id}>{e.nombre}</option>
                    })
                  }
                </select>
              </div>
              <div className={styles.inputContainer}>
                  <span>Observacion</span>
                  <textarea type="text" name='observacion' value={form["observacion"]} 
                onChange={handleChange}/>
              </div>

              </form>
              <button 
              className={styles.sendBtn} 
              onClick={handleSubmit}
              disabled={!form["fecha"] || !form["id_concepto"]}  
              >
                Enviar
              </button>
        
              </div>
    </div>
  )
}

export default ProrrateoIE