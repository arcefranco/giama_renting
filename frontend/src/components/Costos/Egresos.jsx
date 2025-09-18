import React, {useEffect, useState, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { getCostosIngresosByIdVehiculo, getConceptosCostos, 
resetCostosVehiculo, reset_nro_recibo_ingreso } from '../../reducers/Costos/costosSlice.js';
import { postCostos_Ingresos, reset } from "../../reducers/Costos/egresosSlice.js"
import {getVehiculos, getVehiculosById, resetVehiculo} from '../../reducers/Vehiculos/vehiculosSlice'
import { getClientes } from '../../reducers/Clientes/clientesSlice.js';
import {getModelos, getProveedores, getFormasDeCobro} from '../../reducers/Generales/generalesSlice'
import { useParams } from 'react-router-dom';
import DataGrid, {Column, Scrolling, Summary, TotalItem} from "devextreme-react/data-grid"
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import styles from "./IngresosEgresos.module.css";
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import { renderEstadoVehiculo } from '../../utils/renderEstadoVehiculo';
import Select from 'react-select';
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';
import {resetIngreso } from '../../reducers/Recibos/recibosSlice.js';

const Egresos = () => {  

const { id } = useParams();
const gridRef = useRef(null);
const dispatch = useDispatch()
const {costos_ingresos_vehiculo, conceptos} = useSelector((state) => state.costosReducer)
const {isError, isSuccess, isLoading, message} = useSelector((state) => state.egresosReducer)
const {vehiculo, vehiculos} = useSelector((state) => state.vehiculosReducer)
const {username} = useSelector((state) => state.loginReducer)
const {modelos, proveedores, formasDeCobro} = useSelector((state) => state.generalesReducer)
const [form, setForm] = useState({
    id_vehiculo: id ? id : "",
    fecha: '',
    id_concepto: '',
    id_forma_cobro: '',
    neto_no_gravado: null,
    neto_21: null,
    neto_10: null,
    neto_27: null,
    importe_iva_21: null,
    importe_iva_10: null,
    importe_iva_27: null,
    tasa_IIBB_CABA: null,
    tasa_IIBB: null,
    tasa_IVA: null,
    importe_tasa_IIBB_CABA: null,
    importe_tasa_IIBB: null,
    importe_tasa_IVA: null,
    importe_total: null,
    importe_neto: null,
    importe_iva: null,
    importe_otros_impuestos: null,
    observacion: '',
    cuenta: '',
    ingreso_egreso: 'E',
    cta_cte_proveedores: 1,
    cuenta_secundaria: '',
    tipo_comprobante: '',
    numero_comprobante_1: '',
    numero_comprobante_2: '',
    cod_proveedor: '',
    usuario: username,
})
const [opcionesVehiculos, setOpcionesVehiculos] = useState([])
const [opcionesProveedores, setOpcionesProveedores] = useState([])
const [conceptosFiltrados, setConceptosFiltrados] = useState([])
const [totalNeto, setTotalNeto] = useState(0)
const [totalIVA, setTotalIVA] = useState(0);
const [totalPerc, setTotalPerc] = useState(0);

const [egresosFiltrados, setEgresosFiltrados] = useState([])
useEffect(() => {
  if (gridRef.current && costos_ingresos_vehiculo?.length > 0) {
    const pageCount = Math.ceil(costos_ingresos_vehiculo.length / 5);
    gridRef.current.instance.pageIndex(pageCount - 1); // ir a la última página
  }
}, [costos_ingresos_vehiculo]);

useEffect(() => {
dispatch(getConceptosCostos());
dispatch(getModelos());
dispatch(getVehiculos());
dispatch(getClientes());
dispatch(getFormasDeCobro());
dispatch(getProveedores());
locale("es");

return () => {
  dispatch(reset());
  dispatch(resetCostosVehiculo());
  dispatch(resetVehiculo());
  dispatch(resetIngreso());
  dispatch(reset_nro_recibo_ingreso());
};
}, [dispatch])

useEffect(() => { /**CARGA COSTOS DE VEHICULO EN URL */
    if (id) {
      // cargar datos del vehículo de la URL
      dispatch(getCostosIngresosByIdVehiculo({ id: id }));
      dispatch(getVehiculosById({ id: id }));
      setForm((f) => ({ ...f, id_vehiculo: id }));
    } else {
      // sin id en URL: limpiar lo específico del vehículo previo
      dispatch(resetVehiculo());
      dispatch(resetCostosVehiculo?.());
      setForm((f) => ({ ...f, id_vehiculo: "" }));
    }
}, [id, dispatch]);

useEffect(() => { /**OPCIONES DE VEHICULOS PARA EL SELECT */
  if(vehiculos?.length){
    setOpcionesVehiculos(vehiculos?.filter(v => {return !v.fecha_venta})?.map(e => {
    let modeloNombre = modelos?.find(m => m.id == e.modelo)?.nombre
    let dominio = e.dominio ? e.dominio : 
        e.dominio_provisorio ? e.dominio_provisorio : ""
      return {
        value: e.id,
        label: (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: "15px" }}>
            <span>{dominio} - {modeloNombre}</span>
            {renderEstadoVehiculo(e, "chico")}
          </div>
        )
        ,
        searchKey: `${dominio} ${modeloNombre}`.toLowerCase(),
      };
    }))
  }
}, [vehiculos, modelos])

useEffect(() => { /**OPCIONES DE PROVEEDORES PARA EL SELECT */
  if(proveedores?.length){
    setOpcionesProveedores(proveedores?.map(e => {
      return {
        value: e.Codigo,
        label: (
          <span>{e.RazonSocial}</span>
        ),
        searchKey: `${e.RazonSocial}`.toLowerCase(),
      };
    }))
  }
}, [proveedores])

useEffect(() => { /**OBTENGO COSTOS DEL VEHICULO DESDE EL SELECT */
  if(!id && form.id_vehiculo){
    dispatch(getCostosIngresosByIdVehiculo({id: form.id_vehiculo})),
    dispatch(getVehiculosById({id: form.id_vehiculo}))
  }
}, [form.id_vehiculo])


useEffect(() => { /**FILTRADO DE CONCEPTOS */
if(conceptos?.length){
  setConceptosFiltrados(conceptos.filter(e => e.ingreso_egreso === "E"))
}
}, [conceptos])

useEffect(() => { /**FILTRADO DE COSTOS EN DATAGRID */
if(costos_ingresos_vehiculo?.length){
    setEgresosFiltrados(costos_ingresos_vehiculo.filter(e => e.ingreso_egreso === "E"))
}

}, [costos_ingresos_vehiculo])

/* useEffect(() => { 
if( form.cta_cte_proveedores == 1 && form.tipo_comprobante == 3){
  setIVAInhabilitado(true)
  setForm({
    ...form,
    importe_total: form.importe_total - form.importe_iva,
    importe_iva: 0
  })
}else{
  setIVAInhabilitado(false)
}
}, [form.cta_cte_proveedores, form.tipo_comprobante]) */

/* useEffect(() => {
if(!form.importe_iva){
  setForm({
    ...form,
    importe_iva: 0,
    importe_neto: form.importe_total
  })
}
}, [form.importe_iva]) */

useEffect(() => {
setForm({
  ...form,
  importe_total: parseFloat(totalNeto + totalIVA + totalPerc).toFixed(2)
})
}, [totalNeto, totalIVA, totalPerc])

useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
    onSuccess: () => {
        if(id){
          setForm({
          id_vehiculo: id,
          fecha: '',
          id_forma_cobro: '',
          id_concepto: '',
          neto_no_gravado: null,
          neto_21: null,
          neto_10: null,
          neto_27: null,
          importe_iva_21: null,
          importe_iva_10: null,
          importe_iva_27: null,
          tasa_IIBB_CABA: null,
          tasa_IIBB: null,
          tasa_IVA: null,
          importe_tasa_IIBB_CABA: null,
          importe_tasa_IIBB: null,
          importe_tasa_IVA: null,
          importe_total: 0,
          importe_neto: 0,
          importe_iva: 0,
          importe_otros_impuestos: 0,
          observacion: '',
          cuenta: '',
          cuenta_secundaria: '',
          ingreso_egreso: 'E',
          cta_cte_proveedores: 1,
          cod_proveedor: '',
          tipo_comprobante: '',
          numero_comprobante_1: '',
          numero_comprobante_2: '',
          usuario: username
          })
        }else if (!id){
          setForm({
          id_vehiculo: form.id_vehiculo ? form.id_vehiculo : "",
          id_forma_cobro: '',
          fecha: '',
          id_concepto: '',
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
          cuenta_secundaria: '',
          ingreso_egreso: 'E',
          cta_cte_proveedores: 1,
          cod_proveedor: '',
          tipo_comprobante: '',
          numero_comprobante_1: '',
          numero_comprobante_2: '',
          usuario: username
          })
        }
    }
});

