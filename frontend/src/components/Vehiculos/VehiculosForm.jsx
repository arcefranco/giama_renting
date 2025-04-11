import React, {useState, useEffect} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styles from './VehiculosForm.module.css'
import { getModelos, getProveedoresGPS } from '../../reducers/Generales/generalesSlice'
import { postVehiculo } from '../../reducers/Vehiculos/vehiculosSlice'
import { ToastContainer, toast } from 'react-toastify';

const VehiculosForm = () => {
const dispatch = useDispatch()
  useEffect(() => {
    Promise.all([
      dispatch(getModelos()),
      dispatch(getProveedoresGPS())
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
    dispositivo: '',
    meses_amortizacion: '',
    color: ''
  })

  const {modelos, proveedoresGPS} = useSelector((state) => state.generalesReducer)
  const {isError, isSuccess, isLoading, message} = useSelector((state) => state.vehiculosReducer)

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
    }

  }, [isError, isSuccess]) 

  const handleChange = (e) => {
    const { name, value } = e.target;
      setFormData({
       ...form,
       [name]: value,
     }); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
  
    // Agregás todos los campos del formulario
    for (const key in form) {
      formData.append(key, form[key]);
    }
  
    // Agregás las imágenes
    const files = document.querySelector('input[type="file"]').files;
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }
  
    dispatch(postVehiculo(formData))
  }

  return (
    <div>

      <div className={styles.container}>
      <ToastContainer /> 
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
          <input type="number" name='nro_chasis' value={form["nro_chasis"]}
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
        <div className={styles.inputContainer}>
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
        </div>
        <div className={styles.inputContainer}>
        <span>Nro. Serie GPS</span>
        <input type="number" name='nro_serie_gps' value={form["nro_serie_gps"]}
        onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
        <span>Dispositivo Peaje</span>
        <input type="text" name='dispositivo' value={form["dispositivo"]}
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
        <span>Cargar imagenes</span>
        <input lang='es' type="file" name='images' multiple/>
        </div>
        </form>
        <button className={styles.sendBtn} onClick={handleSubmit}>Enviar</button>
      </div>
    </div>
  )
}

export default VehiculosForm