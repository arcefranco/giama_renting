import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer } from 'react-toastify';
import { getModelosVehiculos, postModelo, reset } from '../../../reducers/Parametros/parametrosSlice.js';
import { ClipLoader } from "react-spinners";
import styles from "./../Parametros.module.css"
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx';
import DataGrid, { Column } from "devextreme-react/data-grid"


const Modelos = () => {
  const dispatch = useDispatch()
  const { isError, isSuccess, isLoading, message, modelos } = useSelector((state) => state.parametrosReducer)
  const [form, setForm] = useState({
    nombre: '',
    precio: 0,
  })
  useEffect(() => {
    Promise.all([
      dispatch(getModelosVehiculos()),
    ])
  }, [])

  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
    onSuccess: () => {
      dispatch(reset())
      dispatch(getModelosVehiculos())
      setForm({
        nombre: '',
        precio: 0
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

  const handleChangeNumbers = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" && value !== "" ? parseFloat(value) : 0;

    let newForm = { ...form, [name]: parsedValue };
    setForm(newForm);


  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postModelo(form))
  }

  const handleActualizar = () => {
    dispatch(getModelosVehiculos())
  }

  const renderFecha = (data) => {
    if (data.value) {
      let fechaSplit = data?.value?.split("-")
      return `${fechaSplit[2]}/${fechaSplit[1]}/${fechaSplit[0]}`
    }
  }
  const renderModificarCell = (data) => {
    return (
      <button
        onClick={() => window.open(`${import.meta.env.VITE_BASENAME}parametros/modelos/${data.data.id_modelo}`, '_blank')}
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
        {isLoading && (
          <div className={styles.spinnerOverlay}>
            <ClipLoader
              size={60}
              color="#800020" // bordó
              loading={true}
            />
            <p className={styles.loadingText}>Cargando...</p>
          </div>
        )}
        <h2>Modelos</h2>
        <button onClick={handleActualizar} className={styles.refreshButton}>
          🔄 Actualizar
        </button>
        <DataGrid
          className={styles.dataGrid}
          dataSource={modelos || []}
          showBorders={true}
          style={{ fontFamily: "IBM" }}
          rowAlternationEnabled={true}
          allowColumnResizing={true}
          height={300}
          columnAutoWidth={true}>
          <Column dataField="nombre_modelo" caption="Nombre" />
          <Column dataField="precio" caption="Precio" />
          <Column dataField="vigencia_desde" alignment="center" caption="Vigencia desde" cellRender={renderFecha} />
          <Column dataField="id_modelo" width={100} caption="" alignment="center" cellRender={renderModificarCell} />
        </DataGrid>
        <h2>Alta de modelos</h2>
        <form action="" enctype="multipart/form-data" className={styles.form}>
          <div className={styles.inputContainer}>
            <span>Nombre</span>
            <input type="text" name='nombre' value={form["nombre"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Precio</span>
            <input type="number" name='precio' value={form["precio"]}
              onChange={handleChangeNumbers} />
          </div>
        </form>
        <button
          className={styles.sendBtn} onClick={handleSubmit}
          disabled={!form["precio"] || !form["nombre"]}>
          Enviar
        </button>
      </div>
    </div>
  )
}

export default Modelos