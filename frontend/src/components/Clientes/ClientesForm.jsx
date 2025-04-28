import React, {useState, useEffect, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styles from './ClientesForm.module.css'
import { postCliente, reset } from '../../reducers/Clientes/clientesSlice'
import {getProvincias, getTiposDocumento, getTiposResponsable, getTiposSexo} from '../../reducers/Generales/generalesSlice'
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import { paises } from '../../paises.js'

const ClientesForm = () => {
const dispatch = useDispatch()
  useEffect(() => {
    Promise.all([
      dispatch(getProvincias()),
      dispatch(getTiposDocumento()),
      dispatch(getTiposResponsable()),
      dispatch(getTiposSexo()),
    ])
  }, [])
  

  const [form, setFormData] = useState({
    nombre: '',
    apellido: '',
    razon_social: '',
    fecha_nacimiento: '',
    nacionalidad: '',
    tipo_contribuyente: '',
    tipo_documento: '',
    nro_documento: '',
    doc_expedido_por: '',
    licencia: '',
    lic_expedida_por: '',
    fecha_vencimiento: '',
    direccion: '',
    nro_direccion: '',
    piso: '',
    depto: '',
    codigo_postal: '',
    provincia: '',
    celular: '',
    ciudad: '',
    mail: '',
    notas:'',
  })

const {provincias, tipos_documento, tipos_responsable} = useSelector((state) => state.generalesReducer)
const {isError, isSuccess, isLoading, message} = useSelector((state) => state.clientesReducer)
const [imagenes, setImagenes] = useState([]);
const [formValido, setFormValido] = useState(false);
const [errors, setErrors] = useState({});
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
          nombre: '',
          apellido: '',
          razon_social: '',
          fecha_nacimiento: '',
          nacionalidad: '',
          tipo_contribuyente: '',
          tipo_documento: '',
          nro_documento: '',
          doc_expedido_por: '',
          licencia: '',
          lic_expedida_por: '',
          fecha_vencimiento: '',
          direccion: '',
          nro_direccion: '',
          piso: '',
          depto: '',
          codigo_postal: '',
          provincia: '',
          ciudad: '',
          mail: '',
          notas: '',
        })
        setImagenes([])
    }

  }, [isError, isSuccess]) 
  useEffect(() => {
    const isButtonEnabled = ((form["nombre"] !== '' && form["apellido"] !== '') || 
    (form["razon_social"] !== '' && (form["nombre"] === '' && form["apellido"] === '')));
    const camposObligatoriosCompletos =
      form["tipo_documento"] !== '' &&
      form["nro_documento"] !== '' &&
      form["licencia"] !== '' &&
      form["direccion"] !== '' &&
      form["nro_direccion"] !== '' &&
      form["codigo_postal"] !== '' &&
      form["celular"] !== '' &&
      form["mail"] !== '' &&
      imagenes.length > 0;

    setFormValido(isButtonEnabled && camposObligatoriosCompletos);
  }, [form, imagenes]);
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
  
    dispatch(postCliente(formData))
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
    <p className={styles.loadingText}>Ingresando cliente...</p>
  </div>
)}
        <h2>Formulario de ingreso de clientes</h2>
    <form className={styles.form}>
      <fieldset className={styles.fieldSet}>
        <legend>Datos personales</legend>
        <div className={styles.inputContainer}>
          <span>Nombre</span>
          <input type="text" name='nombre' value={form["nombre"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Apellido</span>
          <input type="text" name='apellido' value={form["apellido"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Razón Social</span>
          <input type="text" name='razon_social' value={form["razon_social"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Fecha de nacimiento</span>
          <input type="date" onBlur={() => setErrors({ ...errors, ["fecha_nacimiento"]: !form["fecha_nacimiento"] ? 'Campo obligatorio' : '' })}
          name='fecha_nacimiento' value={form["fecha_nacimiento"]}
          onChange={handleChange} />
          {errors["fecha_nacimiento"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["fecha_nacimiento"]}</span>}
        </div>
        <div className={styles.inputContainer}>
          <span>Nacionalidad</span>
          <select name="nacionalidad" value={form["nacionalidad"]}
          onChange={handleChange} id="">
            <option value={""} disabled /* selected */>{"Seleccione un pais"}</option>
            {
              paises?.length && paises?.map(e => {
                return <option key={e.name} value={e.name}>{e.name}</option>
              })
            }
          </select>
        </div>
        <div className={styles.inputContainer}>
          <span>Tipo de contribuyente</span>
          <select name="tipo_contribuyente" value={form["tipo_contribuyente"]}
          onChange={handleChange} id="">
            <option value={""} disabled /* selected */>{"Seleccione"}</option>
            {
              tipos_responsable?.length && tipos_responsable?.map(e => {
                return <option key={e.id} value={e.id}>{e.nombre}</option>
              })
            }
          </select>
        </div>
        <div className={styles.inputContainer}>
          <span>Tipo documento</span>
          <select name="tipo_documento" 
          onBlur={() => setErrors({ ...errors, ["tipo_documento"]: !form["tipo_documento"] ? 'Campo obligatorio' : '' })} 
          value={form["tipo_documento"]}
          onChange={handleChange} id="">
            <option value={""} disabled /* selected */>{"Seleccione"}</option>
            {
              tipos_documento?.length && tipos_documento?.map(e => {
                return <option key={e.id} value={e.id}>{e.nombre}</option>
              })
            }
          </select>
          {errors["tipo_documento"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["tipo_documento"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Nro. Documento</span>
        <input type="number" 
        onBlur={() => setErrors({ ...errors, ["nro_documento"]: !form["nro_documento"] ? 'Campo obligatorio' : '' })} 
        name='nro_documento' value={form["nro_documento"]}
        onChange={handleChange} />
        {errors["nro_documento"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["nro_documento"]}</span>}
        </div>
        <div className={styles.inputContainer}>
          <span>Doc. expedido por</span>
          <select name="doc_expedido_por" value={form["doc_expedido_por"]}
          onChange={handleChange} id="">
            <option value={""} disabled /* selected */>{"Seleccione un pais"}</option>
            {
              paises?.length && paises?.map(e => {
                return <option key={e.name} value={e.name}>{e.name}</option>
              })
            }
          </select>
        </div>
        <div className={styles.inputContainer}>
        <span>Dirección</span>
        <input type="text" name='direccion'
        onBlur={() => setErrors({ ...errors, ["direccion"]: !form["direccion"] ? 'Campo obligatorio' : '' })} 
        value={form["direccion"]}
        onChange={handleChange} />
        {errors["direccion"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["direccion"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Nro. direccion</span>
        <input type="number"
        onBlur={() => setErrors({ ...errors, ["nro_direccion"]: !form["nro_direccion"] ? 'Campo obligatorio' : '' })} 
        name='nro_direccion' value={form["nro_direccion"]}
        onChange={handleChange} />
        {errors["nro_direccion"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["nro_direccion"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Piso</span>
        <input type="number" name='piso' value={form["piso"]}
        onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
        <span>Depto</span>
        <input type="text" name='depto' value={form["depto"]}
        onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
        <span>Código Postal</span>
        <input type="number" 
        onBlur={() => setErrors({ ...errors, ["codigo_postal"]: !form["codigo_postal"] ? 'Campo obligatorio' : '' })} 
        name='codigo_postal' value={form["codigo_postal"]}
        onChange={handleChange} />
        {errors["codigo_postal"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["codigo_postal"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Celular</span>
        <input type="number"
        onBlur={() => setErrors({ ...errors, ["celular"]: !form["celular"] ? 'Campo obligatorio' : '' })}  
        name='celular' value={form["celular"]}
        onChange={handleChange} />
        {errors["celular"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["celular"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Provincia</span>
        <select name="provincia" value={form["provincia"]}
        onChange={handleChange} id="">
          <option value={""} disabled /* selected */>{"Seleccione una provincia"}</option>
            {
              provincias?.length && provincias?.map(e => {
                return <option key={e.id} value={e.id}>{e.nombre}</option>
              })
            }
        </select>
        </div>
        <div className={styles.inputContainer}>
        <span>Ciudad</span>
        <input type="text" name='ciudad' value={form["ciudad"]}
        onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
        <span>Mail</span>
        <input type="text" 
        onBlur={() => setErrors({ ...errors, ["mail"]: !form["mail"] ? 'Campo obligatorio' : '' })} 
        name='mail' value={form["mail"]}
        onChange={handleChange} />
        {errors["mail"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["mail"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Notas</span>
        <textarea name='notas' value={form["notas"]} onChange={handleChange}/>
        </div>
        </fieldset>
        <fieldset className={styles.fieldSet}>
          <legend>Datos de licencia</legend>
        <div className={styles.inputContainer}>
        <span>Licencia</span>
        <input type="number" 
        onBlur={() => setErrors({ ...errors, ["licencia"]: !form["licencia"] ? 'Campo obligatorio' : '' })} 
        name='licencia' value={form["licencia"]}
        onChange={handleChange} />
        {errors["licencia"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["licencia"]}</span>}
        </div>
        <div className={styles.inputContainer}>
          <span>Licencia expedida por</span>
          <select name="lic_expedida_por" value={form["lic_expedida_por"]}
          onChange={handleChange} id="">
            <option value={""} disabled /* selected */>{"Seleccione un pais"}</option>
            {
              paises?.length && paises?.map(e => {
                return <option key={e.name} value={e.name}>{e.name}</option>
              })
            }
          </select>
        </div>
        <div className={styles.inputContainer}>
          <span>Fecha de vencimiento</span>
          <input type="date" name='fecha_vencimiento' value={form["fecha_vencimiento"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer} style={{ gridColumn: "span 1" }}>
        <span>Cargar imágenes de su licencia</span>
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
      </fieldset>
    </form>
        <button 
        className={styles.sendBtn} 
        onClick={handleSubmit}
        disabled={!formValido}
        >
          Enviar
        </button>
      </div>
    </div>
)
}

export default ClientesForm