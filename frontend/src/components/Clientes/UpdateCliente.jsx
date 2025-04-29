import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {getProvincias, getTiposDocumento, getTiposResponsable} from '../../reducers/Generales/generalesSlice'
import { getClientesById, updateCliente, reset } from '../../reducers/Clientes/clientesSlice';
import styles from './UpdateCliente.module.css';
import { paises } from '../../paises.js';
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";

const UpdateCliente = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { provincias, tipos_documento, tipos_responsable } = useSelector(state => state.generalesReducer);
  const { cliente, isError, isSuccess, isLoading, message } = useSelector(state => state.clientesReducer);
  const [errors, setErrors] = useState({});
  const [formValido, setFormValido] = useState(false);
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
  const renderFecha = (fecha) => {
    if(fecha){
      let splitFecha = fecha.split("-") 
      return splitFecha[0] + "-" + splitFecha[1]  + "-" + splitFecha[2]

    }
  }

  useEffect(() => {
    dispatch(getProvincias());
    dispatch(getTiposResponsable());
    dispatch(getTiposDocumento()),
    dispatch(getClientesById({id: id}));
  }, [id]);

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
        ciudad: cliente[0]?.ciudad || '',
        mail: cliente[0]?.mail || '',
        notas: cliente[0]?.notas ||'',
      });
    }
  }, [cliente]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess) {
      toast.success(message);
      dispatch(reset());
    }
  }, [isError, isSuccess]);
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
      form["mail"] !== '' 

    setFormValido(isButtonEnabled && camposObligatoriosCompletos);
  }, [form]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, id: id };
    dispatch(updateCliente(body));
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
      celular: '',
      ciudad: '',
      mail: '',
      notas:'',
      })
  };
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