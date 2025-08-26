import React, {useState, useEffect, useRef} from 'react'
import { useSelector, useDispatch } from 'react-redux'
import styles from './ClientesForm.module.css'
import { postCliente, reset } from '../../reducers/Clientes/clientesSlice'
import {getProvincias, getTiposDocumento, getTiposResponsable, getTiposSexo} from '../../reducers/Generales/generalesSlice'
import { ToastContainer } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import { paises } from '../../paises.js'
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';
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
  
const {username} = useSelector((state) => state.loginReducer)
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
    resolucion_datero: 0,
    usuario_resolucion_datero: username,
    //datero
    composicion_familiar: "",
    tiene_o_tuvo_vehiculo: "",
    tipo_servicio: "",
    certificado_domicilio: 0,
    score_veraz: "",
    nivel_deuda: "",
    situacion_deuda: "",
    libre_de_deuda: "",
    antecedentes_penales: 0,
    fecha_antecedentes: "",
    cantidad_viajes_uber: "",
    cantidad_viajes_cabify: "",
    cantidad_viajes_didi: "",
    antiguedad_uber: "",
    antiguedad_cabify: "",
    antiguedad_didi: "",
    trabajos_anteriores: "",
    observacion_perfil: ""
})

const {provincias, tipos_documento, tipos_responsable} = useSelector((state) => state.generalesReducer)
const {isError, isSuccess, isLoading, message} = useSelector((state) => state.clientesReducer)
const [imagenes, setImagenes] = useState([]);
const [formValido, setFormValido] = useState(false);
const [errors, setErrors] = useState({});
const [tiposResponsableClientes, setTiposResponsableClientes] = useState(null)
const [tiposDocumentoClientes, setTiposDocumentoClientes] = useState(null)
const camposObligatorios = [
  "tipo_documento",
  "nro_documento",
  "direccion",
  "nro_direccion",
  "codigo_postal",
  "celular",
  "mail",
];
const validarCamposObligatorios = () => {
  const nuevosErrores = {};

  camposObligatorios.forEach((campo) => {
    if (!form[campo] || form[campo].toString().trim() === "") {
      nuevosErrores[campo] = "Campo obligatorio";
    }
  });


  setErrors(nuevosErrores);

  return Object.keys(nuevosErrores).length === 0;
};
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
          composicion_familiar: "",
          tiene_o_tuvo_vehiculo: "",
          tipo_servicio: "",
          certificado_domicilio: 0,
          score_veraz: "",
          nivel_deuda: "",
          situacion_deuda: "",
          libre_de_deuda: "",
          antecedentes_penales: 0,
          fecha_antecedentes: "",
          cantidad_viajes_uber: "",
          cantidad_viajes_cabify: "",
          cantidad_viajes_didi: "",
          antiguedad_uber: "",
          antiguedad_cabify: "",
          antiguedad_didi: "",
          trabajos_anteriores: "",
          observacion_perfil: ""
        })
        setImagenes([])
  }
})
useEffect(() => {
    const isButtonEnabled = ((form["nombre"] !== '' && form["apellido"] !== '') || 
    (form["razon_social"] !== '' && (form["nombre"] === '' && form["apellido"] === '')));
    const camposObligatoriosCompletos = camposObligatorios.every(
    (campo) => form[campo] !== '' && form[campo]?.toString().trim() !== ''
    );


    setFormValido(isButtonEnabled && camposObligatoriosCompletos);
}, [form, imagenes]);

useEffect(() => {
if(tipos_responsable?.length){
  const ids = [1, 4, 5];
  const resultado = tipos_responsable.filter(item => ids.includes(item.id));
  setTiposResponsableClientes(resultado)
}
}, [tipos_responsable])

useEffect(() => {
if(tipos_documento?.length){
  const ids = [6,7];
  const resultado = tipos_documento.filter(item => ids.includes(item.id));
  setTiposDocumentoClientes(resultado)
}
}, [tipos_documento])

