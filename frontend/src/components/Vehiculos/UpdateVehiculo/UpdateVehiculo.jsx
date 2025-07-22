import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getModelos, getProveedoresGPS, getSucursales, getEstados } from '../../../reducers/Generales/generalesSlice';
import { getVehiculosById, updateVehiculo, reset } from '../../../reducers/Vehiculos/vehiculosSlice';
import styles from './UpdateVehiculo.module.css';
import { ToastContainer, toast } from 'react-toastify';
import { ClipLoader } from "react-spinners";
import SelectEstados from '../../../utils/SelectEstados';
import { renderEstadoVehiculo } from '../../../utils/renderEstadoVehiculo';
import { useToastFeedback } from '../../../customHooks/useToastFeedback';

const UpdateVehiculo = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { modelos, proveedoresGPS, sucursales, estados } = useSelector(state => state.generalesReducer);
  const { username } = useSelector(state => state.loginReducer);
  const { vehiculo, isError, isSuccess, isLoading, message } = useSelector(state => state.vehiculosReducer);

  const [form, setForm] = useState({
    usuario: username,
    modelo: '',
    nro_chasis: '',
    nro_motor: '',
    kilometros: '',
    proveedor_gps: '',
    nro_serie_gps: '',
    dispositivo: '',
    meses_amortizacion: '',
    dominio: '',
    color: '',
    calcomania: 0,
    gnc: 0,
    sucursal: '',
    estado: '',
    polarizado: '',
    cubre_asiento: ''
  });

  useEffect(() => {
    dispatch(getModelos());
    dispatch(getProveedoresGPS());
    dispatch(getSucursales()),
    dispatch(getEstados())
    dispatch(getVehiculosById({id: id}));
  }, [id]);

  useEffect(() => {
    if (vehiculo) {
      setForm({
        usuario: username,
        modelo: vehiculo[0].modelo || '',
        nro_chasis: vehiculo[0].nro_chasis || '',
        nro_motor: vehiculo[0].nro_motor || '',
        kilometros: vehiculo[0].kilometros_actuales || '',
        proveedor_gps: vehiculo[0].proveedor_gps || '',
        nro_serie_gps: vehiculo[0].nro_serie_gps || '',
        dispositivo: vehiculo[0].dispositivo_peaje || '',
        meses_amortizacion: vehiculo[0].meses_amortizacion || '',
        color: vehiculo[0].color || '',
        calcomania: vehiculo[0].calcomania || 0,
        gnc: vehiculo[0].gnc || 0,
        polarizado: vehiculo[0].polarizado || 0,
        cubre_asiento: vehiculo[0].cubre_asiento || 0,
        sucursal: vehiculo[0].sucursal || '',
        estado: vehiculo[0].estado_actual || '',
        dominio: vehiculo[0].dominio ? vehiculo[0].dominio : ""
        
      });
    }
  }, [vehiculo]);

useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
  });

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
  };

  const customStyles = {
  container: (provided) => ({
    ...provided,
    width: '16rem',
  })
};

  return (
    <div>
      <div className={styles.container}>
        <ToastContainer />
        {isLoading && (
          <div className={styles.spinnerOverlay}>
            <ClipLoader size={60} color="#800020" loading={true} />
            <p className={styles.loadingText}>Cargando...</p>
          </div>
        )}
        <h2 style={{display: "flex", alignItems: "center"}}>
          Modificar datos del vehículo: {vehiculo && vehiculo[0]?.dominio ? vehiculo[0]?.dominio : 
    vehiculo && vehiculo[0]?.dominio_provisorio ? vehiculo[0]?.dominio_provisorio + " (PROVISORIO)" : ""} {vehiculo && renderEstadoVehiculo(vehiculo[0], "grande")}
        </h2>
        <form className={styles.form}>
        <fieldset className={styles.fieldSet}>
        <legend>Datos generales del vehículo</legend>
          <div className={styles.inputContainer}>
            <span>Modelo</span>
            <select name="modelo" value={form.modelo} onChange={handleChange}>
              <option value="">Seleccione un modelo</option>
              {modelos?.map((m) => (
                <option key={m.id} value={m.id}>{m.nombre}</option>
              ))}
            </select>
          </div>
          
            {
              vehiculo?.length && !vehiculo[0]["dominio"] &&
              <div className={styles.inputContainer}>
                <span>Dominio</span>
                <input type="text" name="dominio" value={form.dominio} onChange={handleChange} />
              </div>
              
            }
            <div className={styles.inputContainer}>
            <span>Estado</span>
            <SelectEstados
            estados={estados}
            value={form.estado}
            onChange={(value) =>
            setForm((prev) => ({
            ...prev,
            estado: value
            }))
            }
            />
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
            <span>Kilómetros actuales</span>
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

          <div className={styles.inputContainer}>
            <span>Polarizado</span>
            <input
            type="checkbox"
            name="polarizado"
            checked={form.polarizado === 1}
            onChange={handleCheckChange}
            />
          </div>

          <div className={styles.inputContainer}>
            <span>Cubre asiento</span>
            <input
            type="checkbox"
            name="cubre_asiento"
            checked={form.cubre_asiento === 1}
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