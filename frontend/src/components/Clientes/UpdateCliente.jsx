import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {getProvincias, getTiposDocumento, getTiposResponsable} from '../../reducers/Generales/generalesSlice'
import { getClientesById, updateCliente, reset, getDateroByIdCliente } from '../../reducers/Clientes/clientesSlice';
import styles from './UpdateCliente.module.css';
import { paises } from '../../paises.js';
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';

const UpdateCliente = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { provincias, tipos_documento, tipos_responsable } = useSelector(state => state.generalesReducer);
  const { cliente, isError, isSuccess, isLoading, message, datero } = useSelector(state => state.clientesReducer);
  const {username} = useSelector((state) => state.loginReducer)
  const [errors, setErrors] = useState({});
  const [formValido, setFormValido] = useState(false);
  const [tiposResponsableClientes, setTiposResponsableClientes] = useState(null)
  const [tiposDocumentoClientes, setTiposDocumentoClientes] = useState(null)
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
    telefono_alternativo: '',
    ciudad: '',
    mail: '',
    notas:'',
    resolucion_datero: 0,
    usuario_resolucion_datero: username ? username : "",
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
  const formRef = useRef(null);
  const location = useLocation();
  useEffect(() => {
    dispatch(getProvincias());
    dispatch(getTiposResponsable());
    dispatch(getTiposDocumento()),
    dispatch(getClientesById({id: id}));
    dispatch(getDateroByIdCliente({id_cliente: id}))
  }, [id]);
  useEffect(() => {
    setFormData({
      ...form,
      usuario_resolucion_datero: username
    })
  }, [username])

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente[0]?.nombre || '',
        apellido: cliente[0]?.apellido || '',
        razon_social: cliente[0]?.razon_social || '',
        fecha_nacimiento: renderFecha(cliente[0]?.fecha_nacimiento) || '',
        nacionalidad: cliente[0]?.nacionalidad || '',
        tipo_contribuyente: cliente[0]?.tipo_contribuyente || '',
        tipo_documento: cliente[0]?.tipo_documento || '',
        nro_documento: cliente[0]?.nro_documento || '',
        doc_expedido_por: cliente[0]?.doc_expedido_por || '',
        licencia: cliente[0]?.licencia || '',
        lic_expedida_por: cliente[0]?.lic_expedida_por || '',
        fecha_vencimiento: renderFecha(cliente[0]?.fecha_vencimiento_licencia) || '',
        direccion: cliente[0]?.direccion || '',
        nro_direccion: cliente[0]?.nro_direccion || '',
        piso: cliente[0]?.piso || '',
        depto: cliente[0]?.depto || '',
        codigo_postal: cliente[0]?.codigo_postal || '',
        provincia: cliente[0]?.provincia || '',
        celular: cliente[0]?.celular || '',
        telefono_alternativo: cliente[0]?.telefono_alternativo || '',
        ciudad: cliente[0]?.ciudad || '',
        mail: cliente[0]?.mail || '',
        notas: cliente[0]?.notas ||'',
        resolucion_datero: cliente[0]?.resolucion_datero || '',
        usuario_resolucion_datero: username ? username : "",
        composicion_familiar: datero[0]?.composicion_familiar || '',
        tiene_o_tuvo_vehiculo: datero[0]?.tiene_o_tuvo_vehiculo || '',
        tipo_servicio: datero[0]?.tipo_servicio || '',
        certificado_domicilio:datero[0]?.certificado_domicilio || '',
        score_veraz: datero[0]?.score_veraz || '',
        nivel_deuda: datero[0]?.nivel_deuda || '',
        situacion_deuda: datero[0]?.situacion_deuda || '',
        libre_de_deuda: datero[0]?.libre_de_deuda || 0,
        antecedentes_penales:datero[0]?.antecedentes_penales || '',
        fecha_antecedentes: datero[0]?.fecha_antecedentes || '',
        cantidad_viajes_uber: datero[0]?.cantidad_viajes_uber || '',
        cantidad_viajes_cabify: datero[0]?.cantidad_viajes_cabify || '',
        cantidad_viajes_didi: datero[0]?.cantidad_viajes_didi || '',
        antiguedad_uber: datero[0]?.antiguedad_uber || '',
        antiguedad_cabify: datero[0]?.antiguedad_cabify || '',
        antiguedad_didi: datero[0]?.antiguedad_didi || '',
        trabajos_anteriores: datero[0]?.trabajos_anteriores || '',
        observacion_perfil:datero[0]?.observacion_perfil || ''
      });
    }
  }, [cliente, datero]);

