import React, {useEffect, useState} from 'react'
import { useParams } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { getAlquilerById, getFormasDeCobro, reset, anulacionAlquiler, getAnulaciones } from '../../../reducers/Alquileres/alquileresSlice';
import { ToastContainer, toast } from 'react-toastify';
import {getModelos} from '../../../reducers/Generales/generalesSlice.js'
import {getVehiculos} from '../../../reducers/Vehiculos/vehiculosSlice.js'
import {getClientes} from '../../../reducers/Clientes/clientesSlice.js'
import { ClipLoader } from "react-spinners";
import styles from "./UpdateAlquiler.module.css"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es"; 
import Select from 'react-select';
import add from '../../../assets/add.png'
import { countDates } from '../../../helpers/countDates.js';
import { redondear } from '../../../helpers/redondear.js';


const UpdateAlquiler = () => {
const dispatch = useDispatch();
const {id} = useParams();
useEffect(() => {
  Promise.all([
    dispatch(getAlquilerById({id: id})),
    dispatch(getAnulaciones({id_alquiler: id}))
  ])

}, [id])
useEffect(() => {
Promise.all([
    dispatch(getVehiculos()),
    dispatch(getClientes()),
    dispatch(getModelos()),
    dispatch(getFormasDeCobro())
])
}, [])
const {isError, isSuccess, isLoading, 
  message, formasDeCobro, alquilerById, anulaciones} = useSelector((state) => state.alquileresReducer)
const {vehiculos} = useSelector((state) => state.vehiculosReducer)
const {clientes} = useSelector((state) => state.clientesReducer)
const {modelos} = useSelector((state) => state.generalesReducer)
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // elimina horas
  return today;
};
registerLocale("es", es);
const [form, setForm] = useState({
    id_vehiculo: "",
    id_cliente: '',
    fecha_desde: '',
    fecha_hasta: '',
    fecha_hasta_actual: '',
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    id_forma_cobro: '',
})
const parseDate = (str) => {
  const [year, month, day] = str.split("-");
  return new Date(+year, +month - 1, +day);
};
const [hoy, setHoy] = useState(getToday())
const [cantidadDias, setCantidadDias] = useState(null)
const [cantidadDiasActual, setCantidadDiasActual] = useState(null)
const [diferenciaDias, setDiferenciaDias] = useState(null)
const [valorDiaNeto, setValorDiaNeto] = useState(null)
const [valorDiaIVA, setValorDiaIVA] = useState(null)
const [valorNetoAnulado, setValorNetoAnulado] = useState(null)
const [valorAnuladoIVA, setValorAnuladoIVA] = useState(null)

useEffect(() => {
if(alquilerById.length){
    setForm({
        ...form,
        id_vehiculo: alquilerById[0]["id_vehiculo"],
        id_cliente: alquilerById[0]["id_cliente"],
        fecha_desde: parseDate(alquilerById[0]["fecha_desde"]),
        fecha_hasta: parseDate(alquilerById[0]["fecha_hasta"]),
        fecha_hasta_actual: parseDate(alquilerById[0]["fecha_hasta"]),
        importe_neto: alquilerById[0]["importe_neto"],
        importe_iva: alquilerById[0]["importe_iva"],
        importe_total: alquilerById[0]["importe_total"],
        id_forma_cobro: alquilerById[0]["id_forma_cobro"]
    })

    setCantidadDias(countDates(parseDate(alquilerById[0]["fecha_desde"]), parseDate(alquilerById[0]["fecha_hasta"])))
    setCantidadDiasActual(countDates(parseDate(alquilerById[0]["fecha_desde"]), parseDate(alquilerById[0]["fecha_hasta"])))
}
}, [alquilerById])

const getMinDate = () => {
  const desde = form.fecha_desde instanceof Date ? form.fecha_desde : new Date(form.fecha_desde);
  return hoy > desde ? hoy : desde;
};

const getMaxDate = () => {
  if (anulaciones.length > 0) {
    const fechasDesde = anulaciones?.map(a => new Date(a.fecha_desde));
    const menorFechaDesde = new Date(Math.min(...fechasDesde));
    return menorFechaDesde;
  }
  return form.fecha_hasta instanceof Date ? form.fecha_hasta : new Date(form.fecha_hasta);
};

