import React, {useState, useEffect, useMemo} from 'react'
import { useParams} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import {getModelos} from '../../../reducers/Generales/generalesSlice.js'
import {getFormasDeCobro, reset, 
  postAlquiler, getAlquileresByIdVehiculo, getContratosByIdVehiculo} from '../../../reducers/Alquileres/alquileresSlice.js'
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

const AlquileresForm = ({ modoContrato = false, onSubmitFinal, idVehiculoSeleccionado }) => {
const dispatch = useDispatch()
const {id} = useParams()
const {isError, isSuccess, isLoading, 
  message, formasDeCobro, alquileresVehiculo , contratosVehiculo} = useSelector((state) => state.alquileresReducer)
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
const getNextWednesday = (fromDate) => {
  const date = new Date(fromDate);
  const day = date.getDay();
  const diff = (3 - day + 7) % 7; // 3 = miércoles
  if (diff === 0) return date;
  date.setDate(date.getDate() + diff);
  return date;
};

// Suma N días a una fecha
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const fechaDesdePorDefecto = getNextWednesday(hoy);
const fechaHastaPorDefecto = addDays(fechaDesdePorDefecto, 6);
const [form, setForm] = useState({
    apellido_cliente: '',
    id_vehiculo: id ? id : "",
    id_cliente: '',
    fecha_desde_alquiler: fechaDesdePorDefecto,
    fecha_hasta_alquiler: fechaHastaPorDefecto,
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    id_forma_cobro_alquiler: '',
    observacion: '',
    cuenta_contable_forma_cobro_alquiler: '',
    cuenta_secundaria_forma_cobro_alquiler: ''
})
const [alquileresVigentes, setAlquileresVigentes] = useState([])
const [contratosVigentes, setContratosVigentes] = useState([])
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
        fecha_desde_alquiler: '',
        fecha_hasta_alquiler: '',
        importe_neto: '',
        importe_iva: '',
        importe_total: '',
        id_forma_cobro_alquiler: '',
        cuenta_contable_forma_cobro_alquiler: ''
        })
    }

}, [isError, isSuccess]) 

useEffect(() => { //obtengo alquileres del vehiculo seleccionado
if([form["id_vehiculo"]]){
  dispatch(getAlquileresByIdVehiculo({id: form["id_vehiculo"]}))
}
}, [form["id_vehiculo"]])
useEffect(() => { //obtengo contratos del vehiculo seleccionado (en modoContrato)
if(modoContrato && idVehiculoSeleccionado){
  dispatch(getContratosByIdVehiculo({id: idVehiculoSeleccionado}))
}
}, [idVehiculoSeleccionado])

useEffect(() => { //fechas por defecto en modoContrato
if (modoContrato && contratosVigentes?.length) {
const contratoMasLargo = contratosVigentes.reduce((max, actual) => { //ultima reserva
  const fechaMax = new Date(max.fecha_hasta);
  const fechaActual = new Date(actual.fecha_hasta);
  return fechaActual > fechaMax ? actual : max;
});
const fechaDesde = getNextWednesday(new Date(contratoMasLargo.fecha_hasta));
const fechaHasta = addDays(fechaDesde, 6); // duración semanal
    setForm((prev) => ({
      ...prev,
      fecha_desde_alquiler: fechaDesde,
      fecha_hasta_alquiler: fechaHasta,
    }));
  }
}, [modoContrato, contratosVigentes]);

useEffect(() => { //filtro el array contratosVigentes con contratosVehiculo obtenido a la fecha de hoy
  setContratosVigentes(contratosVehiculo?.filter(a => new Date(a.fecha_hasta) >= hoy))
}, [contratosVehiculo])

useEffect(() => { //filtro el array obtenido a la fecha de hoy
  setAlquileresVigentes(alquileresVehiculo.filter(a => new Date(a.fecha_hasta) >= hoy))
}, [alquileresVehiculo])

