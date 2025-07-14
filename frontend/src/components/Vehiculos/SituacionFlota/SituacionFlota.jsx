import React, {useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {getSituacionFlota} from '../../../reducers/Vehiculos/vehiculosSlice'
import DataGrid from "devextreme-react/data-grid"
import { ClipLoader } from 'react-spinners';
import styles from './SituacionFlota.module.css'
import { renderEstadoVehiculo } from '../../../utils/renderEstadoVehiculo.jsx';
import { ESTADOS_ESTATICOS } from '../../../utils/estadosVehiculoConfig.js';
import { ToastContainer, toast } from 'react-toastify';

const renderEtiquetaDesdeNombre = (nombreEstado) => {
  // Normalizar el nombre
  const nombre = nombreEstado?.toLowerCase();
  const vehiculoSimulado = {
    fecha_venta: nombre === "vendidos" ? "2025-01-01" : null, //fecha falsa para pasar como 1
    vehiculo_alquilado: nombre === "alquilados" ? 1 : 0,
    vehiculo_reservado: nombre === "reservados" ? 1 : 0,
    estado_actual: null
  };

  // Si es uno de los estados personalizados
  if (!["vendidos", "alquilados", "reservados"].includes(nombre)) {
    // Buscar ID por nombre exacto
    const estadoEncontrado = ESTADOS_ESTATICOS.find(
      (e) => e.nombre.toLowerCase() === nombre
    );
    if (estadoEncontrado) {
      vehiculoSimulado.estado_actual = estadoEncontrado.id;
    }
  }

  return renderEstadoVehiculo(vehiculoSimulado);
};

const SituacionFlota = () => {
  const dispatch = useDispatch();
  const {isError, message, isLoading, situacionFlota } = useSelector(
    (state) => state.vehiculosReducer
  );

  useEffect(() => {
    dispatch(getSituacionFlota());
  }, [dispatch]);

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
            console.log("Entro")
        }
  }, [isError])

  if (isLoading) {
    return (
      <div className={styles.spinnerOverlay}>
        <ClipLoader size={60} color="#800020" />
        <span className={styles.loadingText}>Cargando vehículos...</span>
      </div>
    );
  }

  if (!situacionFlota || Object.keys(situacionFlota).length === 0) {
    return <div>
    <ToastContainer /> 
    <p>No hay datos disponibles</p>
    </div>
  }

  const total = situacionFlota.total;
  const datos = Object.entries(situacionFlota)
    .map(([estado, cantidad]) => ({
      estado,
      cantidad,
      proporcion: Math.round((cantidad / total) * 100)
    }));

  return (
    <div className={styles.container}>
      <h2>Situación actual de la flota</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Situación</th>
            <th className={styles.th}>Cantidad</th>
            <th className={styles.th}>Porcentaje</th>
          </tr>
        </thead>
        <tbody>
          {datos.map(({ estado, cantidad, proporcion }) => (
            <tr key={estado}>
              <td className={styles.td}>{estado == "total" ? "Vehículos en flota" : renderEtiquetaDesdeNombre(estado)}</td>
              <td className={styles.tdNumero}>{cantidad}</td>
              <td className={styles.tdNumero}>{proporcion}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



export default SituacionFlota