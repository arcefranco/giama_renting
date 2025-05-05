import React, {useState, useEffect, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styles from './VehiculosForm.module.css'
import { getModelos, getSucursales } from '../../reducers/Generales/generalesSlice'
import { postVehiculo, reset } from '../../reducers/Vehiculos/vehiculosSlice'
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
const VehiculosForm = () => {
const dispatch = useDispatch()
  useEffect(() => {
    Promise.all([
      dispatch(getModelos()),
      dispatch(getSucursales())
    ])
  }, [])
  

  const [form, setFormData] = useState({
    modelo: '',
    dominio: '',
    nro_chasis: '',
    nro_motor: '',
    kilometros: '',
    proveedor_gps: '',
    nro_serie_gps: '',
    costo: '',
    dispositivo: '',
    meses_amortizacion: '',
    color: '',
    sucursal: ''
  })

  const {modelos, sucursales} = useSelector((state) => state.generalesReducer)
  const {isError, isSuccess, isLoading, message} = useSelector((state) => state.vehiculosReducer)
  const [imagenes, setImagenes] = useState([]);
  const fileInputRef = useRef(null);

const handleFileClick = () => {
  fileInputRef.current.click();
};
const eliminarImagen = (index) => {
  setImagenes((prev) => prev.filter((_, i) => i !== index));
};

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
        setFormData({
          modelo: '',
          dominio: '',
          nro_chasis: '',
          nro_motor: '',
          kilometros: '',
          proveedor_gps: '',
          costo: '',
          nro_serie_gps: '',
          dispositivo: '',
          meses_amortizacion: '',
          color: ''
        })
        setImagenes([])
    }

  }, [isError, isSuccess]) 

const handleChange = (e) => {
    const { name, value } = e.target;
      setFormData({
       ...form,
       [name]: value,
     }); 
};
const handleFileChange = (e) => {
    const nuevosArchivos = Array.from(e.target.files);
    setImagenes((prev) => [...prev, ...nuevosArchivos]);
  
    // Limpiá el value del input para permitir volver a subir el mismo archivo si se desea
    e.target.value = null;
};
const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    // Agregás los campos normales
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
  
    // Agregás las imágenes
    imagenes.forEach((img) => {
      formData.append("images", img);
    });
  
    dispatch(postVehiculo(formData))
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
          <span>Dominio</span>
          <input type="text" name='dominio' value={form["dominio"]}
          onChange={handleChange} />
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
        <span>Kilometros</span>
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
        <span>Costo neto del vehículo</span>
        <input type="number" name='costo' value={form["costo"]}
        onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
        <span>Dispositivo Peaje</span>
        <input type="number" name='dispositivo' value={form["dispositivo"]}
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
        <div className={styles.inputContainer} style={{ gridColumn: "span 1" }}>
  <span>Cargar imágenes</span>
  <button type="button" style={{ width: "9rem" }} className={styles.sendBtn} onClick={handleFileClick}>
    Seleccionar imágenes
  </button>
  <input
    type="file"
    ref={fileInputRef}
    multiple
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
        <button 
        className={styles.sendBtn} 
        onClick={handleSubmit}
        disabled={!form.modelo}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}

export default VehiculosForm