const obtenerRangosOcupados = (alquileres) => //funcion para utilizar en el datepicker
  alquileres?.map(a => ({
    start: new Date(a.fecha_desde),
    end: addDays(new Date(a.fecha_hasta), 1),
}));
const opcionesVehiculos = vehiculos.filter(v => {return !v.fecha_venta}).map(e => {
  const alquiladoHoy = e.vehiculo_alquilado


  let estado;
  if (alquiladoHoy) {
    estado = <span className={styles.spanAlquilado}>Alquilado</span>;
  } else if (e.estado_actual == 2) {
    estado = <span className={styles.spanPreparado}>Listo para alquilar</span>;
  } else if (e.estado_actual == 1) {
    estado = <span className={styles.spanNoPreparado}>Sin preparar</span>;
  }
  else if (e.estado_actual == 3) {
    estado = <span className={styles.spanReparacion}>En reparacion</span>;
  }
  else if (e.estado_actual == 4) {
    estado = <span className={styles.spanSeguro}>Seguro a recuperar</span>;
  }
  
  
  

  return {
    value: e.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <span>{e.dominio ? e.dominio : 
    e.dominio_provisorio ? e.dominio_provisorio : ""} - {modelos.find(m => m.id == e.modelo)?.nombre}</span>
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
else if(value && name === "id_forma_cobro_alquiler"){
      setForm({
     ...form,
     [name]: value,
     "cuenta_contable_forma_cobro_alquiler": formasDeCobro?.find(e => e.id == value)?.cuenta_contable,
     "cuenta_secundaria_forma_cobro_alquiler": formasDeCobro?.find(e => e.id == value)?.cuenta_secundaria
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
    if (modoContrato) {
      onSubmitFinal(form); 
    } else {
      dispatch(postAlquiler(form));
    }
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
                {
                modoContrato ? 
                <h2>Semana adelantada de alquiler</h2> : 
                <h2>Alta de alquiler</h2>
                }
                <form action="" enctype="multipart/form-data" className={styles.form}>
                {
                  !modoContrato &&
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
                        fecha_desde_alquiler: "",
                        fecha_hasta_alquiler: "",
                      }));
                    }}
                    placeholder="Seleccione un vehículo"
                    styles={customStyles}
                  />
                </div>
                }
                {
                  !modoContrato &&
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
                }
                <div className={styles.inputContainer}>
                    <span>Fecha desde</span>
                    <DatePicker
                      dateFormat="dd/MM/yyyy"
                      selected={form.fecha_desde_alquiler}
                      onChange={(date) => setForm(prev => ({ ...prev, fecha_desde_alquiler: date }))}
                      excludeDateIntervals={obtenerRangosOcupados([...alquileresVigentes, ...contratosVigentes])}
                      minDate={getToday()}
                      placeholderText="Seleccione una fecha"
                      locale="es"
                    />
                </div>
                <div className={styles.inputContainer}>
                    <span>Fecha hasta</span>
                    <DatePicker
                      dateFormat="dd/MM/yyyy"
                      selected={form.fecha_hasta_alquiler}
                      onChange={(date) => setForm(prev => ({ ...prev, fecha_hasta_alquiler: date }))}
                      excludeDateIntervals={obtenerRangosOcupados([...alquileresVigentes, ...contratosVigentes])}
                      minDate={form.fecha_desde_alquiler || getToday()}
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
                  <select name="id_forma_cobro_alquiler"  value={form["id_forma_cobro_alquiler"]} 
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
                  onChange={handleChange}/>
                </div>
                </form>
                {
                modoContrato ?
                <button 
                className={styles.sendBtn} onClick={handleSubmit} 
                disabled={
                    !form["fecha_desde_alquiler"] || !form["fecha_hasta_alquiler"] ||
                    !form["importe_neto"] || !form["importe_iva"] ||
                    !form["importe_total"] || !form["id_forma_cobro_alquiler"]}>
                  Enviar
                </button>
                :
                <button 
                className={styles.sendBtn} onClick={handleSubmit} 
                disabled={!form["id_vehiculo"] || !form["id_cliente"] ||
                    !form["fecha_desde_alquiler"] || !form["fecha_hasta_alquiler"] ||
                    !form["importe_neto"] || !form["importe_iva"] ||
                    !form["importe_total"] || !form["id_forma_cobro_alquiler"]}>
                  Enviar
                </button>

                }
        </div>
  )
}

export default AlquileresForm