const handleActualizar = ( ) => {
  if(!id){
    dispatch(getCostosIngresosByIdVehiculo({id: form.id_vehiculo}))
  }else{
    dispatch(getCostosIngresosByIdVehiculo({id: id}))
  }
}
const handleChange = (e) => {
  const { name, value } = e.target;
if(value && name === "id_concepto"){
      setForm({
     ...form,
     [name]: value,
    "cuenta": conceptos?.find(e => e.id == value)?.cuenta_contable,
    "cuenta_secundaria": conceptos?.find(e => e.id == value)?.cuenta_secundaria,
    "ingreso_egreso": conceptos.find(e => e.id == value)?.ingreso_egreso,
    "id_forma_cobro": "",
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

const toNumber = (val) => {
  if (val === "" || val === null || val === undefined) return null;
  const n = parseFloat(val.toString().replace(",", "."));
  return isNaN(n) ? null : n;
};

const handleChangeNumbers = (e) => {
  const { name, value } = e.target;

  // siempre guardo el string que escribe el usuario
  let newForm = { ...form, [name]: value };

  // convertir a número solo cuando haga falta
  const neto_21 = toNumber(newForm.neto_21);
  const neto_10 = toNumber(newForm.neto_10);
  const neto_27 = toNumber(newForm.neto_27);
  const neto_no_gravado = toNumber(newForm.neto_no_gravado);

  // IVA calculado a partir del número (no del string)
  newForm.importe_iva_21 = neto_21 ? (neto_21 * 0.21).toFixed(2) : "";
  newForm.importe_iva_10 = neto_10 ? (neto_10 * 0.105).toFixed(2) : "";
  newForm.importe_iva_27 = neto_27 ? (neto_27 * 0.27).toFixed(2) : "";

  // Totales
  const totalNetoCalc =
    (neto_no_gravado || 0) +
    (neto_21 || 0) +
    (neto_10 || 0) +
    (neto_27 || 0);

  const totalIVACalc =
    (toNumber(newForm.importe_iva_21) || 0) +
    (toNumber(newForm.importe_iva_10) || 0) +
    (toNumber(newForm.importe_iva_27) || 0);

  setTotalNeto(totalNetoCalc);
  setTotalIVA(totalIVACalc);

  newForm.importe_neto = totalNetoCalc.toFixed(2);
  newForm.importe_iva = totalIVACalc.toFixed(2);

  // Tasas (mismo criterio: convertir al vuelo)
  const tasa_IIBB_CABA = toNumber(newForm.tasa_IIBB_CABA);
  const tasa_IIBB = toNumber(newForm.tasa_IIBB);
  const tasa_IVA = toNumber(newForm.tasa_IVA);

  newForm.importe_tasa_IIBB_CABA = tasa_IIBB_CABA
    ? ((tasa_IIBB_CABA / 100) * totalNetoCalc).toFixed(2)
    : "";

  newForm.importe_tasa_IIBB = tasa_IIBB
    ? ((tasa_IIBB / 100) * totalNetoCalc).toFixed(2)
    : "";

  newForm.importe_tasa_IVA = tasa_IVA
    ? ((tasa_IVA / 100) * totalNetoCalc).toFixed(2)
    : "";

  newForm.importe_otros_impuestos = (
    (toNumber(newForm.importe_tasa_IIBB_CABA) || 0) +
    (toNumber(newForm.importe_tasa_IIBB) || 0) +
    (toNumber(newForm.importe_tasa_IVA) || 0)
  ).toFixed(2);

  setTotalPerc(
    (toNumber(newForm.importe_tasa_IIBB_CABA) || 0) +
      (toNumber(newForm.importe_tasa_IIBB) || 0) +
      (toNumber(newForm.importe_tasa_IVA) || 0)
  );

  setForm(newForm);
};

const handleSubmit = () => {
  if(conceptos.find(e => e.id == form.id_concepto).ingreso_egreso == "I" && !form.id_cliente){
    toast.error("Si elige un ingreso debe seleccionar un cliente", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
  }else{
    dispatch(postCostos_Ingresos(form))
  }
}
const renderFecha = (data) => {
  let fechaSplit = data.value.split("-")
  return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
}
const renderConcepto = (data) => {
  const idConcepto = data.data.id_concepto
  return <span>{conceptos.find(e => e.id == idConcepto)?.nombre}</span>
}

const customStyles = {
  container: (provided) => ({
    ...provided,
    width: '22rem'
  })
};

const customStylesProveedores = {
  container: (provided) => ({
    ...provided,
    width: '15rem'
  })
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
    <h2> Egresos del vehículo</h2>
    {
      vehiculo?.length && modelos?.length ?
    <div>
    <h2 style={{display: "flex", alignItems: "anchor-center"}}> 
    {vehiculo?.length && vehiculo[0]?.dominio ? vehiculo[0]?.dominio : 
    vehiculo?.length &&  vehiculo[0]?.dominio_provisorio ? vehiculo[0]?.dominio_provisorio : ""}{" "}-{" "}
    {vehiculo && modelos && modelos?.find(e => e.id === vehiculo[0]["modelo"])?.nombre}{" "}-{" "}
    {vehiculo && renderEstadoVehiculo(vehiculo[0], "grande")}
      
      </h2>

    </div>
    :
    <h2>Seleccionar un vehículo</h2>

    }
        { !id && <div className={styles.inputContainer}>
          <span>Vehículo</span>
          <Select
            options={opcionesVehiculos}
            value={
              opcionesVehiculos?.find(
                (opt) => String(opt.value) === String(form.id_vehiculo)
                      ) || null
            }
            onChange={(option) => {
              setForm((prevForm) => ({
                ...prevForm,
                id_vehiculo: option?.value || "",
              }));
            }}
            placeholder="Seleccione un vehículo"
            filterOption={(option, inputValue) =>
            option.data.searchKey.includes(inputValue.toLowerCase())
            }
            styles={customStyles}
          />
        </div> 
        }
    <button onClick={handleActualizar} className={styles.refreshButton}>
    🔄 Actualizar
    </button>
      <DataGrid
        className={styles.dataGrid}
        dataSource={egresosFiltrados || []}
        showBorders={true}
        style={{fontFamily: "IBM"}}
        rowAlternationEnabled={true}
        allowColumnResizing={true}
        scrolling={true}
        height={300}
        
        columnAutoWidth={true}>
        <Scrolling mode="standard"/>
        <Column dataField="fecha" sortOrder="desc" cellRender={renderFecha} alignment="center" caption="Fecha"/>
        <Column dataField="id_concepto" sortOrder="desc" cellRender={renderConcepto} alignment="center" caption="Concepto"/>
        <Column dataField="comprobante" caption="Comprobante"/>
        <Column dataField="importe_neto" alignment="right" caption="Importe Neto"/>
        <Column dataField="importe_iva" alignment="right" caption="IVA"/>
        <Column dataField="importe_total" alignment="right" caption="Total"/>
        <Column dataField="observacion" caption="Observación"/>
         <Summary>
    <TotalItem
      column="importe_neto"
      summaryType="sum"
      displayFormat="{0}"
      alignment="right"
      valueFormat="#,##0.00"
      showInColumn="importe_neto"
      
    />
    <TotalItem
      column="importe_iva"
      summaryType="sum"
      alignment="right"
      displayFormat="{0}"
      valueFormat="#,##0.00"
      showInColumn="importe_iva"
    />
    <TotalItem
      column="importe_total"
      summaryType="sum"
      alignment="right"
      displayFormat="TOTAL: {0}"
      valueFormat="#,##0.00"
      showInColumn="importe_total"
      cssClass={styles.importeTotal}
    />
  </Summary>
      </DataGrid>
      <h2>Alta de egresos del vehículo</h2>
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
      {form.cta_cte_proveedores == 1 &&
      <div className={styles.inputContainer}>
        <span>Proveedores</span>
        <Select
        options={opcionesProveedores}
        value={
              opcionesProveedores?.find(
                (opt) => String(opt.value) === String(form.cod_proveedor)
                      ) || null
            }
            onChange={(option) => {
              setForm((prevForm) => ({
                ...prevForm,
                cod_proveedor: option?.value || "",
              }));
            }}
            placeholder="Seleccione un proveedor"
            filterOption={(option, inputValue) =>
            option.data.searchKey.includes(inputValue.toLowerCase())
            }
        styles={customStylesProveedores}
        />
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
        onChange={handleChange} />
      </div>

      <div className={styles.inputContainer}>
        <span>Nº Comprobante</span>
        <input type="number" name='numero_comprobante_2' value={form.numero_comprobante_2}
        onChange={handleChange}  />
      </div>
      <div className={styles.inputContainer}>
          <span>Neto no gravado</span>
          <input type="text" name='neto_no_gravado' value={form.neto_no_gravado} onChange={handleChangeNumbers}/>
      </div>
      <div>{/* DIV PARA ORDENAR */}</div>
      <div className={styles.inputContainer}>
          <span>Neto al 21%</span>
          <input type="text" name='neto_21' value={form.neto_21} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Neto al 10,5%</span>
          <input type="text" name='neto_10' value={form.neto_10} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Neto al 27%</span>
          <input type="text" name='neto_27' value={form.neto_27} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>IVA 21%</span>
          <input type="text" name='importe_iva_21' value={form.importe_iva_21} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>IVA 10,5%</span>
          <input type="text" name='importe_iva_10' value={form.importe_iva_10} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>IVA 27%</span>
          <input type="text" name='importe_iva_27' value={form.importe_iva_27} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Tasa percepción IIBB CABA</span>
          <input type="text" name='tasa_IIBB_CABA' value={form.tasa_IIBB_CABA} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Tasa percepción IIBB</span>
          <input type="text" name='tasa_IIBB' value={form.tasa_IIBB} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Tasa percepción IVA</span>
          <input type="text" name='tasa_IVA' value={form.tasa_IVA} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Importe percepción IIBB CABA</span>
          <input type="text" name='importe_tasa_IIBB_CABA' value={form.importe_tasa_IIBB_CABA} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Importe percepción IIBB</span>
          <input type="text" name='importe_tasa_IIBB' value={form.importe_tasa_IIBB} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Importe percepción IVA</span>
          <input type="text" name='importe_tasa_IVA' value={form.importe_tasa_IVA} onChange={handleChangeNumbers}/>
      </div>
      <div className={styles.inputContainer}>
          <span>Total</span>
          <input type="text" name='importe_total' value={form["importe_total"]} disabled
          onChange={handleChange}/>
      </div>
      <div className={styles.inputContainer}>
        <span>Forma de pago</span>
        <select name="id_forma_cobro" disabled={form.cta_cte_proveedores === 1 ? true : false}  value={form["id_forma_cobro"]} 
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
      disabled={!form["fecha"] || !form["id_concepto"] || !form["id_vehiculo"]}  
      >
        Enviar
      </button>

      </div>
    </div>
  )
}

export default Egresos