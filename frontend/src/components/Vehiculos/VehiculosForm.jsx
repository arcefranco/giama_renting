import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styles from './VehiculosForm.module.css'
import {
  getModelos, getSucursales, getPreciosModelos,
  getParametroAMRT, getPlanCuentas, getProveedoresVehiculo
} from '../../reducers/Generales/generalesSlice'
import { postVehiculo, reset } from '../../reducers/Vehiculos/vehiculosSlice'
import { ToastContainer } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import { useToastFeedback } from '../../customHooks/useToastFeedback'
import Swal from "sweetalert2"
const VehiculosForm = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    Promise.all([
      dispatch(getModelos()),
      dispatch(getSucursales()),
      dispatch(getPreciosModelos()),
      dispatch(getParametroAMRT()),
      dispatch(getPlanCuentas()),
      dispatch(getProveedoresVehiculo())
    ])
  }, [])

  const { username } = useSelector((state) => state.loginReducer)

  const [form, setFormData] = useState({
    modelo: '',
    dominio: '',
    dominio_provisorio: '',
    fecha_inicio_amortizacion: '',
    nro_chasis: '',
    nro_motor: '',
    kilometros: '',
    fecha_medicion_km: '',
    proveedor_gps: '',
    nro_serie_gps: '',
    dispositivo: '',
    meses_amortizacion: '',
    color: '',
    sucursal: '',
    ubicacion: '',
    numero_comprobante_1: '',
    numero_comprobante_2: '',
    cuenta_contable: '',
    cuenta_secundaria: '',
    proveedor_vehiculo: '',
    observaciones: '',
    fecha_factura: '',
    usuario: username,
    importe_neto: '',
    importe_iva: '',
    tasa_IIBB_CABA: '',
    tasa_IIBB: '',
    tasa_IVA: '',
    importe_tasa_IIBB_CABA: '',
    importe_tasa_IIBB: '',
    importe_tasa_IVA: '',
    importe_total: '',

  })

  const { modelos, sucursales, preciosModelos,
    AMRT, plan_cuentas, proveedores_vehiculo } = useSelector((state) => state.generalesReducer)
  const { isError, isSuccess, isLoading, message } = useSelector((state) => state.vehiculosReducer)
  const [cuentasFiltradas, setCuentasFiltradas] = useState([])
  const [imagenes, setImagenes] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    fileInputRef.current.click();
  };
  const eliminarImagen = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
    onSuccess: () => {
      setFormData({
        modelo: '',
        dominio: '',
        fecha_inicio_amortizacion: '',
        nro_chasis: '',
        nro_motor: '',
        kilometros: '',
        fecha_medicion_km: '',
        proveedor_gps: '',
        nro_serie_gps: '',
        dispositivo: '',
        meses_amortizacion: '',
        color: '',
        sucursal: '',
        ubicacion: '',
        numero_comprobante_1: '',
        numero_comprobante_2: '',
        cuenta_contable: '',
        cuenta_secundaria: '',
        proveedor_vehiculo: '',
        fecha_factura: '',
        observaciones: '',
        importe_neto: '',
        importe_iva: '',
        tasa_IIBB_CABA: '',
        tasa_IIBB: '',
        tasa_IVA: '',
        importe_tasa_IIBB_CABA: '',
        importe_tasa_IIBB: '',
        importe_tasa_IVA: '',
        importe_total: '',
      })
      setImagenes([])
    }
  })


  useEffect(() => {
    if (AMRT) {
      setFormData({
        ...form,
        "meses_amortizacion": AMRT
      })
    }
  }, [AMRT])

  useEffect(() => {
    if (plan_cuentas?.length) {
      setCuentasFiltradas(plan_cuentas.filter(e => e.Codigo == "210110" || e.Codigo == "210119"))
    }
  }, [plan_cuentas])


  useEffect(() => {
    if (form.cuenta_contable) {
      setFormData({
        ...form,
        "cuenta_secundaria": plan_cuentas?.find(e => e.Codigo == form.cuenta_contable)?.CuentaSecundaria
      })
    }
  }, [form.cuenta_contable, plan_cuentas])
  const round2 = (value) =>
    Math.round((Number(value) || 0) * 100) / 100;

  const handleChange = (e) => {
    const { name, value } = e.target;

    let newForm = {
      ...form,
      [name]: value,
    };

    const neto = Number(newForm.importe_neto) || 0;
    const iva = Number(newForm.importe_iva) || 0;

    // 1️⃣ Modificación del importe neto
    if (name === "importe_neto") {
      const nuevoIVA = round2(neto * 0.21);

      newForm = {
        ...newForm,
        importe_iva: nuevoIVA,
        importe_total: round2(neto + nuevoIVA),

        // Reset de tasas
        tasa_IVA: "",
        tasa_IIBB: "",
        tasa_IIBB_CABA: "",
        importe_tasa_IVA: "",
        importe_tasa_IIBB: "",
        importe_tasa_IIBB_CABA: "",
      };
    }

    // 2️⃣ Modificación del importe IVA
    if (name === "importe_iva") {
      newForm.importe_total = round2(neto + iva);
    }

    // 3️⃣ Modificación de tasas
    const tasasMap = {
      tasa_IVA: "importe_tasa_IVA",
      tasa_IIBB: "importe_tasa_IIBB",
      tasa_IIBB_CABA: "importe_tasa_IIBB_CABA",
    };

    if (tasasMap[name]) {
      const tasaIVA = Number(
        name === "tasa_IVA" ? value : newForm.tasa_IVA
      ) || 0;

      const tasaIIBB = Number(
        name === "tasa_IIBB" ? value : newForm.tasa_IIBB
      ) || 0;

      const tasaIIBBCABA = Number(
        name === "tasa_IIBB_CABA" ? value : newForm.tasa_IIBB_CABA
      ) || 0;

      const importeTasaIVA = round2(neto * (tasaIVA / 100));
      const importeTasaIIBB = round2(neto * (tasaIIBB / 100));
      const importeTasaIIBBCABA = round2(neto * (tasaIIBBCABA / 100));

      newForm.importe_tasa_IVA = importeTasaIVA;
      newForm.importe_tasa_IIBB = importeTasaIIBB;
      newForm.importe_tasa_IIBB_CABA = importeTasaIIBBCABA;

      const totalTasas =
        importeTasaIVA + importeTasaIIBB + importeTasaIIBBCABA;
      console.log("TOTALTASAS: ", totalTasas)

      newForm.importe_total = round2(
        neto +
        (Number(newForm.importe_iva) || 0) +
        totalTasas
      );
    }

    setFormData(newForm);
  };


  const handleFileChange = (e) => {
    const nuevosArchivos = Array.from(e.target.files);
    setImagenes((prev) => [...prev, ...nuevosArchivos]);

    // Limpiá el value del input para permitir volver a subir el mismo archivo si se desea
    e.target.value = null;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.numero_comprobante_1 || !form.numero_comprobante_2) {
      Swal.fire("Debe especificar punto de venta y nº comprobante")
    } else {
      const formData = new FormData();
      // Agrego los campos normales
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Agrego las imágenes
      imagenes.forEach((img) => {
        formData.append("images", img);
      });
      dispatch(postVehiculo(formData))

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
            <p className={styles.loadingText}>Ingresando vehículo...</p>
          </div>
        )}
        <h2>Formulario de ingreso de vehiculos</h2>

        <form action="" enctype="multipart/form-data" className={styles.form}>
          <div className={styles.inputContainer}>
            <span>Modelo</span>
            <select name="modelo" value={form["modelo"]}
              onChange={handleChange} id="">
              <option value={""} disabled selected>{"Seleccione un modelo"}</option>
              {
                modelos?.length && modelos?.map(e => {
                  return <option value={e.id}>{e.nombre}</option>
                })
              }
            </select>
          </div>
          <div className={styles.inputContainer}>
            <span>Nro. Chasis</span>
            <input type="text" name='nro_chasis' value={form["nro_chasis"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Nro. Motor</span>
            <input type="number" name='nro_motor' value={form["nro_motor"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Kilometros iniciales</span>
            <input type="number" name='kilometros' value={form["kilometros"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Fecha medicion km</span>
            <input type="date" name='fecha_medicion_km' value={form["fecha_medicion_km"]}
              onChange={handleChange} />
          </div>

          {/*     <div className={styles.inputContainer}>
        <span>Proveedor GPS</span>
        <select name="proveedor_gps" value={form["proveedor_gps"]}
        onChange={handleChange} id="">
          <option value={""} disabled selected>{"Seleccione un proveedor"}</option>
            {
              proveedoresGPS?.length && proveedoresGPS?.map(e => {
                return <option value={e.id}>{e.nombre}</option>
              })
            }
        </select>
        </div> */}
          {/*     <div className={styles.inputContainer}>
        <span>Nro. Serie GPS</span>
        <input type="number" name='nro_serie_gps' value={form["nro_serie_gps"]}
        onChange={handleChange} />
        </div> */}
          <div className={styles.inputContainer}>
            <span>Cuenta contable</span>
            <select name="cuenta_contable" value={form["cuenta_contable"]} onChange={handleChange}>
              <option value={""} disabled selected>{"Seleccione una cuenta"}</option>
              {
                cuentasFiltradas?.length && cuentasFiltradas?.map(e => {
                  return <option value={e.Codigo}>{e.Nombre}</option>
                })
              }
            </select>
          </div>

          <div className={styles.inputContainer}>
            <span>Punto de venta</span>
            <input type="text" name='numero_comprobante_1' value={form["numero_comprobante_1"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Nº comprobante</span>
            <input type="text" name='numero_comprobante_2' value={form["numero_comprobante_2"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Meses amortización</span>
            <input type="number" name='meses_amortizacion' value={form["meses_amortizacion"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Color</span>
            <input type="text" name='color' value={form["color"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Sucursal</span>
            <select name="sucursal" value={form.sucursal} onChange={handleChange}>
              <option value="">Seleccione una sucursal</option>
              {sucursales.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputContainer}>
            <span>Ubicación</span>
            <input type="text" name='ubicacion' value={form["ubicacion"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Proveedor</span>
            <select name="proveedor_vehiculo" onChange={handleChange} value={form.proveedor_vehiculo}>
              {proveedores_vehiculo?.map((m) => (
                <option key={m.Codigo} value={m.Codigo}>{m.RazonSocial}</option>
              ))}
            </select>
          </div>
          <div className={styles.inputContainer}>
            <span>Observaciones</span>
            <textarea type="text" name='observaciones' value={form["observaciones"]} maxLength={100}
              onChange={handleChange} />
          </div>
          <div></div>
          <div className={styles.inputContainer} style={{ gridColumn: "span 1" }}>
            <span>Cargar archivos</span>
            <button type="button" style={{ width: "9rem" }} className={styles.sendBtn} onClick={handleFileClick}>
              Seleccionar archivos
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          <div className={styles.previewGrid} style={{ gridColumn: "span 1" }}>
            {imagenes.map((archivo, index) => (
              <div key={index} className={styles.thumbnailWrapper}>
                <img
                  src={URL.createObjectURL(archivo)}
                  alt={`preview-${index}`}
                  className={styles.thumbnail}
                />
                <button type="button" className={styles.removeBtn} onClick={() => eliminarImagen(index)}>×</button>
              </div>
            ))}
          </div>

        </form>

      </div>
      <div className={styles.container}>
        <h2>Factura</h2>
        <form className={styles.form}>
          <div className={styles.inputContainer}>
            <span>Fecha factura y asientos</span>
            <input type="date" name='fecha_factura' value={form["fecha_factura"]}
              onChange={handleChange} />
          </div>
          <div></div>
          <div></div>

          <div className={styles.inputContainer}>
            <span>Importe neto</span>
            <input type="text" name='importe_neto' value={form["importe_neto"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Importe IVA</span>
            <input type="text" name='importe_iva' value={form["importe_iva"]}
              onChange={handleChange} />
          </div>
          <div></div>
          <div className={styles.inputContainer}>
            <span>Tasa perc. IVA</span>
            <input type="text" name='tasa_IVA' value={form["tasa_IVA"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Tasa perc. IIBB</span>
            <input type="text" name='tasa_IIBB' value={form["tasa_IIBB"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Tasa perc. IIBB CABA</span>
            <input type="text" name='tasa_IIBB_CABA' value={form["tasa_IIBB_CABA"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Importe tasa perc. IVA</span>
            <input type="text" name='importe_tasa_IVA' value={form["importe_tasa_IVA"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Importe tasa IIBB</span>
            <input type="text" name='importe_tasa_IIBB' value={form["importe_tasa_IIBB"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Importe tasa IIBB CABA</span>
            <input type="text" name='importe_tasa_IIBB_CABA' value={form["importe_tasa_IIBB_CABA"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Importe total</span>
            <input type="text" name='importe_total' value={form["importe_total"]} disabled
              onChange={handleChange} />
          </div>

        </form>
        {
          (!form.modelo || !form.cuenta_contable || !form.importe_neto || !form.importe_iva) ?
            <button
              className={styles.sendBtn}
              disabled
            >
              Enviar
            </button>
            :
            <button
              className={styles.sendBtn}
              onClick={handleSubmit}
            >
              Enviar
            </button>
        }
      </div>

    </div>
  )
}

export default VehiculosForm