const handleChange = (e) => {
  const { name, value } = e.target;
  if(name == "resolucion_datero"){
    setFormData({
      ...form,
      resolucion_datero: parseInt(value)
    })
  }else{
    setFormData({
      ...form,
      [name]: value,
    }); 
  }
};
const handleCheckChange = (e) => {
const { name, checked } = e.target;
setFormData(prevForm => ({
  ...prevForm,
  [name]: checked ? 1 : 0
}));}
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
    const esValido = validarCamposObligatorios();
    if (!esValido) {
    alert("Por favor, complete los campos obligatorios.");
    return;
    }else{
      dispatch(postCliente(formData))
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
          <input type="date" 
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
              tiposResponsableClientes?.length && tiposResponsableClientes?.map(e => {
                return <option key={e.id} value={e.id}>{e.nombre}</option>
              })
            }
          </select>
        </div>
        <div className={styles.inputContainer}>
          <span>Tipo documento</span>
          <select name="tipo_documento" 
          value={form["tipo_documento"]}
          onBlur={() => setErrors({ ...errors, ["tipo_documento"]: !form["tipo_documento"] ? 'Campo obligatorio' : '' })}
          onChange={handleChange} id="">
            <option value={""} disabled /* selected */>{"Seleccione"}</option>
            {
              tiposDocumentoClientes?.length && tiposDocumentoClientes?.map(e => {
                return <option key={e.id} value={e.id}>{e.nombre}</option>
              })
            }
          </select>
          {errors["tipo_documento"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["tipo_documento"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Nro. Documento</span>
        <input type="number" 
        name='nro_documento'  value={form["nro_documento"]}
        onChange={handleChange} 
        onBlur={() => setErrors({ ...errors, ["nro_documento"]: !form["nro_documento"] ? 'Campo obligatorio' : '' })}/>
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
        value={form["direccion"]}
        onChange={handleChange} 
        onBlur={() => setErrors({ ...errors, ["direccion"]: !form["direccion"] ? 'Campo obligatorio' : '' })}/>
        {errors["direccion"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["direccion"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Nro. direccion</span>
        <input type="number"
        name='nro_direccion' value={form["nro_direccion"]}
        onChange={handleChange} 
        onBlur={() => setErrors({ ...errors, ["nro_direccion"]: !form["nro_direccion"] ? 'Campo obligatorio' : '' })}/>
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
        name='codigo_postal' value={form["codigo_postal"]}
        onChange={handleChange} 
        onBlur={() => setErrors({ ...errors, ["codigo_postal"]: !form["codigo_postal"] ? 'Campo obligatorio' : '' })}/>
        {errors["codigo_postal"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["codigo_postal"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Celular</span>
        <input type="number"
        name='celular' value={form["celular"]}
        onChange={handleChange} 
        onBlur={() => setErrors({ ...errors, ["celular"]: !form["celular"] ? 'Campo obligatorio' : '' })}/>
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
        name='mail' value={form["mail"]}
        onChange={handleChange} 
        onBlur={() => setErrors({ ...errors, ["mail"]: !form["mail"] ? 'Campo obligatorio' : '' })}/>
        {errors["mail"] && <span style={{ color: 'red', fontSize: '10px' }}>{errors["mail"]}</span>}
        </div>
        <div className={styles.inputContainer}>
        <span>Notas</span>
        <textarea name='notas' value={form["notas"]} onChange={handleChange}/>
        </div>
        </fieldset>
      <fieldset className={styles.fieldSet}>
        <legend>Datos adicionales</legend>
        <div className={styles.inputContainer}>
          <span>Composición familiar</span>
          <input type="text" name='composicion_familiar' value={form["composicion_familiar"]}
          onChange={handleChange}/>
        </div>
        <div className={styles.inputContainer}>
          <span>Tiene o tuvo vehículo</span>
          <input type="text" name='tiene_o_tuvo_vehiculo' value={form["tiene_o_tuvo_vehiculo"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Tipo de servicio a su nombre</span>
          <input type="text" name='tipo_servicio' value={form["tipo_servicio"]}
          onChange={handleChange}/>
        </div>
        <div className={styles.inputContainer} style={{alignItems: "start"}}>
          <span>Certificado de domicilio</span>
          <input type="checkbox" name='certificado_domicilio' value={form["certificado_domicilio"]}
          onChange={handleCheckChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Score en veraz</span>
          <input type="text" name='score_veraz' value={form["score_veraz"]}
          onChange={handleChange}/>
        </div>
        <div className={styles.inputContainer}>
          <span>Nivel de deuda</span>
          <input type="text" name='nivel_deuda' value={form["nivel_deuda"]}
          onChange={handleChange}/>
        </div>
        <div className={styles.inputContainer}>
          <span>Situación</span>
          <input type="number" name='situacion_deuda' value={form["situacion_deuda"]}
          onChange={handleChange}/>
        </div>
        <div className={styles.inputContainer} style={{alignItems: "start"}}>
          <span>Presenta libre de deuda</span>
            <input type="checkbox" name='libre_de_deuda' value={form["libre_de_deuda"]}
            onChange={handleCheckChange} />
        </div>
        <div className={styles.inputContainer} style={{alignItems: "start"}}>
          <span>Antecedentes penales</span>
          <input type="checkbox" name='antecedentes_penales' 
          value={form["antecedentes_penales"]}
          onChange={handleCheckChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Fecha</span>
          <input type="date" name='fecha_antecedentes' value={form["fecha_antecedentes"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Cant. viajes UBER</span>
          <input type="number" name='cantidad_viajes_uber' value={form["cantidad_viajes_uber"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Cant. viajes CABIFY</span>
          <input type="number" name='cantidad_viajes_cabify' value={form["cantidad_viajes_cabify"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Cant. viajes DIDI</span>
          <input type="number" name='cantidad_viajes_didi' value={form["cantidad_viajes_didi"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Antigüedad UBER</span>
          <input type="text" name='antiguedad_uber' value={form["antiguedad_uber"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Antigüedad CABIFY</span>
          <input type="text" name='antiguedad_cabify' value={form["antiguedad_cabify"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Antigüedad DIDI</span>
          <input type="text" name='antiguedad_didi' value={form["antiguedad_didi"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Trabajos anteriores o actuales a detallar</span>
          <textarea name='trabajos_anteriores' value={form["trabajos_anteriores"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
          <span>Observación del perfil del chofer</span>
          <textarea name='observacion_perfil' value={form["observacion_perfil"]}
          onChange={handleChange} />
        </div>
        <div className={styles.inputContainer}>
        <span>Resolución datero</span>
        <select name="resolucion_datero" value={form["resolucion_datero"]}
        onChange={handleChange} id="">
          <option value={0}>Pendiente de aprobación</option>
          <option value={1}>Aprobado</option>
          <option value={2}>Rechazado</option>
        </select>
        </div>
      </fieldset>
      <fieldset className={styles.fieldSet}>
          <legend>Datos de licencia</legend>
        <div className={styles.inputContainer}>
        <span>Licencia</span>
        <input type="number" 
        name='licencia' value={form["licencia"]}
        onChange={handleChange}/>
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