import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import styles from './ImagenesVehiculo.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { getModelos } from '../../reducers/Generales/generalesSlice';
import { eliminarImagenes, reset, getVehiculosById, getImagenesVehiculos } from '../../reducers/Vehiculos/vehiculosSlice';
import Swal from 'sweetalert2';
import { ClipLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import { renderEstadoVehiculo } from '../../utils/renderEstadoVehiculo';


const ImagenesVehiculo = () => {
  const { id } = useParams();
  const [imagenesState, setImagenesState] = useState([]);
  const dispatch = useDispatch();
  const { isError, isSuccess, isLoading, message, vehiculo, imagenes } = useSelector(state => state.vehiculosReducer);
  const {modelos} = useSelector(state => state.generalesReducer)
  useEffect(() => {
    Promise.all([
        dispatch(getImagenesVehiculos({id: id})),
        dispatch(getVehiculosById({id: id})),
        dispatch(getModelos()),
    ])

  }, [id]);
    useEffect(() => {
      if (isError && message) {
        toast.error(message);
      }
      if (isSuccess && message) {
        toast.success(message);
        dispatch(reset());
        dispatch(getImagenesVehiculos({id: id}))
      }
    }, [isError, isSuccess]);
  const handleEliminarImagen = async (key) => {
    try {
      dispatch(eliminarImagenes({key: key}))
      // Luego actualizá tu estado o hacé refetch de las imágenes
      setImagenesState(prev => prev.filter(img => img.Key !== key));
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
      {vehiculo?.length && (
        <h2 style={{display: "flex", alignItems: "center", fontSize: "xx-large"}}>
          {vehiculo[0]?.dominio ? vehiculo[0]?.dominio : 
    vehiculo[0]?.dominio_provisorio ? vehiculo[0]?.dominio_provisorio : ""} - {modelos.find((m) => m.id === vehiculo[0].modelo)?.nombre } - {vehiculo[0].color} - {vehiculo && renderEstadoVehiculo(vehiculo[0], "grande")}
        </h2>
      )}

      <div className={styles.grid}>
        {imagenesState?.length ? imagenesState?.map((img, index) => (
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
        )) : <span>El vehículo no tiene imagenes guardadas</span>}
      </div>
    </div>
  );
};

export default ImagenesVehiculo;