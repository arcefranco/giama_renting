import React, {useState, useEffect, useMemo} from 'react'
import { useParams} from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import {getModelos} from '../../../reducers/Generales/generalesSlice.js'
import {getFormasDeCobro, reset, 
  postAlquiler,
  getAlquilerByIdContrato,
  getContratoById,
  reset_nro_recibo} from '../../../reducers/Alquileres/alquileresSlice.js'
import {getVehiculos} from '../../../reducers/Vehiculos/vehiculosSlice.js'
import {getClientes} from '../../../reducers/Clientes/clientesSlice.js'
import { ClipLoader } from "react-spinners";
import styles from "./AlquileresForm.module.css"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es"; 
import { parseISO } from 'date-fns';
import Select from 'react-select';
import { renderEstadoVehiculo } from '../../../utils/renderEstadoVehiculo.jsx';
import { toLocalDateOnly } from '../../../helpers/toLocalDateOnly.js';
import {useToastFeedback} from '../../../customHooks/useToastFeedback.jsx'
import {getReciboAlquilerById, resetAlquiler} from "../../../reducers/Recibos/recibosSlice.js"
import Swal from 'sweetalert2';

const AlquileresForm = ({ modoContrato = false, onSubmitFinal,
  minDateContrato, maxDateContrato }) => {
const dispatch = useDispatch()
const {idContrato} = useParams()
useEffect(() => {
Promise.all([
    dispatch(getVehiculos()),
    dispatch(getClientes()),
    dispatch(getModelos()),
    dispatch(getFormasDeCobro()),
    dispatch(getReciboAlquilerById({ id: 85 }))
])
if(idContrato){
  dispatch(getAlquilerByIdContrato({id: idContrato})),
  dispatch(getContratoById({id: idContrato}))
}
return () => {
  dispatch(reset_nro_recibo())
  dispatch(resetAlquiler())
  dispatch(reset())
}
}, [])
const {isError, isSuccess, isLoading, 
  message, formasDeCobro, alquilerByIdContrato, contratoById, nro_recibo_alquiler} = useSelector((state) => state.alquileresReducer)
const { html_recibo_alquiler } = useSelector((state) => state.recibosReducer);
const {vehiculos} = useSelector((state) => state.vehiculosReducer)
const {clientes} = useSelector((state) => state.clientesReducer)
const {modelos} = useSelector((state) => state.generalesReducer)
const {username} = useSelector((state) => state.loginReducer)
registerLocale("es", es);
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

const [fechaDesdePorDefecto, setFechaDesdePorDefecto] = useState(null)
const [fechaHastaPorDefecto, setFechaHastaPorDefecto] = useState(null) 
const [minDate, setMinDate] = useState(null)
const [maxDate, setMaxDate] = useState(null)
const [form, setForm] = useState({
    id_contrato: idContrato ? idContrato : "",
    ingresa_alquiler: 1,
    apellido_cliente: '',
    id_vehiculo: "",
    id_cliente: '',
    fecha_desde_alquiler: fechaDesdePorDefecto,
    fecha_hasta_alquiler: fechaHastaPorDefecto,
    importe_neto: '',
    importe_iva: '',
    importe_total: '',
    id_forma_cobro_alquiler: '',
    usuario: username,
    observacion: '',
    cuenta_contable_forma_cobro_alquiler: '',
    cuenta_secundaria_forma_cobro_alquiler: ''
})
if(!modoContrato){
  useToastFeedback({
    isError, 
    isSuccess,
    message,
    resetAction: reset,
    onSuccess: () => {
    Promise.all([
      dispatch(reset()),
      dispatch(getAlquilerByIdContrato({id: idContrato}))
    ])
    setForm({
    ...form,
    id_contrato: idContrato,
    importe_neto: '',
    ingresa_alquiler: 1,
    importe_iva: '',
    usuario: username,
    importe_total: '',
    id_forma_cobro_alquiler: '',
    cuenta_contable_forma_cobro_alquiler: ''
    })
    }
  })
}

useEffect(() => {
  if(alquilerByIdContrato?.length && contratoById?.length && !modoContrato){

      const fechaHastaMasGrande = alquilerByIdContrato.reduce((max, obj) => {
      const actual = new Date(obj.fecha_hasta);
      const maxDate = new Date(max);
      return actual > maxDate ? actual : maxDate;
    }, alquilerByIdContrato[0].fecha_hasta); //valor inicial del reduce
    const proxMiercoles = getNextWednesday(fechaHastaMasGrande)
    setFechaDesdePorDefecto(proxMiercoles)
    setFechaHastaPorDefecto(addDays(proxMiercoles, 6))
    setMinDate(parseISO(contratoById[0]["fecha_desde"]))
    /*el limite es el contrato y no las fechas segun 
    los alquileres previos del contrato por si hay un hueco de días */
    /*se parsean porque llegan en formato yyyy-mm-dd */
    setMaxDate(parseISO(contratoById[0]["fecha_hasta"]))
  }
  if(modoContrato && minDateContrato && maxDateContrato){
    /*seteamos el limite de fechas en modo contrato*/
    setMinDate(new Date(minDateContrato))
    setMaxDate(new Date(maxDateContrato))
    /*seteamos fechas por defecto en modo contrato */
    const proxMiercoles = getNextWednesday(minDateContrato)
    setForm({
      ...form,
      fecha_desde_alquiler: proxMiercoles,
      fecha_hasta_alquiler: addDays(proxMiercoles, 6)
    })
  }
  
}, [modoContrato, minDateContrato, maxDateContrato,
alquilerByIdContrato, contratoById])

useEffect(() => {
      setForm({
      ...form,
      fecha_desde_alquiler: fechaDesdePorDefecto,
      fecha_hasta_alquiler: fechaHastaPorDefecto
    })

}, [fechaDesdePorDefecto, fechaHastaPorDefecto])

useEffect(() => {
if(contratoById?.length && clientes?.length){
  setForm({
    ...form, 
    id_vehiculo: contratoById[0]["id_vehiculo"],
    id_cliente: contratoById[0]["id_cliente"],
    apellido_cliente: clientes?.find(e => e.id == contratoById[0]?.id_cliente)?.apellido
  })
}
}, [contratoById, clientes])

useEffect(() => {
  if (nro_recibo_alquiler && !modoContrato) {
    dispatch(getReciboAlquilerById({ id: nro_recibo_alquiler }));
  }
}, [nro_recibo_alquiler]);

useEffect(() => {
  if(html_recibo_alquiler && !modoContrato){
    Swal.fire({
      title: '¿Desea imprimir el recibo?',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      icon: 'warning',
      didOpen: () => {
        document.body.classList.remove('swal2-height-auto');
      }
    }).then((result) => {
    if (result.isConfirmed) {
  const win = window.open('', '_blank');
  win.document.write(html_recibo_alquiler);
  win.document.close();

  // Esperamos un poco para que cargue todo el HTML (incluida la imagen)
  setTimeout(() => {
    win.focus();
    win.print();

    // Opcional: cerrar automáticamente después de imprimir
    win.onafterprint = () => {
      win.close();
    };
  }, 500); // Ajustá el delay si fuera necesario
    }
    }).finally(() => {
      dispatch(resetAlquiler())
    });
  }
}, [html_recibo_alquiler])

const obtenerRangosOcupados = (alquileres) => //funcion para utilizar en el datepicker
  alquileres?.map(a => ({
    start: new Date(a.fecha_desde),
    end: addDays(new Date(a.fecha_hasta), 1),
}));

const opcionesVehiculos = vehiculos.filter(v => {return !v.fecha_venta}).map(e => {
  return {
    value: e.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <span>{e.dominio ? e.dominio : 
    e.dominio_provisorio ? e.dominio_provisorio : ""} - {modelos.find(m => m.id == e.modelo)?.nombre}</span>
        {renderEstadoVehiculo(e, "chico")}
      </div>
    )
  };
});
const customStyles = {
  container: (provided) => ({
    ...provided,
    width: '22rem'
  })
};
const handleChange = (e) => {
const { name, value } = e.target;
if(value && name === "importe_total"){
        setForm({
       ...form,
       [name]: parseFloat(value),
       "importe_iva": parseFloat(value) * 0.21,
       "importe_neto": parseFloat(value) - (parseFloat(value) * 0.21)
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
     "apellido_cliente": clientes?.find(e => e.id == value)?.apellido
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
      const formFixed = {
      ...form,
      fecha_desde_alquiler: toLocalDateOnly(form.fecha_desde_alquiler),
      fecha_hasta_alquiler: toLocalDateOnly(form.fecha_hasta_alquiler),
      }
      dispatch(postAlquiler(formFixed));
    }
} 


  return (
        <div className={styles.container}>
          {
            !modoContrato && <ToastContainer />
          }
             
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
                {
                  modoContrato && 
                  <div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  id="sinGarantia"
                  checked={form.ingresa_alquiler === 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ingresa_alquiler: e.target.checked ? 0 : 1,
                    })
                  }
                  />
                  <label htmlFor="sinGarantia" style={{ marginLeft: '0.5rem' }}>No ingresa semana adelantada de alquiler</label>
                  </div>
                  </div>
                  
                }
                <form action="" encType="multipart/form-data" className={`${form.ingresa_alquiler === 0 ? styles.disabledForm : ''}`}>
                {
                  !modoContrato &&
                  <div className={styles.form2Inputs}>
                  <div className={styles.inputContainer}>
                  <span>Vehículo</span>
                  <Select
                    options={opcionesVehiculos}
                    isDisabled={true}
                    value={
                      opcionesVehiculos.find(
                        (opt) => String(opt.value) === String(form.id_vehiculo)
                      ) || null
                    }
                    placeholder="Seleccione un vehículo"
                    styles={customStyles}
                  />
                </div>
                <div></div>
                
                <div className={styles.inputWrapper} >
                  <span>Clientes</span>
                  <div className={styles.selectWithIcon} style={{
                    width: "20rem"
                  }}>
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
                </div>
                }
                <div className={styles.formNormal}>

                <div className={styles.inputContainer}>
                    <span>Fecha desde</span>
                    <DatePicker
                      dateFormat="dd/MM/yyyy"
                      selected={form.fecha_desde_alquiler}
                      onChange={(date) => setForm(prev => ({ ...prev, fecha_desde_alquiler: date }))}
                      excludeDateIntervals={!modoContrato ? 
                        obtenerRangosOcupados(alquilerByIdContrato) : null} /* si extendemos el alquiler, 
                        no permitimos que se elijan fechas ya elegidas */
                      minDate={minDate}
                      maxDate={maxDate}
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
                      excludeDateIntervals={!modoContrato ? 
                        obtenerRangosOcupados(alquilerByIdContrato) : null} /* si extendemos el alquiler, 
                        no permitimos que se elijan fechas ya elegidas */
                      minDate={minDate}
                      maxDate={maxDate}
                      placeholderText="Seleccione una fecha"
                      locale="es"
                    />
                </div>
                <div className={styles.inputContainer}>
                    <span>Importe total</span>
                    <input type="number" name='importe_total'  value={form["importe_total"]} 
                  onChange={handleChange}/>
                </div>
                <div className={styles.inputContainer}>
                    <span>Importe neto</span>
                    <input type="number" name='importe_neto' disabled value={form["importe_neto"]} 
                  onChange={handleChange}/>
                </div>
                <div className={styles.inputContainer}>
                    <span>IVA</span>
                    <input type="number" name='importe_iva' disabled value={form["importe_iva"]} 
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