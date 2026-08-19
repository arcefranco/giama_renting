import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getObservacionesVehiculo, postObservacionVehiculo } from '../../../reducers/Vehiculos/vehiculosSlice';
import { ClipLoader } from 'react-spinners';
import styles from './ObservacionesModal.module.css';

const ObservacionesModal = ({ isOpen, onClose, vehiculo }) => {
  const dispatch = useDispatch();
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { observacionesVehiculo, isLoading } = useSelector((state) => state.vehiculosReducer);
  const { username } = useSelector((state) => state.loginReducer);

  useEffect(() => {
    if (isOpen && vehiculo?.id) {
      dispatch(getObservacionesVehiculo({ vehiculo_id: vehiculo.id }));
      setNuevaObservacion('');
    }
  }, [isOpen, vehiculo, dispatch]);

  if (!isOpen || !vehiculo) return null;

  const handleAgregar = async (e) => {
    e.preventDefault();
    if (!nuevaObservacion.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await dispatch(
        postObservacionVehiculo({
          vehiculo_id: vehiculo.id,
          observacion: nuevaObservacion.trim(),
          usuario: username || 'Sistema',
        })
      ).unwrap();

      if (res?.status) {
        setNuevaObservacion('');
        // Recargar el historial
        dispatch(getObservacionesVehiculo({ vehiculo_id: vehiculo.id }));
      }
    } catch (err) {
      console.error('Error al agregar observación:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFecha = (fechaRaw) => {
    if (!fechaRaw) return '';
    try {
      const d = new Date(fechaRaw);
      // Ocultamos la fecha "falsa" de anclaje (1 de Enero de 2000) para la observación legacy
      if (d.getFullYear() === 2000 && d.getMonth() === 0 && d.getDate() === 1) {
        return '';
      }
      return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaRaw;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            <span>Observaciones</span>
            <span className={styles.badgeDominio}>
              {vehiculo.dominio_visible || vehiculo.dominio || `ID: ${vehiculo.id}`}
            </span>
          </h3>
          <button className={styles.closeButton} onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.historySection}>
            <h4 className={styles.sectionTitle}>Historial de Notas</h4>
            {isLoading && (!observacionesVehiculo || observacionesVehiculo.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <ClipLoader size={30} color="#800020" />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>Cargando observaciones...</p>
              </div>
            ) : observacionesVehiculo && observacionesVehiculo.length > 0 ? (
              <div className={styles.historyList}>
                {observacionesVehiculo.map((obs) => (
                  <div key={obs.id} className={styles.historyItem}>
                    <div className={styles.itemHeader}>
                      <span className={styles.userBadge}>👤 {obs.usuario || 'Sistema'}</span>
                      <span className={styles.dateText}>{formatFecha(obs.fecha)}</span>
                    </div>
                    <p className={styles.itemText}>{obs.observacion}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>No hay observaciones registradas para este vehículo.</div>
            )}
          </div>

          <form className={styles.formSection} onSubmit={handleAgregar}>
            <h4 className={styles.sectionTitle}>Agregar Nueva Observación</h4>
            <textarea
              className={styles.textarea}
              placeholder="Escribí una nueva observación aquí..."
              value={nuevaObservacion}
              onChange={(e) => setNuevaObservacion(e.target.value)}
              disabled={isSubmitting}
            />
            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={!nuevaObservacion.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ClipLoader size={14} color="#ffffff" /> Guardando...
                  </>
                ) : (
                  '💬 Agregar Observación'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ObservacionesModal;
