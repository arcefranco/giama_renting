import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer } from 'react-toastify';
import { getSucursales } from "../../../reducers/Generales/generalesSlice.js"
import { postSucursal, reset } from '../../../reducers/Parametros/parametrosSlice.js';
import { ClipLoader } from "react-spinners";
import styles from "./../Parametros.module.css"
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx';
import DataGrid, { Column } from "devextreme-react/data-grid"
import Swal from 'sweetalert2';

const Sucursales = () => {
  const dispatch = useDispatch()
  const { isError, isSuccess, isLoading, message } = useSelector((state) => state.parametrosReducer)
  const { isLoading: isLoadingSucursales } = useSelector((state) => state.generalesReducer)
  const { sucursales } = useSelector((state) => state.generalesReducer)
  const [form, setForm] = useState({
    nombre: '',
  })
  useEffect(() => {
    Promise.all([
      dispatch(getSucursales()),
    ])
  }, [])

  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
    onSuccess: () => {
      dispatch(reset())
      dispatch(getSucursales())
      setForm({
        nombre: '',
      })
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  }

  const handleActualizar = () => {
    dispatch(getSucursales())
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postSucursal(form))
  }

  const renderModificarCell = (data) => {
    return (
      <button
        onClick={() => window.open(`${import.meta.env.VITE_BASENAME}parametros/sucursales/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Modificar
      </button>
    );
  };


  return (
    <div>
      <div className={styles.container}>
        <ToastContainer />
        {(isLoading || isLoadingSucursales) && (
          <div className={styles.spinnerOverlay}>
            <ClipLoader
              size={60}
              color="#800020" // bordó
              loading={true}
            />
            <p className={styles.loadingText}>Cargando...</p>
          </div>
        )}
        <h2>Sucursales</h2>
        <button onClick={handleActualizar} className={styles.refreshButton}>
          🔄 Actualizar
        </button>
        <DataGrid
          className={styles.dataGrid}
          dataSource={sucursales || []}
          showBorders={true}
          style={{ fontFamily: "IBM" }}
          rowAlternationEnabled={true}
          allowColumnResizing={true}
          height={300}
          columnAutoWidth={true}>
          <Column dataField="nombre" caption="Nombre" />
          <Column dataField="id" width={100} caption="" alignment="center" cellRender={renderModificarCell} />
        </DataGrid>
        <h2>Alta de sucursal</h2>
        <form action="" enctype="multipart/form-data" className={styles.form}>
          <div className={styles.inputContainer}>
            <span>Nombre</span>
            <input type="text" name='nombre' value={form["nombre"]}
              onChange={handleChange} />
          </div>
        </form>
        <button
          className={styles.sendBtn} onClick={handleSubmit}
          disabled={!form["nombre"]}>
          Enviar
        </button>
      </div>
    </div>
  )
}

export default Sucursales