import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import styles from './ImagenesVehiculo.module.css';

const ImagenesVehiculo = () => {
  const { id } = useParams();
  const [imagenes, setImagenes] = useState([]);
  const [vehiculo, setVehiculo] = useState(null);

  useEffect(() => {
    Promise.all([
        axios.get(import.meta.env.VITE_REACT_APP_HOST + `vehiculos/getImagenesVehiculos/${id}`).then((res) => setImagenes(res.data)),
        axios.post(import.meta.env.VITE_REACT_APP_HOST + `vehiculos/getVehiculosById`, {id: id}).then((res) => setVehiculo(res.data)),
    ])

  }, [id]);

  return (
    <div className={styles.container}>
      {vehiculo && (
        <h2>
          {vehiculo[0].dominio} - {vehiculo[0].modelo} - {vehiculo[0].color}
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