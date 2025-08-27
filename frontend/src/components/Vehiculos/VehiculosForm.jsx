import React, {useState, useEffect, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styles from './VehiculosForm.module.css'
import { getModelos, getSucursales, getPreciosModelos, 
  getParametroAMRT, getPlanCuentas, getProveedoresVehiculo } from '../../reducers/Generales/generalesSlice'
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
  
  const {username} = useSelector((state) => state.loginReducer)

  const [form, setFormData] = useState({
    modelo: '',
    dominio: '',
    dominio_provisorio: '',
    fecha_inicio_amortizacion: '',
    nro_chasis: '',
    nro_motor: '',
    kilometros: '',
    proveedor_gps: '',
    nro_serie_gps: '',
    costo: '',
    dispositivo: '',
    meses_amortizacion: '',
    color: '',
    sucursal: '',
    numero_comprobante_1: '',
    numero_comprobante_2: '',
    cuenta_contable: '',
    cuenta_secundaria: '',
    proveedor_vehiculo: '',
    usuario: username
    
  })

  const {modelos, sucursales, preciosModelos, 
    AMRT, plan_cuentas, proveedores_vehiculo} = useSelector((state) => state.generalesReducer)
  const {isError, isSuccess, isLoading, message} = useSelector((state) => state.vehiculosReducer)
  const [cuentaDeudaAuto, setCuentaDeudaAuto] = useState(null)
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
    proveedor_gps: '',
    costo: '',
    nro_serie_gps: '',
    dispositivo: '',
    meses_amortizacion: '',
    color: '',
    sucursal: '',
    numero_comprobante_1: '',
    numero_comprobante_2: '',
    cuenta_contable: '',
    cuenta_secundaria: '',
    proveedor_vehiculo: '',
  })
  setImagenes([])
  }
})

useEffect(() => {
if(proveedores_vehiculo){
  setFormData({
    ...form,
    proveedor_vehiculo: proveedores_vehiculo.find(e => e.Codigo == 11)?.Codigo
  })
}
}, [proveedores_vehiculo])

useEffect(() => {
if(AMRT) {
  setFormData({
    ...form,
    "meses_amortizacion": AMRT
  })
}
}, [AMRT])

useEffect(() => {
  if(plan_cuentas?.length){
    setCuentaDeudaAuto(plan_cuentas.find(e => e.Codigo == "210110")?.Codigo)
  }
}, [plan_cuentas])

useEffect(() => {
if(cuentaDeudaAuto){
  setFormData({
    ...form,
    cuenta_contable: cuentaDeudaAuto
  })
}
}, [cuentaDeudaAuto])

useEffect(() => {
if(form.cuenta_contable) {
  setFormData({
    ...form,
     "cuenta_secundaria": plan_cuentas?.find(e => e.Codigo == form.cuenta_contable)?.CuentaSecundaria
  })
}
}, [form.cuenta_contable, plan_cuentas])

const handleChange = (e) => {
const { name, value } = e.target;
if(name === "modelo"){
  setFormData({
    ...form,
    [name]: value,
     "costo": preciosModelos?.find(e => e.modelo == value)?.precio
  })
}else{
  setFormData({
    ...form,
    [name]: value,
  }); 

}
};
const handleFileChange = (e) => {
    const nuevosArchivos = Array.from(e.target.files);
    setImagenes((prev) => [...prev, ...nuevosArchivos]);
  
    // Limpiá el value del input para permitir volver a subir el mismo archivo si se desea
    e.target.value = null;
};
const handleSubmit = async (e) => {
    e.preventDefault();
    if(!form.numero_comprobante_1 || !form.numero_comprobante_2){
      Swal.fire("Debe especificar punto de venta y nº comprobante")
    }else{
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
          <select name="cuenta_contable" value={form["cuenta_contable"]} disabled>
            <option value={""} disabled selected>{"Seleccione una cuenta"}</option>
            {
              plan_cuentas?.length && plan_cuentas?.map(e => {
                return <option value={e.Codigo}>{e.Nombre}</option>
              })
            }
          </select>
        </div>
        <div className={styles.inputContainer}>
        <span>Costo total del vehículo</span>
        <input type="number" name='costo' value={form["costo"]}
        onChange={handleChange} />
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
          <span>Proveedor</span>
          <select name="proveedor_vehiculo" value={form.proveedor_vehiculo} disabled>
            {proveedores_vehiculo.map((m) => (
              <option key={m.Codigo} value={m.Codigo}>{m.RazonSocial}</option>
            ))}
          </select>
        </div>
        <div></div>
  <div className={styles.inputContainer} style={{ gridColumn: "span 1" }}>
  <span>Cargar imágenes</span>
  <button type="button" style={{ width: "9rem" }} className={styles.sendBtn} onClick={handleFileClick}>
    Seleccionar imágenes
  </button>
  <input
    type="file"
    ref={fileInputRef}
    multiple
    accept="image/*"
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
        {
        (!form.modelo || !form.cuenta_contable) ?
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