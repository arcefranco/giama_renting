import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ImagenesClientes.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { eliminarImagenes, reset, getClientesById, getImagenesClientes } from '../../reducers/Clientes/clientesSlice';
import Swal from 'sweetalert2';
import { ClipLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';



const ImagenesClientes = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { isError, isSuccess, isLoading, message, cliente, imagenes } = useSelector(state => state.clientesReducer);
  const [imagenesState, setImagenesState] = useState([])
  useEffect(() => {
    Promise.all([
        dispatch(getImagenesClientes({id: id})),
        dispatch(getClientesById({id: id}))
    ])

  }, [id]);
  useEffect(() => {
      if (isError && message) {
        toast.error(message);
      }
      if (isSuccess && message) {
        toast.success(message);
        dispatch(reset());
        dispatch(getImagenesClientes({id: id}))
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
      {cliente?.length && (
        <h2 style={{fontSize: "xx-large"}}>
        {cliente[0]["nombre"] ? cliente[0]["nombre"] + " " + cliente[0]["apellido"] : cliente[0]["razon_social"]}

        </h2>
      )}

      <div className={styles.grid}>
        {imagenesState.length ? imagenesState?.map((img, index) => (
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
        )) : <span>El cliente no tiene imagenes guardadas</span>}
      </div>
    </div>
  );
};

export default ImagenesClientes;