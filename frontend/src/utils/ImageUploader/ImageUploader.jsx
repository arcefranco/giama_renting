import { useState } from "react";
import { useDispatch } from "react-redux";
import { postImagenesVehiculo } from "../../reducers/Vehiculos/vehiculosSlice";
import styles from "./ImageUploader.module.css";

const ImageUploader = ({ idVehiculo, dispatchAction }) => {
  const [imagenes, setImagenes] = useState([]);
  const dispatch = useDispatch();

  const eliminarImagen = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };
  const handleFileChange = (e) => {
    const archivosSeleccionados = Array.from(e.target.files);
    const archivosValidos = [];
    const extensionesValidas = ["png", "jpg", "jpeg", "webp", "pdf"];
    
    for (const archivo of archivosSeleccionados) {
      const extension = archivo.name.split('.').pop().toLowerCase();
      if (!extensionesValidas.includes(extension)) {
        alert(`El archivo ${archivo.name} no es válido. Extensiones permitidas: ${extensionesValidas.join(", ")}`);
      } else {
        archivosValidos.push(archivo);
      }
    }

    setImagenes((prev) => [...prev, ...archivosValidos]);
  };

  const subirImagenes = async () => {
    if (imagenes.length === 0) {
      alert("No hay imágenes para subir.");
      return;
    }

    const formData = new FormData();
    imagenes.forEach((img) => formData.append("images", img));
    formData.append("id", idVehiculo);

    try {
      const result = await dispatch(dispatchAction(formData)).unwrap();

      if (result.status) {
        setImagenes([]); // Limpiamos las imágenes tras subirlas
      }
    } catch (error) {
      console.error("Error al subir imágenes:", error);

    }
  };
  const fileText =
    imagenes.length === 0
      ? "No hay archivos seleccionados"
      : imagenes.length === 1
        ? imagenes[0].name
        : `${imagenes.length} archivos seleccionados`;

  return (
    <div className={styles.container}>
      <div className={styles.fileInputWrapper}>
        <label htmlFor="fileInput" className={styles.customFileButton}>
          Elegir archivos
        </label>
        <input
          id="fileInput"
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className={styles.hiddenInput}
        />
        <span className={styles.fileName}>{fileText}</span>
      </div>

      <div className={styles.previewGrid}>
        {imagenes.map((archivo, index) => (
          <div key={index} className={styles.thumbnailWrapper}>
            <img
              src={URL.createObjectURL(archivo)}
              alt={`preview-${index}`}
              className={styles.thumbnail}
            />
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => eliminarImagen(index)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button type="button" className={styles.sendBtn} onClick={subirImagenes}>
        Subir imágenes
      </button>
    </div>
  );
};

export default ImageUploader;