useEffect(() => {
  if(anulaciones?.length && alquilerById?.length){
    setForm({
      ...form,
      fecha_hasta: getMaxDate()
    })
    setCantidadDias(countDates(parseDate(alquilerById[0]["fecha_desde"]), getMaxDate()))
  }

}, [anulaciones, alquilerById])

useEffect(() => {
setDiferenciaDias(cantidadDias - cantidadDiasActual)
}, [cantidadDias, cantidadDiasActual])

useEffect(() => {
if(alquilerById.length && cantidadDias){
    setValorDiaNeto(redondear(alquilerById[0]["importe_neto"] / cantidadDias))
    setValorDiaIVA(redondear(alquilerById[0]["importe_iva"] / cantidadDias))
}
}, [cantidadDias, alquilerById])

useEffect(() => {
setValorNetoAnulado(valorDiaNeto * diferenciaDias)
setValorAnuladoIVA(valorDiaIVA * diferenciaDias)
}, [valorDiaNeto, valorDiaIVA, diferenciaDias])

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

const opcionesVehiculos = vehiculos?.filter(v => {return !v.fecha_venta}).map(e => {
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
    width: '16rem',
    fontSize: "11px"
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
else{
    setForm({
     ...form,
     [name]: value,
   }); 

}
}
const handleSubmit = async (e) => {
    e.preventDefault();
    if(alquilerById.length && valorNetoAnulado > 0){
        dispatch(anulacionAlquiler(
        {
        id_alquiler: alquilerById[0]["id"],
        id_vehiculo: alquilerById[0]["id_vehiculo"],
        id_cliente: alquilerById[0]["id_cliente"],
        fecha_hasta_actual: form["fecha_hasta_actual"],
        fecha_hasta_anterior: alquilerById[0]["fecha_hasta"],
        observacion: form["observacion"],
        importe_neto: valorNetoAnulado,
        importe_iva: valorAnuladoIVA,
        importe_total: valorNetoAnulado + valorAnuladoIVA,
        id_forma_cobro: alquilerById[0]["id_forma_cobro"]
        }
        ))
    }else{
    alert("Faltan datos para enviar el formulario")
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
                <h2>Modificación de alquiler</h2>
                <form action="" enctype="multipart/form-data" className={styles.form}>
                <div className={styles.inputContainer}>
                  <span>Vehículo</span>
                  <Select
                    options={opcionesVehiculos}
                    
                    isDisabled={id ? true : false}
                    value={
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
                    <select name="id_cliente" value={form["id_cliente"]} disabled>
                      <option value={""} disabled selected>{"Seleccione un cliente"}</option>
                      {
                        clientes?.length && clientes.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.nro_documento} - {e.nombre} {e.apellido}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                </div>
                <div className={styles.inputContainer}>
                    <span>Fecha desde</span>
                    <DatePicker
                      dateFormat="dd/MM/yyyy"
                      disabled
                      selected={form.fecha_desde}
                      minDate={getToday()}
                      placeholderText="Seleccione una fecha"
                      locale="es"
                    />
                </div>
                <div className={styles.inputContainer}>
                    <span>Fecha hasta</span>
                    <DatePicker
                      dateFormat="dd/MM/yyyy"
                      selected={form.fecha_hasta_actual}
                      onChange={(date) =>
                        {
                        console.log("this is date: ", date) 
                        setForm(prev => ({ ...prev, fecha_hasta_actual: date }))
                        setCantidadDiasActual(countDates(form["fecha_desde"], date) - 1)
                        }
                    }
                      minDate={getMinDate()}
                      maxDate={getMaxDate()}
                      placeholderText="Seleccione una fecha"
                      locale="es"
                    />
                </div>
                <div className={styles.inputContainer}>
                    <span>Importe neto</span>
                    <input type="number" name='importe_neto' value={form["importe_neto"]} 
                  onChange={handleChange} disabled/>
                </div>
                <div className={styles.inputContainer}>
                    <span>IVA</span>
                    <input type="number" name='importe_iva' value={form["importe_iva"]} 
                  onChange={handleChange} disabled/>
                </div>
                <div className={styles.inputContainer}>
                    <span>Importe total</span>
                    <input type="number" name='importe_total' disabled value={form["importe_total"]} 
                  onChange={handleChange}/>
                </div>
                <div className={styles.inputContainer}>
                  <span>Formas de cobro</span>
                  <select name="id_forma_cobro"  value={form["id_forma_cobro"]} 
                  disabled id="">
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

export default UpdateAlquiler