useToastFeedback({
  isError,
  isSuccess,
  message,
  resetAction: reset
})
useEffect(() => {
    const isButtonEnabled = ((form["nombre"] !== '' && form["apellido"] !== '') || 
    (form["razon_social"] !== '' && (form["nombre"] === '' && form["apellido"] === '')));
    const camposObligatoriosCompletos =
      form["tipo_documento"] !== '' &&
      form["nro_documento"] !== '' &&
      form["direccion"] !== '' &&
      form["nro_direccion"] !== '' &&
      form["codigo_postal"] !== '' &&
      form["celular"] !== '' &&
      form["mail"] !== '' 

    setFormValido(isButtonEnabled && camposObligatoriosCompletos);
}, [form]);

useEffect(() => {
    const params = new URLSearchParams(location.search);
    const imprimir = params.get('imprimir');

    if (imprimir === 'true') {
      // Esperamos que el DOM se cargue completamente antes de imprimir
      setTimeout(() => {
        const formContent = formRef.current;
        if (!formContent) return;

        const clonedForm = formContent.cloneNode(true);
        const inputs = clonedForm.querySelectorAll('input, select, textarea');
        inputs.forEach((input) => {
          const wrapper = document.createElement('div');
          wrapper.style.marginBottom = '8px';

          let valueToShow = '';
          if (input.type === 'checkbox') {
            valueToShow = input.checked ? 'Sí' : 'No';
          } else if (input.type === 'date') {
            if (input.value) {
              const date = new Date(input.value);
              valueToShow = date.toLocaleDateString('es-AR');
            }
          } else {
            valueToShow = input.value;
          }

          wrapper.textContent = valueToShow;
          input.parentNode.replaceChild(wrapper, input);
        });

        const ventana = window.open('', '', 'width=800,height=600');
  ventana.document.write(`
    <html>
      <head>
        <title>Hoja de datos driver</title>
        <style>
          body {
            font-family: sans-serif;
            font-size: 12px;
            padding: 20px;
          }
          fieldset {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            border: 1px solid #aaa;
            padding: 10px;
            margin: 10px;
          }
          div {
            display: flex;
            flex-direction: column;
            margin-bottom: 12px;
          }
          div span {
            font-weight: bold;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        ${clonedForm.innerHTML}
      </body>
    </html>
  `);
        ventana.document.close();
        ventana.focus();
        ventana.print();
        ventana.close();
      }, 1000); // esperás 1s para asegurar que el formulario se renderice
    }
}, [location]);

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

const handleSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, id: id };
    dispatch(updateCliente(body));
};
const handlePrint = () => {
  const formContent = formRef.current;
  if (!formContent) return;

  // Clonamos el formulario para no modificar el DOM real
  const clonedForm = formContent.cloneNode(true);

  // Convertimos inputs, selects y textareas en texto
  const inputs = clonedForm.querySelectorAll('input, select, textarea');

  inputs.forEach((input) => {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '8px';

    let valueToShow = '';

    if (input.type === 'checkbox') {
      valueToShow = input.checked ? 'Sí' : 'No';
    } else if (input.type === 'date') {
      // Formatear la fecha si tiene valor
      if (input.value) {
        const date = new Date(input.value);
        valueToShow = date.toLocaleDateString('es-AR'); // formato argentino
      }
    } else {
      valueToShow = input.value;
    }

    wrapper.textContent = valueToShow;
    input.parentNode.replaceChild(wrapper, input);
  });

  const ventana = window.open('', '', 'width=800,height=600');

  ventana.document.write(`
    <html>
      <head>
        <title>Hoja de datos driver</title>
        <style>
          body {
            font-family: sans-serif;
            font-size: 12px;
            padding: 20px;
          }
          fieldset {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            border: 1px solid #aaa;
            padding: 10px;
            margin: 10px;
          }
          div {
            display: flex;
            flex-direction: column;
            margin-bottom: 12px;
          }
          div span {
            font-weight: bold;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        ${clonedForm.innerHTML}
      </body>
    </html>
  `);

  ventana.document.close();
  ventana.focus();
  ventana.print();
  ventana.close();
};
const renderFecha = (fecha) => {
if(fecha){
  let splitFecha = fecha.split("-") 
  return splitFecha[0] + "-" + splitFecha[1]  + "-" + splitFecha[2]

}}
  return (
    <div>
      <div className={styles.container}>
        <ToastContainer />
        {isLoading && (
          <div className={styles.spinnerOverlay}>
            <ClipLoader size={60} color="#800020" loading={true} />
            <p className={styles.loadingText}>Actualizando cliente...</p>
          </div>
        )}
        <h2>Modificar datos del cliente</h2>
        <button
        type="button"
        style={{width: "6rem"}}
        className={styles.sendBtn}
        onClick={handlePrint}
        >
        Imprimir datero
        </button>
    <form ref={formRef} className={styles.form}>
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
        <span>Tél. alternativo</span>
        <input type="number"
        name='telefono_alternativo' value={form["telefono_alternativo"]}
        onChange={handleChange}/>
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
          <div className={styles.inputContainer}>
            <span>Composición familiar</span>
            <input type="text" name='composicion_familiar' value={form["composicion_familiar"]}
            onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Tiene o tuvo vehículo</span>
            <input type="text" name='tiene_o_tuvo_vehiculo' value={form["tiene_o_tuvo_vehiculo"]}
            onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Tipo de servicio a su nombre</span>
            <input type="text" name='tipo_servicio' value={form["tipo_servicio"]}
            onChange={handleChange} />
          </div>
          <div className={styles.inputContainer} style={{alignItems: "start"}}>
            <span>Certificado de domicilio</span>
            <input type="checkbox" name='certificado_domicilio' value={form["certificado_domicilio"]}
            onChange={handleCheckChange} checked={form.certificado_domicilio === 1}/>
          </div>
          <div className={styles.inputContainer}>
            <span>Score en veraz</span>
            <input type="text" name='score_veraz' value={form["score_veraz"]}
            onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Nivel de deuda</span>
            <input type="text" name='nivel_deuda' value={form["nivel_deuda"]}
            onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Situación</span>
            <input type="number" name='situacion_deuda' value={form["situacion_deuda"]}
            onChange={handleChange} />
          </div>
          <div className={styles.inputContainer} style={{alignItems: "start"}}>
            <span>Presenta libre de deuda</span>
            <input type="checkbox" name='libre_de_deuda' value={form["libre_de_deuda"]}
            onChange={handleCheckChange} checked={form.libre_de_deuda === 1}/>
          </div>
          <div className={styles.inputContainer} style={{alignItems: "start"}}>
            <span>Antecedentes penales</span>
            <input type="checkbox" name='antecedentes_penales' 
            value={form["antecedentes_penales"]}
            onChange={handleCheckChange} checked={form.antecedentes_penales === 1}/>
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
        onChange={handleChange} />
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
      </fieldset>
    </form>

        <button
          className={styles.sendBtn}
          onClick={handleSubmit}
          disabled={!formValido}
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default UpdateCliente;