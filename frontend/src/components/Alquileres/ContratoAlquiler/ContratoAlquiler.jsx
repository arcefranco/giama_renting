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
import { renderEstadoVehiculo } from "../../../utils/renderEstadoVehiculo.jsx";
import { addDaysHelper } from "../../../helpers/addDaysHelper.js";
import { getNextWednesday } from "../../../helpers/getNextWednesday.js";
import { getToday } from "../../../helpers/getTodayDate.js";

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
const hoy = getToday();
const fechaDesdePorDefecto = getNextWednesday(hoy);
/* datos solo validos al montaje del componente */
const fechaHastaPorDefecto = addDaysHelper(fechaDesdePorDefecto, 90);

const {isError, isSuccess, isLoading, 
  message, formasDeCobro, contratosVehiculo, contratoById } = useSelector((state) => state.alquileresReducer)
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
if (id && contratoById.length) { //si estoy modificando un contrato
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
}
}, [contratoById, id]);

const opcionesVehiculos = vehiculos.filter(v => {return !v.fecha_venta}).map(e => {

  return {
    value: e.id,
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: "15px" }}>
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

useEffect(() => { /* fechas por defecto */
  if (!formContrato.id_vehiculo || !contratosVehiculo?.length) {
    /*volvemos a setear fechaspordefecto del momento del montaje 
    por si el vehiculo no tiene contratos pertinentes a la fecha */
      const proxMiercoles = getNextWednesday(hoy);
      setFormContrato(prev => ({
        ...prev,
        fecha_desde_contrato: proxMiercoles,
        fecha_hasta_contrato: addDaysHelper(proxMiercoles, 90),
      }));
  
    return; 
  }
  if(!id){// Buscar la fecha_hasta más lejana de los contratos vigentes
  const ultimaFechaHasta = contratosVehiculo.length
    ? new Date(
        Math.max(
          ...contratosVehiculo.map((c) => new Date(c.fecha_hasta).getTime())
        )
      )
    : hoy;

  // Obtener miércoles siguiente a esa fecha
  const siguienteMiercoles = getNextWednesday(ultimaFechaHasta);

  // Calcular fecha hasta (90 días desde el miércoles)
  const hasta = addDaysHelper(siguienteMiercoles, 90);

  
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
      if (id) { //si estoy editando, omito ese contrato de los rangos bloqueados
        return String(a.id) !== String(id);
      }
      return true;
    })
    .map((a) => ({
      start: new Date(a.fecha_desde),
      end: addDaysHelper(new Date(a.fecha_hasta), 1), // incluir fecha final
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
            <span>Fecha desde</span>
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={formContrato.fecha_desde_contrato}
              onChange={(date) => setFormContrato(prev => ({ ...prev, fecha_desde_contrato: date }))}
              minDate={hoy}
              placeholderText="Seleccione una fecha"
              excludeDateIntervals={obtenerRangosOcupados(contratosVehiculo)}
              locale="es"
            />
        </div>
        <div className={styles.inputContainer}>
            <span>Fecha hasta</span>
            <DatePicker
              dateFormat="dd/MM/yyyy"
              selected={formContrato.fecha_hasta_contrato}
              onChange={(date) => setFormContrato(prev => ({ ...prev, fecha_hasta_contrato: date }))}
              minDate={hoy}
              placeholderText="Seleccione una fecha"
              excludeDateIntervals={obtenerRangosOcupados(contratosVehiculo)}
              locale="es"
            />
        </div>
        </form>

            {
      id && <button className={styles.sendBtn} onClick={submitUpdate}>Enviar</button>
    }
    </div>
    <div className={styles.container} style={{height: "20rem"}}>
    <h2>Depósito en garantía</h2>
      <form action="" className={styles.form}>
      <div className={styles.inputContainer}>
        <span>Importe total</span>
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
      </form>
    </div>
    {
      !id && <AlquileresForm modoContrato={true} onSubmitFinal={handleFinalSubmit} 
      idVehiculoSeleccionado={formContrato.id_vehiculo} minDateContrato={formContrato.fecha_desde_contrato} 
      maxDateContrato={formContrato.fecha_hasta_contrato}/>
    }
    

    </div>
  );
};

export default ContratoAlquiler;