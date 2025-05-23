import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getModelos, getProveedoresGPS, getSucursales } from '../../../reducers/Generales/generalesSlice';
import { getVehiculosById, updateVehiculo, reset } from '../../../reducers/Vehiculos/vehiculosSlice';
import styles from './UpdateVehiculo.module.css';
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import { getEstadoVehiculoSpan } from '../../../utils/getEstadoVehiculoSpan';

const UpdateVehiculo = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { modelos, proveedoresGPS, sucursales } = useSelector(state => state.generalesReducer);
  const { vehiculo, isError, isSuccess, isLoading, message } = useSelector(state => state.vehiculosReducer);

  const [form, setForm] = useState({
    modelo: '',
    nro_chasis: '',
    nro_motor: '',
    kilometros: '',
    proveedor_gps: '',
    nro_serie_gps: '',
    dispositivo: '',
    meses_amortizacion: '',
    color: '',
    calcomania: 0,
    gnc: 0,
    sucursal: ''
  });

  useEffect(() => {
    dispatch(getModelos());
    dispatch(getProveedoresGPS());
    dispatch(getSucursales())
    dispatch(getVehiculosById({id: id}));
  }, [id]);

  useEffect(() => {
    if (vehiculo) {
      setForm({
        modelo: vehiculo[0].modelo || '',
        nro_chasis: vehiculo[0].nro_chasis || '',
        nro_motor: vehiculo[0].nro_motor || '',
        kilometros: vehiculo[0].kilometros_iniciales || '',
        proveedor_gps: vehiculo[0].proveedor_gps || '',
        nro_serie_gps: vehiculo[0].nro_serie_gps || '',
        dispositivo: vehiculo[0].dispositivo_peaje || '',
        meses_amortizacion: vehiculo[0].meses_amortizacion || '',
        color: vehiculo[0].color || '',
        calcomania: vehiculo[0].calcomania || 0,
        gnc: vehiculo[0].gnc || 0,
        sucursal: vehiculo[0].sucursal || ''
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

  const handleCheckChange = (e) => {
    const { name, checked } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: checked ? 1 : 0
    }));
  }

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
        color: '',
        calcomania: 0,
        gnc: 0
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
        <h2 style={{display: "flex", alignItems: "center"}}>
          Modificar datos del vehículo: {vehiculo && vehiculo[0]["dominio"]} {vehiculo?.length && getEstadoVehiculoSpan(vehiculo[0])}
        </h2>
        <form className={styles.form}>
        <fieldset className={styles.fieldSet}>
        <legend>Datos generales del vehículo</legend>
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
            <span>Nro. Chasis</span>
            <input type="text" name="nro_chasis" value={form.nro_chasis} onChange={handleChange} />
          </div>

          <div className={styles.inputContainer}>
            <span>Nro. Motor</span>
            <input type="text" name="nro_motor" value={form.nro_motor} onChange={handleChange} />
          </div>

          <div className={styles.inputContainer}>
            <span>Kilómetros</span>
            <input type="number" min={0} name="kilometros" value={!form.kilometros ? "0" : form.kilometros} onChange={handleChange} />
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
          <div className={styles.inputContainer}>
            <span>Sucursal</span>
            <select name="sucursal" value={form.sucursal} onChange={handleChange}>
              <option value="">Seleccione una sucursal</option>
              {sucursales.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          </fieldset>
          <fieldset className={styles.fieldSet}>
          <legend>Preparación del vehículo</legend>
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
            <span>Calcomanía</span>
            <input
            type="checkbox"
            name="calcomania"
            checked={form.calcomania === 1}
            onChange={handleCheckChange}
            />
          </div>

          <div className={styles.inputContainer}>
            <span>GNC</span>
            <input
            type="checkbox"
            name="gnc"
            checked={form.gnc === 1}
            onChange={handleCheckChange}
            />
          </div>
          </fieldset>
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