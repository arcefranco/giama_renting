import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import styles from './ImagenesVehiculo.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { getModelos } from '../../reducers/Generales/generalesSlice';
import { eliminarImagenes, reset } from '../../reducers/Vehiculos/vehiculosSlice';
import Swal from 'sweetalert2';
import { ClipLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import { getEstadoVehiculoSpan } from '../../utils/getEstadoVehiculoSpan';



const ImagenesVehiculo = () => {
  const { id } = useParams();
  const [imagenes, setImagenes] = useState([]);
  const [vehiculo, setVehiculo] = useState(null);
  const dispatch = useDispatch();
  const { isError, isSuccess, isLoading, message } = useSelector(state => state.vehiculosReducer);
  const {modelos} = useSelector(state => state.generalesReducer)
  useEffect(() => {
    Promise.all([
        axios.get(import.meta.env.VITE_REACT_APP_HOST + `vehiculos/getImagenesVehiculos/${id}`).then((res) => setImagenes(res.data)),
        axios.post(import.meta.env.VITE_REACT_APP_HOST + `vehiculos/getVehiculosById`, {id: id}).then((res) => setVehiculo(res.data)),
        dispatch(getModelos()),
    ])

  }, [id]);
    useEffect(() => {
      if (isError) {
        toast.error(message);
      }
      if (isSuccess) {
        toast.success(message);
        dispatch(reset());
        axios.get(import.meta.env.VITE_REACT_APP_HOST + `vehiculos/getImagenesVehiculos/${id}`).then((res) => setImagenes(res.data))
      }
    }, [isError, isSuccess]);
  const handleEliminarImagen = async (key) => {
    try {
      dispatch(eliminarImagenes({key: key}))
      // Luego actualizá tu estado o hacé refetch de las imágenes
      setImagenes(prev => prev.filter(img => img.Key !== key));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar la imagen');
    }
  };
  const handleDeleteClick = (imagen) => {
    Swal.fire({
      title: '¿Seguro que querés eliminar esta imagen?',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      icon: 'warning',
      didOpen: () => {
        document.body.classList.remove('swal2-height-auto');
      }
    }).then((result) => {
      if (result.isConfirmed) {
        handleEliminarImagen(imagen);
      }
    });
  };
  return (
    <div className={styles.container}>
      <ToastContainer/>
      {isLoading && (
          <div className={styles.spinnerOverlay}>
            <ClipLoader size={60} color="#800020" loading={true} />
            <p className={styles.loadingText}>Eliminando imagen...</p>
          </div>
        )} 
      {vehiculo && (
        <h2 style={{fontSize: "xx-large"}}>
          {vehiculo[0].dominio} - {modelos.find((m) => m.id === vehiculo[0].modelo)?.nombre } - {vehiculo[0].color} - {getEstadoVehiculoSpan(vehiculo)}
        </h2>
      )}

      <div className={styles.grid}>
        {imagenes?.map((img, index) => (
          <div key={index} className={styles.card}>
            <img
              src={img.url}
              alt={`Imagen ${index + 1}`}
              className={styles.thumbnail}
              onClick={() => window.open(img.url, '_blank')}
            />
            <button className={styles.removeBtn} onClick={() => handleDeleteClick(img["key"])}>×</button>
            <div className={styles.info}>
              <p>{img.key.split('/').pop()}</p>
              <p>{new Date(img.lastModified).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagenesVehiculo;