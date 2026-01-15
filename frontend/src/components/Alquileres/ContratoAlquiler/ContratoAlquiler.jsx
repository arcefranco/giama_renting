import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from 'react-router-dom';
import AlquileresForm_2 from "../AlquileresForm/AlquileresForm.jsx";
import {
  postContratoAlquiler, getContratosByIdVehiculo,
  getContratoById, anulacionContrato, reset, reset_nro_recibo
} from "../../../reducers/Alquileres/alquileresSlice.js";
import { getVehiculos, getVehiculosById } from "../../../reducers/Vehiculos/vehiculosSlice.js";
import { getModelos, getSucursales, getFormasDeCobro } from "../../../reducers/Generales/generalesSlice.js";
import { getClientes, getEstadoCliente, resetEstadoCliente } from "../../../reducers/Clientes/clientesSlice.js";
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
import sinResolucionIcon from "../../../assets/sin_resolucion.png"
import rechazadoIcon from "../../../assets/rechazado.png"
import aprobadoIcon from "../../../assets/aprobado.png"
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx'
import {
  getReciboAlquilerById, getReciboDepositoById,
  resetAlquiler, resetDeposito
} from "../../../reducers/Recibos/recibosSlice.js"
import Swal from 'sweetalert2';
const ContratoAlquiler = () => {

  const dispatch = useDispatch();
  const { id } = useParams()
  registerLocale("es", es);
  useEffect(() => {
    Promise.all([
      dispatch(getFormasDeCobro()),
      dispatch(getVehiculos()),
      dispatch(getModelos()),
      dispatch(getClientes()),
      dispatch(getSucursales()),
    ])
    if (id && !isNaN(id)) {
      dispatch(getContratoById({ id: id }))
    }
    return () => {
      dispatch(resetAlquiler())
      dispatch(resetDeposito())
      dispatch(reset_nro_recibo())
      dispatch(resetEstadoCliente())
    }
  }, [])
  const hoy = getToday();
  const fechaDesdePorDefecto = getNextWednesday(hoy);
  /* datos solo validos al montaje del componente */
  const fechaHastaPorDefecto = addDaysHelper(fechaDesdePorDefecto, 90);

  const { isError, isSuccess, isLoading,
    message, contratosVehiculo, contratoById, nro_recibo_alquiler,
    nro_recibo_deposito } = useSelector((state) => state.alquileresReducer)
  const { html_recibo_alquiler, html_recibo_deposito } = useSelector((state) => state.recibosReducer);
  const { username } = useSelector((state) => state.loginReducer)
  const [formContrato, setFormContrato] = useState({
    debe_deposito: '',
    id_vehiculo: '',
    id_cliente: '',
    apellido_cliente: '',
    ingresa_deposito: 1,
    deposito: '',
    deposito_2: '',
    deposito_3: '',
    fecha_recibo_deposito: '',
    id_forma_cobro_contrato: '',
    id_forma_cobro_contrato_2: '',
    id_forma_cobro_contrato_3: '',
    usuario: username,
    sucursal_vehiculo: "",
    fecha_desde_contrato: id ? "" : fechaDesdePorDefecto,
    fecha_hasta_contrato: id ? "" : fechaHastaPorDefecto,
  });
  const { vehiculos, vehiculo } = useSelector((state) => state.vehiculosReducer)
  const { clientes, estado_cliente } = useSelector((state) => state.clientesReducer)
  const { modelos, sucursales, formasDeCobro } = useSelector((state) => state.generalesReducer)
  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
    onSuccess: () => {
      setFormContrato({
        debe_deposito: '',
        id_vehiculo: '',
        id_cliente: '',
        apellido_cliente: '',
        ingresa_deposito: 1,
        deposito: '',
        deposito_2: '',
        deposito_3: '',
        id_forma_cobro_contrato: '',
        id_forma_cobro_contrato_2: '',
        id_forma_cobro_contrato_3: '',
        usuario: username,
        sucursal_vehiculo: "",
        fecha_desde_contrato: id ? "" : fechaDesdePorDefecto,
        fecha_hasta_contrato: id ? "" : fechaHastaPorDefecto,
        fecha_recibo_deposito: '',
      })
      dispatch(reset())
    }
  })

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

    } else {
      setFormContrato({
        debe_deposito: '',
        id_vehiculo: '',
        id_cliente: '',
        ingresa_deposito: 1,
        deposito: '',
        deposito_2: '',
        deposito_3: '',
        id_forma_cobro_contrato: '',
        id_forma_cobro_contrato_2: '',
        id_forma_cobro_contrato_3: '',
        usuario: username,
        sucursal_vehiculo: '',
        fecha_desde_contrato: fechaDesdePorDefecto,
        fecha_hasta_contrato: fechaHastaPorDefecto,
      })
    }
  }, [contratoById, id]);

  const customStyles = {
    container: (provided) => ({
      ...provided,
      width: '22rem'
    })
  };
  const handleChangeContrato = (e) => {
    const { name, value } = e.target;
    if (value && name === "id_cliente") {
      setFormContrato({
        ...formContrato,
        [name]: value,
        "apellido_cliente": clientes.find(e => e.id == value)?.apellido
      });
    } else {
      setFormContrato((prev) => ({ ...prev, [name]: value }));

    }
  };
  useEffect(() => { //obtengo contratos del vehiculo seleccionado
    if (formContrato.id_vehiculo && !isNaN(formContrato.id_vehiculo)) {
      dispatch(getContratosByIdVehiculo({ id: formContrato["id_vehiculo"] }))
      dispatch(getVehiculosById({ id: formContrato["id_vehiculo"] }))
    }
  }, [formContrato["id_vehiculo"]])

  useEffect(() => { //obtengo sucursal del vehiculo (para ingresar en recibos)
    if (formContrato["id_vehiculo"] && sucursales?.length && vehiculo?.length) {
      setFormContrato({
        ...formContrato,
        sucursal_vehiculo: sucursales?.find(e => e.id == vehiculo[0]?.sucursal)?.nombre
      })
    }
  }, [formContrato["id_vehiculo"], sucursales, vehiculo])

  useEffect(() => { //obtengo estado del cliente seleccionado
    if (formContrato.id_cliente && !isNaN(formContrato.id_cliente)) {
      dispatch(getEstadoCliente({ id_cliente: formContrato["id_cliente"] }))
    }
  }, [formContrato["id_cliente"]])

  useEffect(() => {
    if (estado_cliente || estado_cliente == 0) {
      if (estado_cliente == -1) {
        toast.info("Hubo un problema al buscar el estado actual del datero del chofer", {
          position: "bottom-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        })
        setFormContrato({
          ...formContrato,
          id_cliente: "",
          apellido_cliente: ""
        })
      }
      if (estado_cliente == 0) {
        toast.info("Este chofer aún no tiene el datero aprobado", {
          position: "bottom-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        })
      }
    }
  }, [estado_cliente])



  useEffect(() => {
    if (nro_recibo_alquiler) {
      dispatch(getReciboAlquilerById({ id: nro_recibo_alquiler }));
    }
    if (nro_recibo_deposito) {
      dispatch(getReciboDepositoById({ id: nro_recibo_deposito }));
    }
  }, [nro_recibo_alquiler, nro_recibo_deposito]);

  useEffect(() => {
    const preguntarRecibo = async () => {
      const mostrarSwal = async ({ tipo, html }) => {
        const titulo =
          tipo === 'alquiler'
            ? '¿Desea imprimir el recibo del alquiler?'
            : '¿Desea imprimir el recibo del depósito?';

        const res = await Swal.fire({
          title: titulo,
          showCancelButton: true,
          confirmButtonText: 'Sí',
          cancelButtonText: 'Cancelar',
          icon: 'warning',
          didOpen: () => {
            document.body.classList.remove('swal2-height-auto');
          },
        });
        if (res.isConfirmed && html) {
          const win = window.open('', '_blank');
          win.document.write(html);
          win.document.close();
          setTimeout(() => {
            win.focus();
            win.print();
            win.onafterprint = () => {
              win.close();
            };
          }, 500); // Ajustá el delay si fuera necesario
        }

      };
      const pasos = [];
      if (html_recibo_alquiler) {
        pasos.push(() =>
          mostrarSwal({
            tipo: 'alquiler',
            html: html_recibo_alquiler,
          })
        );
      }
      if (html_recibo_deposito) {
        pasos.push(() =>
          mostrarSwal({
            tipo: 'deposito',
            html: html_recibo_deposito,
          })
        );
      }
      for (const paso of pasos) {
        await paso();
      }
    };

    if (html_recibo_alquiler || html_recibo_deposito) {
      preguntarRecibo();
    }
  }, [html_recibo_alquiler, html_recibo_deposito, dispatch]);


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

  const getIconFromResolucion = (valor) => {
    const opciones = {
      0: sinResolucionIcon,
      1: aprobadoIcon,
      2: rechazadoIcon,
    };
    return opciones[valor] || sinResolucionIcon;
  };

  const opcionesVehiculos = vehiculos?.filter((v) => !v.fecha_venta).map((e) => {
    const dominio = e.dominio || e.dominio_provisorio || "";
    const modeloNombre = modelos.find((m) => m.id == e.modelo)?.nombre || "";

    return {
      value: e.id,
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '15px' }}>
          <span>{dominio} - {modeloNombre}</span>
          {renderEstadoVehiculo(e, 'chico')}
        </div>
      ),
      isDisabled: e.estado_actual !== 2,
      searchKey: `${dominio} ${modeloNombre}`.toLowerCase(),
    };
  });
  const getClienteDisplayName = (cliente) => {
    if (cliente.razon_social) {
      return cliente.razon_social;
    }

    return `${cliente.nombre ?? ''} ${cliente.apellido ?? ''}`.trim();
  };
  const clienteOptions = clientes.map(cliente => {
    const displayName = getClienteDisplayName(cliente);

    return {
      value: cliente.id,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={getIconFromResolucion(cliente.resolucion_datero)}
            alt=""
            style={{ width: 16, height: 16 }}
          />
          {`${cliente.nro_documento} - ${displayName}`}
        </div>
      ),
      isDisabled: cliente.resolucion_datero === 2 || cliente.resolucion_datero === 0,
      searchKey: `${cliente.nro_documento} ${displayName}`.toLowerCase(),
    };
  });


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
        <form action="" className={styles.form} style={{
          gridTemplateColumns: "1fr 1fr"
        }}>

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
              filterOption={(option, inputValue) =>
                option.data.searchKey.includes(inputValue.toLowerCase())
              }
            />
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div>
              <div className={styles.inputWrapper}>
                <span>Clientes</span>
                <Select
                  options={clienteOptions}
                  placeholder="Seleccione un cliente"
                  value={formContrato.id_cliente
                    ? clienteOptions.find(opt => opt.value == formContrato.id_cliente)
                    : null}
                  onChange={(e) => {
                    const selectedCliente = clientes.find(c => c.id === e.value);
                    setFormContrato({
                      ...formContrato,
                      id_cliente: selectedCliente.id,
                      apellido_cliente: selectedCliente.apellido,
                    });
                  }}
                  isDisabled={id ? true : false}
                  filterOption={(option, inputValue) =>
                    option.data.searchKey.includes(inputValue.toLowerCase())
                  }
                />
                <p style={{ fontSize: "11px" }}>Los clientes con su datero rechazado se encuentran inhabilitados</p>
              </div>
            </div>
            <div>

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
              /*               minDate={hoy} */
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
              /*               minDate={hoy} */
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
      {
        !id &&
        <div className={styles.container}>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              id="sinGarantia"
              checked={formContrato.ingresa_deposito === 0}
              onChange={(e) =>
                setFormContrato({
                  ...formContrato,
                  ingresa_deposito: e.target.checked ? 0 : 1,
                })
              }
            />
            <label htmlFor="sinGarantia" style={{ marginLeft: '0.5rem' }}>Sin depósito en garantía</label>
          </div>

          <h2>Depósito en garantía</h2>

          <form action="" className={`${styles.formDeposito} ${formContrato.ingresa_deposito === 0 ? styles.disabledForm : ''}`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div className={styles.inputContainer}>
                <span>Fecha del recibo</span>
                <input type="date" name='fecha_recibo_deposito' value={formContrato["fecha_recibo_deposito"]}
                  onChange={handleChangeContrato} />
              </div>
              <div className={styles.inputContainer}>
                <span>Total depósito</span>
                <input
                  type="number"
                  name="debe_deposito"
                  value={formContrato.debe_deposito}
                  onChange={handleChangeContrato}
                />

              </div>

            </div>
            <hr style={{ width: "30rem", placeSelf: "anchor-center", margin: "2rem" }} />
            <h3>Pago</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div className={styles.inputContainer}>
                <span>Forma de cobro</span>
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
                <span>Importe total</span>
                <input
                  type="number"
                  name="deposito"
                  value={formContrato.deposito}
                  onChange={handleChangeContrato}
                />

              </div>

            </div>
            {/* FORMA COBRO DEPOSITO 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div className={styles.inputContainer}>
                <span>Forma de cobro</span>
                <select name="id_forma_cobro_contrato_2" disabled={id ? true : false}
                  value={formContrato["id_forma_cobro_contrato_2"]}
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
                <span>Importe total</span>
                <input
                  type="number"
                  name="deposito_2"
                  value={formContrato.deposito_2}
                  onChange={handleChangeContrato}
                />

              </div>

            </div>
            {/* FORMA COBRO DEPOSITO 3 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div className={styles.inputContainer}>
                <span>Forma de cobro</span>
                <select name="id_forma_cobro_contrato_3" disabled={id ? true : false}
                  value={formContrato["id_forma_cobro_contrato_3"]}
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
                <span>Importe total</span>
                <input
                  type="number"
                  name="deposito_3"
                  value={formContrato.deposito_3}
                  onChange={handleChangeContrato}
                />

              </div>

            </div>

          </form>
        </div>
      }

      {
        !id && <AlquileresForm_2 modoContrato={true} onSubmitFinal={handleFinalSubmit}
          idVehiculoSeleccionado={formContrato.id_vehiculo} minDateContrato={formContrato.fecha_desde_contrato}
          maxDateContrato={formContrato.fecha_hasta_contrato} vehiculo={formContrato.id_vehiculo} cliente={formContrato.id_cliente}
          fecha_recibo_deposito={formContrato.fecha_recibo_deposito}
        />
      }


    </div>
  );
};

export default ContratoAlquiler;