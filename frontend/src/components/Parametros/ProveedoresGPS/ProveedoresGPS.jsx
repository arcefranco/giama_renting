import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer } from 'react-toastify';
import { getProveedoresGPS } from "../../../reducers/Generales/generalesSlice.js"
import { postProveedorGPS, reset } from '../../../reducers/Parametros/parametrosSlice.js';
import { ClipLoader } from "react-spinners";
import styles from "./../Parametros.module.css"
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx';
import DataGrid, { Column } from "devextreme-react/data-grid"


const ProveedoresGPS = () => {
  const dispatch = useDispatch()
  const { isError, isSuccess, isLoading, message } = useSelector((state) => state.parametrosReducer)
  const { isLoading: isLoadingProveedores } = useSelector((state) => state.generalesReducer)
  const { proveedoresGPS } = useSelector((state) => state.generalesReducer)
  const [form, setForm] = useState({
    nombre: '',
  })
  useEffect(() => {
    Promise.all([
      dispatch(getProveedoresGPS()),
    ])
  }, [])

  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
    onSuccess: () => {
      dispatch(reset())
      dispatch(getProveedoresGPS())
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
    dispatch(getProveedoresGPS())
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postProveedorGPS(form))
  }

  const renderModificarCell = (data) => {
    return (
      <button
        onClick={() => window.open(`${import.meta.env.VITE_BASENAME}parametros/proveedoresGPS/${data.data.id}`, '_blank')}
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
        {(isLoading || isLoadingProveedores) && (
          <div className={styles.spinnerOverlay}>
            <ClipLoader
              size={60}
              color="#800020" // bordó
              loading={true}
            />
            <p className={styles.loadingText}>Cargando...</p>
          </div>
        )}
        <h2>Proveedores GPS</h2>
        <button onClick={handleActualizar} className={styles.refreshButton}>
          🔄 Actualizar
        </button>
        <DataGrid
          className={styles.dataGrid}
          dataSource={proveedoresGPS || []}
          showBorders={true}
          style={{ fontFamily: "IBM" }}
          rowAlternationEnabled={true}
          allowColumnResizing={true}
          height={300}
          columnAutoWidth={true}>
          <Column dataField="nombre" caption="Nombre" />
          <Column dataField="id" width={100} caption="" alignment="center" cellRender={renderModificarCell} />
        </DataGrid>
        <h2>Alta de proveedores GPS</h2>
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

export default ProveedoresGPS