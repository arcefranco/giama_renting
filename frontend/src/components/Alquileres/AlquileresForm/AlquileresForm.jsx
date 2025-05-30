import React, {useState, useEffect, useMemo} from 'react'
import { useParams} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import {getModelos} from '../../../reducers/Generales/generalesSlice.js'
import {getFormasDeCobro, reset, 
  postAlquiler, getAlquileresByIdVehiculo} from '../../../reducers/Alquileres/alquileresSlice.js'
import {getVehiculos} from '../../../reducers/Vehiculos/vehiculosSlice.js'
import {getClientes} from '../../../reducers/Clientes/clientesSlice.js'
import { ClipLoader } from "react-spinners";
import styles from "./AlquileresForm.module.css"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es"; 
import { addDays } from 'date-fns';
import Select from 'react-select';
import add from '../../../assets/add.png'

const AlquileresForm = () => {
const dispatch = useDispatch()
const {id} = useParams()
const {isError, isSuccess, isLoading, 
  message, formasDeCobro, alquileresVehiculo} = useSelector((state) => state.alquileresReducer)
const {vehiculos} = useSelector((state) => state.vehiculosReducer)
const {clientes} = useSelector((state) => state.clientesReducer)
const {modelos} = useSelector((state) => state.generalesReducer)
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // elimina horas
  return today;
};
registerLocale("es", es);
const hoy = getToday();
const [form, setForm] = useState({
    apellido_cliente: '',
    id_vehiculo: id ? id : "",
    id_cliente: '',
    fecha_desde: '',
    fecha_hasta: '',
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    id_forma_cobro: '',
    cuenta_contable_forma_cobro: '',
    cuenta_secundaria_forma_cobro: ''
})
const [alquileresVigentes, setAlquileresVigentes] = useState(null)
useEffect(() => {
Promise.all([
    dispatch(getVehiculos()),
    dispatch(getClientes()),
    dispatch(getModelos()),
    dispatch(getFormasDeCobro())
])
}, [])
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
        setForm({
        id_vehiculo: '',
        id_cliente: '',
        fecha_desde: '',
        fecha_hasta: '',
        importe_neto: '',
        importe_iva: '',
        importe_total: '',
        id_forma_cobro: '',
        cuenta_contable_forma_cobro: ''
        })
    }

}, [isError, isSuccess]) 

useEffect(() => { //obtengo alquileres del vehiculo seleccionado
if([form["id_vehiculo"]]){
  dispatch(getAlquileresByIdVehiculo({id: form["id_vehiculo"]}))
}
}, [form["id_vehiculo"]])

useEffect(() => { //filtro el array obtenido a la fecha de hoy
  setAlquileresVigentes(alquileresVehiculo.filter(a => new Date(a.fecha_hasta) >= hoy))
}, [alquileresVehiculo])

const obtenerRangosOcupados = (alquileres) => //funcion para utilizar en el datepicker
  alquileres?.map(a => ({
    start: new Date(a.fecha_desde),
    end: addDays(new Date(a.fecha_hasta), 1),
}));
const opcionesVehiculos = vehiculos.filter(v => {return !v.fecha_venta}).map(e => {
  const preparado = e.proveedor_gps && e.nro_serie_gps && e.calcomania && e.gnc;
  const alquiladoHoy = e.vehiculo_alquilado


  let estado;
  if (alquiladoHoy) {
    estado = <span className={styles.spanAlquilado}>Alquilado</span>;
  } else if (preparado && !alquiladoHoy) {
    estado = <span className={styles.spanPreparado}>Preparado</span>;
  } else {
    estado = <span className={styles.spanNoPreparado}>Sin preparar</span>;
  }

  return {
    value: e.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <span>{e.dominio} - {modelos.find(m => m.id == e.modelo)?.nombre}</span>
        {estado}
      </div>
    )
  };
});

