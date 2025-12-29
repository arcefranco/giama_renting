import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { getConceptosCostos,
  resetCostosVehiculo, reset_nro_recibo_ingreso
} from '../../reducers/Costos/costosSlice.js';
import {prorrateo, reset} from "../../reducers/Costos/costosSlice.js"
import { getVehiculos, resetVehiculo } from '../../reducers/Vehiculos/vehiculosSlice'
import { getClientes } from '../../reducers/Clientes/clientesSlice.js';
import { getModelos, getProveedores, getFormasDeCobro } from '../../reducers/Generales/generalesSlice'
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import styles from "./IngresosEgresos.module.css";
import { ClipLoader } from "react-spinners";
import { ToastContainer, toast } from 'react-toastify';
import Select from 'react-select';
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';
import { resetIngreso } from '../../reducers/Recibos/recibosSlice.js';


const Prorrateo = () => {

  const dispatch = useDispatch()
  const { conceptos, isError, isSuccess, isLoading, message  } = useSelector((state) => state.costosReducer)
  const { vehiculos } = useSelector((state) => state.vehiculosReducer)
  const { username } = useSelector((state) => state.loginReducer)
  const { modelos, proveedores, formasDeCobro } = useSelector((state) => state.generalesReducer)
  const [form, setForm] = useState({
    arrayVehiculos: [],
    fecha: '',
    id_forma_cobro: '',
    /**PARA MOSTRAR EN FORM (NETOS PARA CALCULAR TAMBIEN TOTAL C/NETO A MOVPROV)*/
    id_concepto: '',
    neto_no_gravado: null,
    neto_21: null,
    neto_10: null,
    neto_27: null,
    id_concepto_2: '',
    neto_no_gravado_2: null,
    neto_21_2: null,
    neto_10_2: null,
    neto_27_2: null,
    id_concepto_3: '',
    neto_no_gravado_3: null,
    neto_21_3: null,
    neto_10_3: null,
    neto_27_3: null,
    importe_iva_21: null,
    importe_iva_10: null,
    importe_iva_27: null,
    tasa_IIBB_CABA: null,
    tasa_IIBB: null,
    tasa_IVA: null,
    importe_tasa_IIBB_CABA: null,
    importe_tasa_IIBB: null,
    importe_tasa_IVA: null,
    /**PARA MOSTRAR EN FORM */
    importe_total: null,
    importe_neto: null,
    importe_iva: null,
    importe_otros_impuestos: null,
    /**MOVIMIENTOS CONTABLES Y COSTOS_INGRESOS */
    importe_neto_total_1: null,
    importe_neto_total_2: null,
    importe_neto_total_3: null,
    importe_iva_total_1: null,
    importe_iva_total_2: null,
    importe_iva_total_3: null,

    /**MOVIMIENTOS CONTABLES Y COSTOS_INGRESOS */
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
  const [opcionesProveedores, setOpcionesProveedores] = useState([])
  const [conceptosFiltrados, setConceptosFiltrados] = useState([])
  const [totalNeto, setTotalNeto] = useState(0)
  const [totalIVA, setTotalIVA] = useState(0);
  const [totalPerc, setTotalPerc] = useState(0);


  const [totalNeto_1, setTotalNeto_1] = useState(0)
  const [totalNeto_2, setTotalNeto_2] = useState(0)
  const [totalNeto_3, setTotalNeto_3] = useState(0)



  const [egresosFiltrados, setEgresosFiltrados] = useState([])


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

  useEffect(() => { /**OPCIONES DE PROVEEDORES PARA EL SELECT */
    if (proveedores?.length) {
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

  useEffect(() => { /**FILTRADO DE CONCEPTOS */
    if (conceptos?.length) {
      setConceptosFiltrados(conceptos.filter(e => e.ingreso_egreso === "E").map(e => {
        return {
          value: e.id,
          label: (
            <span>{e.nombre}</span>
          ),
          searchKey: `${e.nombre}`.toLowerCase(),
        };
      }))
    }
  }, [conceptos])

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

        setForm({
          arrayVehiculos: [],
          id_forma_cobro: '',
          fecha: '',
          id_concepto: '',
          neto_no_gravado: 0,
          neto_21: 0,
          neto_10: 0,
          neto_27: 0,
          id_concepto_2: '',
          neto_no_gravado_2: 0,
          neto_21_2: 0,
          neto_10_2: 0,
          neto_27_2: 0,
          id_concepto_3: '',
          neto_no_gravado_3: 0,
          neto_21_3: 0,
          neto_10_3: 0,
          neto_27_3: 0,
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
          importe_neto_total_1: null,
          importe_neto_total_2: null,
          importe_neto_total_3: null,
          importe_iva_total_1: null,
          importe_iva_total_2: null,
          importe_iva_total_3: null,
          
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
});
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
    const restantes = vehiculosFiltrados.filter(v => v.vehiculo_alquilado === 0 && !vehiculos.fecha_venta);
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
    if (value && name === "id_concepto") {
      setForm({
        ...form,
        [name]: value,
        "cuenta": conceptos?.find(e => e.id == value)?.cuenta_contable,
        "cuenta_secundaria": conceptos?.find(e => e.id == value)?.cuenta_secundaria,
        "ingreso_egreso": conceptos.find(e => e.id == value)?.ingreso_egreso,
        "id_forma_cobro": "",
      });
    }
    else if (value && name == "numero_comprobante_1") {
      let newValue = value;
      if (value.length > 5) newValue = value.slice(0, 5)
      setForm({
        ...form,
        [name]: newValue,
      });
    }
    else if (value && name == "numero_comprobante_2") {
      let newValue = value;
      if (value.length > 8) newValue = value.slice(0, 8)
      setForm({
        ...form,
        [name]: newValue,
      });
    }
    else if (value && name == "cod_proveedor") {
      setForm({
        ...form,
        [name]: value,
        tipo_comprobante: proveedores?.find(e => e.Codigo == value)?.TipoResponsable == 1 ? 1 : 3,
        importe_neto: 0,
        importe_iva: 0,
        importe_total: 0
      });
    }
    else if (value && name == "tipo_comprobante") {
      setForm({
        ...form,
        [name]: value,
        importe_neto: 0,
        importe_iva: 0,
        importe_total: 0

      });
    }
    else {
      setForm({
        ...form,
        [name]: value,
      });

    }
  };

  const toNumber = (val) => {
    if (val === "" || val === null || val === undefined) return null;
    const n = parseFloat(val.toString().replace(",", "."));
    return isNaN(n) ? 0 : n;
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

    const neto_21_2 = toNumber(newForm.neto_21_2)
    const neto_10_2 = toNumber(newForm.neto_10_2)
    const neto_27_2 = toNumber(newForm.neto_27_2)
    const neto_no_gravado_2 = toNumber(newForm.neto_no_gravado_2)

    const neto_21_3 = toNumber(newForm.neto_21_3)
    const neto_10_3 = toNumber(newForm.neto_10_3)
    const neto_27_3 = toNumber(newForm.neto_27_3)
    const neto_no_gravado_3 = toNumber(newForm.neto_no_gravado_3)


    // IVA calculado a partir del número (no del string)
    if (name === "neto_21" || name === "neto_10" || name === "neto_27"
      || name === "neto_21_2" || name === "neto_10_2" || name === "neto_27_2"
      || name === "neto_21_3" || name === "neto_10_3" || name === "neto_27_3"
    ) {
      let IVA21Fixed = neto_21 ? (neto_21 * 0.21).toFixed(2) : 0
      let IVA21_2Fixed = neto_21_2 ? (neto_21_2 * 0.21).toFixed(2) : 0
      let IVA21_3Fixed = neto_21_3 ? (neto_21_3 * 0.21).toFixed(2) : 0

      let IVA10Fixed = neto_10 ? (neto_10 * 0.105).toFixed(2) : 0
      let IVA10_2Fixed = neto_10_2 ? (neto_10_2 * 0.105).toFixed(2) : 0
      let IVA10_3Fixed = neto_10_3 ? (neto_10_3 * 0.105).toFixed(2) : 0

      let IVA27Fixed = neto_27 ? (neto_27 * 0.27).toFixed(2) : 0
      let IVA27_2Fixed = neto_27_2 ? (neto_27_2 * 0.27).toFixed(2) : 0
      let IVA27_3Fixed = neto_27_3 ? (neto_27_3 * 0.27).toFixed(2) : 0


      newForm.importe_iva_21 = (toNumber(IVA21Fixed) + toNumber(IVA21_2Fixed) + toNumber(IVA21_3Fixed)).toFixed(2);
      newForm.importe_iva_10 = (toNumber(IVA10Fixed) + toNumber(IVA10_2Fixed) + toNumber(IVA10_3Fixed)).toFixed(2);
      newForm.importe_iva_27 = (toNumber(IVA27Fixed) + toNumber(IVA27_2Fixed) + toNumber(IVA27_3Fixed)).toFixed(2);

      /**MOVIMIENTOS CONTABLES Y COSTOS_INGRESOS */
      newForm.importe_iva_total_1 = (toNumber(IVA21Fixed) + toNumber(IVA27Fixed) + toNumber(IVA10Fixed)).toFixed(2)
      newForm.importe_iva_total_2 = (toNumber(IVA21_2Fixed) + toNumber(IVA27_2Fixed) + toNumber(IVA10_2Fixed)).toFixed(2)
      newForm.importe_iva_total_3 = (toNumber(IVA21_3Fixed) + toNumber(IVA27_3Fixed) + toNumber(IVA10_3Fixed)).toFixed(2)
      /**MOVIMIENTOS CONTABLES Y COSTOS_INGRESOS*/

      newForm.tasa_IIBB = ""
      newForm.tasa_IIBB_CABA = ""
      newForm.tasa_IVA = ""
      newForm.importe_tasa_IIBB = ""
      newForm.importe_tasa_IIBB_CABA = ""
      newForm.importe_tasa_IVA = ""
    }


    // Totales
    const totalNetoCalc =
      (neto_no_gravado || 0) +
      (neto_21 || 0) +
      (neto_10 || 0) +
      (neto_27 || 0) +
      (neto_no_gravado_2 || 0) +
      (neto_21_2 || 0) +
      (neto_10_2 || 0) +
      (neto_27_2 || 0) +
      (neto_no_gravado_3 || 0) +
      (neto_21_3 || 0) +
      (neto_10_3 || 0) +
      (neto_27_3 || 0);

    const totalNetoGravado = /**PARA CALCULAR SOBRE TASA */
      (neto_21 || 0) +
      (neto_10 || 0) +
      (neto_27 || 0) +
      (neto_21_2 || 0) +
      (neto_10_2 || 0) +
      (neto_27_2 || 0) +
      (neto_21_3 || 0) +
      (neto_10_3 || 0) +
      (neto_27_3 || 0);
    const totalNeto1Calc = (neto_no_gravado || 0) +
      (neto_21 || 0) +
      (neto_10 || 0) +
      (neto_27 || 0);

    const totalNeto2Calc = (neto_no_gravado_2 || 0) +
      (neto_21_2 || 0) +
      (neto_10_2 || 0) +
      (neto_27_2 || 0);


    const totalNeto3Calc = (neto_no_gravado_3 || 0) +
      (neto_21_3 || 0) +
      (neto_10_3 || 0) +
      (neto_27_3 || 0);



    const totalIVACalc =
      (toNumber(newForm.importe_iva_21) || 0) +
      (toNumber(newForm.importe_iva_10) || 0) +
      (toNumber(newForm.importe_iva_27) || 0);

    setTotalNeto(totalNetoCalc);
    setTotalIVA(totalIVACalc);

    setTotalNeto_1(totalNeto1Calc);
    setTotalNeto_2(totalNeto2Calc);
    setTotalNeto_3(totalNeto3Calc);

    newForm.importe_neto = totalNetoCalc.toFixed(2);
    newForm.importe_iva = totalIVACalc.toFixed(2);

    /**MOVIMIENTOS CONTABLES  Y COSTOS_INGRESOS*/
    newForm.importe_neto_total_1 = totalNeto1Calc.toFixed(2);
    newForm.importe_neto_total_2 = totalNeto2Calc.toFixed(2);
    newForm.importe_neto_total_3 = totalNeto3Calc.toFixed(2);
    /**MOVIMIENTOS CONTABLES  Y COSTOS_INGRESOS*/

    // Tasas (mismo criterio: convertir al vuelo)
    const tasa_IIBB_CABA = toNumber(newForm.tasa_IIBB_CABA);
    const tasa_IIBB = toNumber(newForm.tasa_IIBB);
    const tasa_IVA = toNumber(newForm.tasa_IVA);


    if (name === "tasa_IIBB_CABA" || name === "tasa_IIBB" || name === "tasa_IVA") {
      let importe_tasa_IIBB_CABA = tasa_IIBB_CABA
        ? ((tasa_IIBB_CABA / 100) * totalNetoGravado).toFixed(2)
        : "";
      let importe_tasa_IIBB = tasa_IIBB
        ? ((tasa_IIBB / 100) * totalNetoGravado).toFixed(2)
        : "";
      let importe_tasa_IVA = tasa_IVA
        ? ((tasa_IVA / 100) * totalNetoGravado).toFixed(2)
        : "";

      newForm.importe_tasa_IIBB_CABA = importe_tasa_IIBB_CABA
      newForm.importe_tasa_IIBB = importe_tasa_IIBB
      newForm.importe_tasa_IVA = importe_tasa_IVA

    }

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

      dispatch(prorrateo(form))
    
  }

  const customStylesProveedores = {
    container: (provided) => ({
      ...provided,
      width: '10rem',
      fontSize: "10px"
    })
  };
  return (
    <div className={styles.container}>
      <ToastContainer />
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
                style={{ alignSelf: "start" }}
                onChange={(e) => toggleSeleccionColumna(col, e.target.checked)}
                checked={todasSeleccionadas(col)}
              />
              <span style={{ color: "#800020" }}>{
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
                    {vehiculo.dominio || vehiculo.dominio_provisorio || "sin dominio"} - {modelos.find(e => e.id == vehiculo.modelo)?.nombre}
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
          <div className={styles.container6}>

            <div className={styles.inputContainer}>
              <span>Fecha</span>
              <input type="date" name='fecha' value={form["fecha"]}
                onChange={handleChange} />
            </div>
            <div className={styles.inputContainer} style={{ flexDirection: "row", width: "9rem", height: "3rem" }}>
              <label style={{ fontSize: "12px" }}>Cuenta corriente proveedores</label>
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
              <div className={styles.inputContainerProv}>
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
                      tipo_comprobante: proveedores?.find(e => e.Codigo == option?.value)?.TipoResponsable == 1 ? 1 : 3,
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
              <select name="tipo_comprobante" style={{ width: "130%" }} value={form["tipo_comprobante"]}
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
                onChange={handleChange} />
            </div>

          </div>
          <div className={styles.container6}>
            <div className={styles.inputContainer}>
              <span>Concepto</span>
              <Select
                options={conceptosFiltrados}
                value={
                  conceptosFiltrados?.find(
                    (opt) => String(opt.value) === String(form.id_concepto)
                  ) || null
                }
                onChange={(option) => {
                  setForm((prevForm) => ({
                    ...prevForm,
                    id_concepto: option?.value || "",
                  }));
                }}
                placeholder="Seleccione un concepto"
                filterOption={(option, inputValue) =>
                  option.data.searchKey.includes(inputValue.toLowerCase())
                }
                styles={customStylesProveedores}
              />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto no gravado</span>
              <input type="text" name='neto_no_gravado' value={form.neto_no_gravado} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto al 21%</span>
              <input type="text" name='neto_21' value={form.neto_21} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto al 10,5%</span>
              <input type="text" name='neto_10' value={form.neto_10} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto al 27%</span>
              <input type="text" name='neto_27' value={form.neto_27} onChange={handleChangeNumbers} />
            </div>
            <div></div>

          </div>

          <div className={styles.container6}>
            <div className={styles.inputContainer}>
              <span>Concepto</span>
              <Select
                options={conceptosFiltrados}
                value={
                  conceptosFiltrados?.find(
                    (opt) => String(opt.value) === String(form.id_concepto_2)
                  ) || null
                }
                onChange={(option) => {
                  setForm((prevForm) => ({
                    ...prevForm,
                    id_concepto_2: option?.value || "",
                  }));
                }}
                placeholder="Seleccione un concepto"
                filterOption={(option, inputValue) =>
                  option.data.searchKey.includes(inputValue.toLowerCase())
                }
                styles={customStylesProveedores}
              />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto no gravado</span>
              <input type="text" name='neto_no_gravado_2' value={form.neto_no_gravado_2} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto al 21%</span>
              <input type="text" name='neto_21_2' value={form.neto_21_2} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto al 10,5%</span>
              <input type="text" name='neto_10_2' value={form.neto_10_2} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto al 27%</span>
              <input type="text" name='neto_27_2' value={form.neto_27_2} onChange={handleChangeNumbers} />
            </div>
            <div></div>

          </div>

          <div className={styles.container6}>
            <div className={styles.inputContainer}>
              <span>Concepto</span>
              <Select
                options={conceptosFiltrados}
                value={
                  conceptosFiltrados?.find(
                    (opt) => String(opt.value) === String(form.id_concepto_3)
                  ) || null
                }
                onChange={(option) => {
                  setForm((prevForm) => ({
                    ...prevForm,
                    id_concepto_3: option?.value || "",
                  }));
                }}
                placeholder="Seleccione un concepto"
                filterOption={(option, inputValue) =>
                  option.data.searchKey.includes(inputValue.toLowerCase())
                }
                styles={customStylesProveedores}
              />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto no gravado</span>
              <input type="text" name='neto_no_gravado_3' value={form.neto_no_gravado_3} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto al 21%</span>
              <input type="text" name='neto_21_3' value={form.neto_21_3} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto al 10,5%</span>
              <input type="text" name='neto_10_3' value={form.neto_10_3} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Neto al 27%</span>
              <input type="text" name='neto_27_3' value={form.neto_27_3} onChange={handleChangeNumbers} />
            </div>
            <div></div>

          </div>
          {/* FIN CONCEPTOS */}



          <div className={styles.container3}>
            <div className={styles.inputContainer}>
              <span>IVA 21%</span>
              <input type="text" name='importe_iva_21' value={form.importe_iva_21} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>IVA 10,5%</span>
              <input type="text" name='importe_iva_10' value={form.importe_iva_10} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>IVA 27%</span>
              <input type="text" name='importe_iva_27' value={form.importe_iva_27} onChange={handleChangeNumbers} />
            </div>
            <div></div>
            <div></div>
            <div></div>
          </div>


          <div className={styles.container3}>
            <div className={styles.inputContainer}>
              <span>Tasa percepción IIBB CABA</span>
              <input type="text" name='tasa_IIBB_CABA' value={form.tasa_IIBB_CABA} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Tasa percepción IIBB</span>
              <input type="text" name='tasa_IIBB' value={form.tasa_IIBB} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Tasa percepción IVA</span>
              <input type="text" name='tasa_IVA' value={form.tasa_IVA} onChange={handleChangeNumbers} />
            </div>
            <div></div>
            <div></div>
            <div></div>
            <div className={styles.inputContainer}>
              <span>Importe percepción IIBB CABA</span>
              <input type="text" name='importe_tasa_IIBB_CABA' value={form.importe_tasa_IIBB_CABA} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Importe percepción IIBB</span>
              <input type="text" name='importe_tasa_IIBB' value={form.importe_tasa_IIBB} onChange={handleChangeNumbers} />
            </div>
            <div className={styles.inputContainer}>
              <span>Importe percepción IVA</span>
              <input type="text" name='importe_tasa_IVA' value={form.importe_tasa_IVA} onChange={handleChangeNumbers} />
            </div>
          </div>



          <div className={styles.container3}>
            <div className={styles.inputContainer}>
              <span>Total</span>
              <input type="text" name='importe_total' value={form["importe_total"]} disabled
                onChange={handleChange} />
            </div>
            <div className={styles.inputContainer}>
              <span>Forma de pago</span>
              <select name="id_forma_cobro" disabled={form.cta_cte_proveedores === 1 ? true : false} value={form["id_forma_cobro"]}
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
                onChange={handleChange} />
            </div>
            <div></div>
            <div></div>
            <div></div>
          </div>

        </form>
        <button
          className={styles.sendBtn}
          onClick={handleSubmit}
          disabled={!form["fecha"] || !form["id_concepto"] ? true : false}
        >
          Enviar
        </button>

      </div>
    </div>
  )
}

export default Prorrateo