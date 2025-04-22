import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getModelos, getProveedoresGPS } from '../../../reducers/Generales/generalesSlice';
import { getVehiculosById, updateVehiculo, reset } from '../../../reducers/Vehiculos/vehiculosSlice';
import styles from './UpdateVehiculo.module.css';
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";

const UpdateVehiculo = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { modelos, proveedoresGPS } = useSelector(state => state.generalesReducer);
  const { vehiculo, isError, isSuccess, isLoading, message } = useSelector(state => state.vehiculosReducer);

  const [form, setForm] = useState({
    modelo: '',
    dominio: '',
    nro_chasis: '',
    nro_motor: '',
    kilometros: '',
    proveedor_gps: '',
    nro_serie_gps: '',
    dispositivo: '',
    meses_amortizacion: '',
    color: ''
  });

  useEffect(() => {
    dispatch(getModelos());
    dispatch(getProveedoresGPS());
    dispatch(getVehiculosById({id: id}));
  }, [id]);

  useEffect(() => {
    if (vehiculo) {
      setForm({
        modelo: vehiculo[0].modelo || '',
        dominio: vehiculo[0].dominio || '',
        nro_chasis: vehiculo[0].nro_chasis || '',
        nro_motor: vehiculo[0].nro_motor || '',
        kilometros: vehiculo[0].kilometros_iniciales || '',
        proveedor_gps: vehiculo[0].proveedor_gps || '',
        nro_serie_gps: vehiculo[0].nro_serie_gps || '',
        dispositivo: vehiculo[0].dispositivo_peaje || '',
        meses_amortizacion: vehiculo[0].meses_amortizacion || '',
        color: vehiculo[0].color || ''
      });
    }
  }, [vehiculo]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess) {
      toast.success(message);
      dispatch(reset());
    }
  }, [isError, isSuccess]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, id: id };
    dispatch(updateVehiculo(body));
    setFormData({
        modelo: '',
        dominio: '',
        nro_chasis: '',
        nro_motor: '',
        kilometros: '',
        proveedor_gps: '',
        nro_serie_gps: '',
        dispositivo: '',
        meses_amortizacion: '',
        color: ''
      })
  };

  return (
    <div>
      <div className={styles.container}>
        <ToastContainer />
        {isLoading && (
          <div className={styles.spinnerOverlay}>
            <ClipLoader size={60} color="#800020" loading={true} />
            <p className={styles.loadingText}>Actualizando vehículo...</p>
          </div>
        )}
        <h2>Modificar datos del vehículo</h2>
        <form className={styles.form}>
          <div className={styles.inputContainer}>
            <span>Modelo</span>
            <select name="modelo" value={form.modelo} onChange={handleChange}>
              <option value="">Seleccione un modelo</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputContainer}>
            <span>Dominio</span>
            <input type="text" name="dominio" value={form.dominio} onChange={handleChange} />
          </div>

          <div className={styles.inputContainer}>
            <span>Nro. Chasis</span>
            <input type="text" name="nro_chasis" value={form.nro_chasis} onChange={handleChange} />
          </div>

          <div className={styles.inputContainer}>
            <span>Nro. Motor</span>
            <input type="text" name="nro_motor" value={form.nro_motor} onChange={handleChange} />
          </div>

          <div className={styles.inputContainer}>
            <span>Kilómetros</span>
            <input type="number" name="kilometros" value={form.kilometros} onChange={handleChange} />
          </div>

          <div className={styles.inputContainer}>
            <span>Proveedor GPS</span>
            <select name="proveedor_gps" value={form.proveedor_gps} onChange={handleChange}>
              <option value="">Seleccione un proveedor</option>
              {proveedoresGPS.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className={styles.inputContainer}>
            <span>Nro. Serie GPS</span>
            <input type="text" name="nro_serie_gps" value={form.nro_serie_gps} onChange={handleChange} />
          </div>

          <div className={styles.inputContainer}>
            <span>Dispositivo Peaje</span>
            <input type="text" name="dispositivo" value={form.dispositivo} onChange={handleChange} />
          </div>

          <div className={styles.inputContainer}>
            <span>Meses amortización</span>
            <input type="number" name="meses_amortizacion" value={form.meses_amortizacion} onChange={handleChange} />
          </div>

          <div className={styles.inputContainer}>
            <span>Color</span>
            <input type="text" name="color" value={form.color} onChange={handleChange} />
          </div>
        </form>

        <button
          className={styles.sendBtn}
          onClick={handleSubmit}
          disabled={!form.modelo}
        >
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default UpdateVehiculo;