const customStyles = {
  container: (provided) => ({
    ...provided,
    width: '16rem'
  })
};
const handleChange = (e) => {
const { name, value } = e.target;
if(value && name === "importe_neto"){
        setForm({
       ...form,
       [name]: parseFloat(value),
       "importe_iva": parseFloat(value) * 0.21,
       "importe_total": (parseFloat(value) * 0.21) + parseFloat(value)
     }); 
  }
else if(value && name === "importe_iva"){
      setForm({
     ...form,
     [name]: value,
     "importe_total": parseFloat(value) + parseFloat(form["importe_neto"])
   }); 
}
else if(value && name === "id_forma_cobro"){
      setForm({
     ...form,
     [name]: value,
     "cuenta_contable_forma_cobro": formasDeCobro.find(e => e.id == value)?.cuenta_contable,
     "cuenta_secundaria_forma_cobro": formasDeCobro.find(e => e.id == value)?.cuenta_secundaria
   }); 
}
else if(value && name === "id_cliente"){
      setForm({
     ...form,
     [name]: value,
     "apellido_cliente": clientes.find(e => e.id == value)?.apellido
   }); 
}
else{
    setForm({
     ...form,
     [name]: value,
   }); 

}
}
const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postAlquiler(form))
} 
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
            <p className={styles.loadingText}>Cargando...</p>
          </div>
        )}
                <h2>Alta de alquiler</h2>
                <form action="" enctype="multipart/form-data" className={styles.form}>
                <div className={styles.inputContainer}>
                  <span>Vehículo</span>
                  <Select
                    options={opcionesVehiculos}
                    isDisabled={id ? true : false}
                    value={ id ?
                      opcionesVehiculos.find(
                        (opt) => String(opt.value) === id
                      ) : 
                      opcionesVehiculos.find(
                        (opt) => String(opt.value) === String(form.id_vehiculo)
                      ) || null
                    }
                    onChange={(option) => {
                      setForm((prevForm) => ({
                        ...prevForm,
                        id_vehiculo: option?.value || "",
                        fecha_desde: "",
                        fecha_hasta: "",
                      }));
                    }}
                    placeholder="Seleccione un vehículo"
                    styles={customStyles}
                  />
                </div>
                <div className={styles.inputWrapper}>
                  <span>Clientes</span>
                  <div className={styles.selectWithIcon}>
                    <select name="id_cliente" value={form["id_cliente"]} onChange={handleChange}>
                      <option value={""} disabled selected>{"Seleccione un cliente"}</option>
                      {
                        clientes?.length && clientes.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.nro_documento} - {e.nombre} {e.apellido}
                          </option>
                        ))
                      }
                    </select>
                    <img
                      src={add}
                      alt="Añadir cliente"
                      className={styles.addIcon}
                      onClick={() => window.open('/clientes', '_blank')}
                    />
                  </div>
                </div>
                <div className={styles.inputContainer}>
                    <span>Fecha desde</span>
                    <DatePicker
                      dateFormat="dd/MM/yyyy"
                      selected={form.fecha_desde}
                      onChange={(date) => setForm(prev => ({ ...prev, fecha_desde: date }))}
                      excludeDateIntervals={obtenerRangosOcupados(alquileresVigentes)}
                      minDate={getToday()}
                      placeholderText="Seleccione una fecha"
                      locale="es"
                    />
                </div>
                <div className={styles.inputContainer}>
                    <span>Fecha hasta</span>
                    <DatePicker
                      dateFormat="dd/MM/yyyy"
                      selected={form.fecha_hasta}
                      onChange={(date) => setForm(prev => ({ ...prev, fecha_hasta: date }))}
                      excludeDateIntervals={obtenerRangosOcupados(alquileresVigentes)}
                      minDate={form.fecha_desde || getToday()}
                      placeholderText="Seleccione una fecha"
                      locale="es"
                    />
                </div>
                <div className={styles.inputContainer}>
                    <span>Importe neto</span>
                    <input type="number" name='importe_neto' value={form["importe_neto"]} 
                  onChange={handleChange}/>
                </div>
                <div className={styles.inputContainer}>
                    <span>IVA</span>
                    <input type="number" name='importe_iva' value={form["importe_iva"]} 
                  onChange={handleChange}/>
                </div>
                <div className={styles.inputContainer}>
                    <span>Importe total</span>
                    <input type="number" name='importe_total' disabled value={form["importe_total"]} 
                  onChange={handleChange}/>
                </div>
                <div className={styles.inputContainer}>
                  <span>Formas de cobro</span>
                  <select name="id_forma_cobro"  value={form["id_forma_cobro"]} 
                  onChange={handleChange} id="">
                    <option value={""} disabled selected>{"Seleccione una opción"}</option>
                    {
                      formasDeCobro?.length && formasDeCobro?.map(e => {
                        return <option key={e.id} value={e.id}>{e.nombre}</option>
                      })
                    }
                  </select>
                </div>
                </form>
                <button 
                className={styles.sendBtn} onClick={handleSubmit} 
                disabled={!form["id_vehiculo"] || !form["id_cliente"] ||
                    !form["fecha_desde"] || !form["fecha_hasta"] ||
                    !form["importe_neto"] || !form["importe_iva"] ||
                    !form["importe_total"] || !form["id_forma_cobro"]}>
                  Enviar
                </button>
        </div>
  )
}

export default AlquileresForm