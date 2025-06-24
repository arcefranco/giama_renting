import React, {useState, useEffect} from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams} from 'react-router-dom';
import AlquileresForm from "../AlquileresForm/AlquileresForm.jsx";
import { postContratoAlquiler, getFormasDeCobro, getContratosByIdVehiculo, 
  getContratoById, anulacionContrato, reset } from "../../../reducers/Alquileres/alquileresSlice.js";
import { getVehiculos } from "../../../reducers/Vehiculos/vehiculosSlice.js";
import { getModelos } from "../../../reducers/Generales/generalesSlice.js";
import { getClientes } from "../../../reducers/Clientes/clientesSlice.js";
import styles from "../AlquileresForm/AlquileresForm.module.css"
import DatePicker from "react-datepicker";
import Select from 'react-select';
import add from '../../../assets/add.png'
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es"; 
import { parseISO } from "date-fns";

const ContratoAlquiler = () => {

const dispatch = useDispatch();
const {id} = useParams()
registerLocale("es", es);
useEffect(() => {
  Promise.all([
    dispatch(getFormasDeCobro()),
    dispatch(getVehiculos()),
    dispatch(getModelos()),
    dispatch(getClientes())

  ])
  if(id){
    dispatch(getContratoById({id: id}))
  }
}, [])
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // elimina horas
  return today;
};
const hoy = getToday();
// Devuelve el miércoles más próximo desde hoy (inclusive si hoy es miércoles)
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
const fechaHastaPorDefecto = addDays(fechaDesdePorDefecto, 90); //son 13 semanas, 91 dias
const {isError, isSuccess, isLoading, 
  message, formasDeCobro, contratosVehiculo, contratoById } = useSelector((state) => state.alquileresReducer)
const [contratosVigentes, setContratosVigentes] = useState(null)
const [formContrato, setFormContrato] = useState({
    id_vehiculo: '',
    id_cliente: '',
    deposito: '',
    id_forma_cobro_contrato: '',
    fecha_desde_contrato: id ? "" : fechaDesdePorDefecto,
    fecha_hasta_contrato: id ? "" : fechaHastaPorDefecto,
    cuenta_contable_forma_cobro_contrato: '',
    cuenta_secundaria_forma_cobro_contrato: '',
});
const [minDate, setMinDate] = useState(getToday())
const [maxDate, setMaxDate] = useState(null)
const {vehiculos} = useSelector((state) => state.vehiculosReducer)
const {clientes} = useSelector((state) => state.clientesReducer)
const {modelos} = useSelector((state) => state.generalesReducer)

useEffect(() => {
  if(id){
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
      }

  }

}, [isError, isSuccess]) 

useEffect(() => {
if (id && contratoById.length) {
    const fechaDesde = parseISO(contratoById[0]["fecha_desde"]);
    const fechaHasta = parseISO(contratoById[0]["fecha_hasta"]);

    // Corregir desfase de zona horaria
    fechaDesde.setHours(0, 0, 0, 0);
    fechaHasta.setHours(0, 0, 0, 0);

    setFormContrato({
      id_vehiculo: contratoById[0]["id_vehiculo"],
      id_cliente: contratoById[0]["id_cliente"],
      deposito: contratoById[0]["deposito_garantia"],
      id_forma_cobro_contrato: contratoById[0]["id_forma_cobro"],
      fecha_desde_contrato: fechaDesde,
      fecha_hasta_contrato: fechaHasta
    });
const fechaDesdePickers = parseISO(contratoById[0]["fecha_desde"]);
const fechaHastaPickers = parseISO(contratoById[0]["fecha_hasta"]);

fechaDesdePickers.setHours(3, 0, 0, 0);
fechaHastaPickers.setHours(0, 0, 0, 0);

setMinDate(fechaDesdePickers);
setMaxDate(fechaHastaPickers);
console.log(fechaDesdePickers)
console.log(fechaHastaPickers)
}else{
  setFormContrato({
    id_vehiculo: '',
    id_cliente: '',
    deposito: '',
    id_forma_cobro_contrato: '',
    fecha_desde_contrato: fechaDesdePorDefecto,
    fecha_hasta_contrato: fechaHastaPorDefecto,
    cuenta_contable_forma_cobro_contrato: '',
    cuenta_secundaria_forma_cobro_contrato: '',
})
setMinDate(getToday())
setMaxDate(null)
}
}, [contratoById, id]);

useEffect(() => { //filtro el array contratosVigentes con contratosVehiculo obtenido a la fecha de hoy
  setContratosVigentes(contratosVehiculo?.filter(a => new Date(a.fecha_hasta) >= hoy))
}, [contratosVehiculo])
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
const handleChangeContrato = (e) => {
    const { name, value } = e.target;
    if(value && name === "id_forma_cobro_contrato"){
      setFormContrato({
     ...formContrato,
     [name]: value,
     "cuenta_contable_forma_cobro_contrato": formasDeCobro?.find(e => e.id == value)?.cuenta_contable,
     "cuenta_secundaria_forma_cobro_contrato": formasDeCobro?.find(e => e.id == value)?.cuenta_secundaria
   }); 
}
else if(value && name === "id_cliente"){
      setFormContrato({
     ...formContrato,
     [name]: value,
     "apellido_cliente": clientes.find(e => e.id == value)?.apellido
   }); 
} else{
  setFormContrato((prev) => ({ ...prev, [name]: value }));
  
}
};
useEffect(() => { //obtengo contratos del vehiculo seleccionado
if([formContrato["id_vehiculo"]]){
  dispatch(getContratosByIdVehiculo({id: formContrato["id_vehiculo"]}))
}
}, [formContrato["id_vehiculo"]])

useEffect(() => { /* evalua el rango de fechas ocupado por algún contrato previo del vehículo */
  if (!formContrato.id_vehiculo || !contratosVehiculo?.length) return;

  // Filtrar solo contratos del vehículo actual
  const contratosDelVehiculo = contratosVehiculo.filter(
    (c) => c.id_vehiculo === formContrato.id_vehiculo
  );

  // Buscar la fecha_hasta más lejana de los contratos vigentes
  const ultimaFechaHasta = contratosDelVehiculo.length
    ? new Date(
        Math.max(
          ...contratosDelVehiculo.map((c) => new Date(c.fecha_hasta).getTime())
        )
      )
    : hoy;

  // Obtener miércoles siguiente a esa fecha
  const siguienteMiercoles = getNextWednesday(addDays(ultimaFechaHasta, 1));

  // Calcular fecha hasta (90 días desde el miércoles)
  const hasta = addDays(siguienteMiercoles, 90);

  // Actualizar el estado
  if(!id){
    setFormContrato((prevForm) => ({
      ...prevForm,
      fecha_desde_contrato: siguienteMiercoles,
      fecha_hasta_contrato: hasta,
    }));

  }
}, [formContrato.id_vehiculo, contratosVehiculo]);

const obtenerRangosOcupados = (alquileres) =>
  alquileres
    ?.filter((a) => {
      if (id) {
        return String(a.id) !== String(id);
      }
      return true;
    })
    .map((a) => ({
      start: new Date(a.fecha_desde),
      end: addDays(new Date(a.fecha_hasta), 1), // incluir fecha final
}));

const handleFinalSubmit = (formAlquiler) => {
  const payload = {
    ...formAlquiler,
    ...formContrato,
  };
  dispatch(postContratoAlquiler(payload));
};

const submitUpdate = async (e) => {
  e.preventDefault();
  dispatch(anulacionContrato({
    id_contrato: id,
    fecha_desde_contrato: formContrato["fecha_desde_contrato"],
    fecha_hasta_contrato: formContrato["fecha_hasta_contrato"]
  }))
}

  return (
    <div>
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
    <div className={styles.container}>
      <h2>Datos del contrato</h2>
        <form action="" className={styles.form}>
        <div className={styles.inputContainer}>
          <span>Vehículo</span>
          <Select
            options={opcionesVehiculos}
            isDisabled={id ? true : false}
            value={
              opcionesVehiculos.find(
                (opt) => String(opt.value) === String(formContrato.id_vehiculo)
                      ) || null
            }
            onChange={(option) => {
              setFormContrato((prevForm) => ({
                ...prevForm,
                id_vehiculo: option?.value || "",
              }));
            }}
            placeholder="Seleccione un vehículo"
            styles={customStyles}
          />
        </div>
        <div className={styles.inputWrapper}>
          <span>Clientes</span>
          <div className={styles.selectWithIcon}>
            <select name="id_cliente" disabled={id ? true : false} value={formContrato["id_cliente"]} onChange={handleChangeContrato}>
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
        <span>Deposito</span>
        <input
        disabled={id ? true : false}
        type="number"
        name="deposito"
        value={formContrato.deposito}
        onChange={handleChangeContrato}
        />

        </div>
        <div className={styles.inputContainer}>
          <span>Formas de cobro</span>
          <select name="id_forma_cobro_contrato" disabled={id ? true : false}  
          value={formContrato["id_forma_cobro_contrato"]} 
          onChange={handleChangeContrato} id="">
            <option value={""} disabled selected>{"Seleccione una opción"}</option>
            {
              formasDeCobro?.length && formasDeCobro?.map(e => {
                return <option key={e.id} value={e.id}>{e.nombre}</option>
              })
            }
          </select>
        </div>
        <div className={styles.inputContainer}>
            <span>Fecha desde</span>
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={formContrato.fecha_desde_contrato}
              onChange={(date) => setFormContrato(prev => ({ ...prev, fecha_desde_contrato: date }))}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="Seleccione una fecha"
              excludeDateIntervals={obtenerRangosOcupados(contratosVigentes)}
              locale="es"
            />
        </div>
        <div className={styles.inputContainer}>
            <span>Fecha hasta</span>
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={formContrato.fecha_hasta_contrato}
              onChange={(date) => setFormContrato(prev => ({ ...prev, fecha_hasta_contrato: date }))}
              minDate={minDate}
              maxDate={maxDate}
              placeholderText="Seleccione una fecha"
              excludeDateIntervals={obtenerRangosOcupados(contratosVigentes)}
              locale="es"
            />
        </div>
        </form>
            {
      id && <button className={styles.sendBtn} onClick={submitUpdate}>Enviar</button>
    }
    </div>
    {
      !id && <AlquileresForm modoContrato={true} onSubmitFinal={handleFinalSubmit} idVehiculoSeleccionado={formContrato.id_vehiculo}/>
    }
    

    </div>
  );
};

export default ContratoAlquiler;