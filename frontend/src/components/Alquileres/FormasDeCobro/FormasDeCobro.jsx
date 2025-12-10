import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import { getCuentasContables } from '../../../reducers/Costos/costosSlice'
import { getFormasDeCobro, postFormaCobro, reset } from '../../../reducers/Alquileres/alquileresSlice'
import { ClipLoader } from "react-spinners";
import styles from "./FormasDeCobro.module.css"
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx'
import DataGrid, { Column } from "devextreme-react/data-grid"
import Select from "react-select"

const FormasDeCobro = () => {
  const dispatch = useDispatch()
  const { isError, isSuccess, isLoading, message, formasDeCobro } = useSelector((state) => state.alquileresReducer)
  const { cuentasContables } = useSelector((state) => state.costosReducer)
  const [form, setForm] = useState({
    nombre: '',
    cuenta_contable: '',
    cuenta_secundaria: ''
  })
  useEffect(() => {
    Promise.all([
      dispatch(getCuentasContables()),
      dispatch(getFormasDeCobro())
    ])
  }, [])

  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
    onSuccess: () => {
      dispatch(reset())
      setForm({
        nombre: '',
        cuenta_contable: '',
      })
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "cuenta_contable") {
      setForm({
        ...form,
        [name]: value,
        ["cuenta_secundaria"]: cuentasContables.find(e => e.Codigo == value)?.CuentaSecundaria
      })

    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }

  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postFormaCobro(form))
  }
  const customStylesCuenta = {
    container: (provided) => ({
      ...provided,
      width: '10rem',
      fontSize: "10px"
    })
  };

  const cuentasOptions = cuentasContables.map(e => ({
    value: e.Codigo,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <option key={e.Codigo} value={e.Codigo}>{e.Codigo} - {e.Nombre}</option>
      </div>
    ),
    searchKey: `${e.Nombre}`.toLowerCase(),
  }));
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
        <h2>Formas de cobro</h2>
        <DataGrid
          className={styles.dataGrid}
          dataSource={formasDeCobro || []}
          showBorders={true}
          style={{ fontFamily: "IBM" }}
          rowAlternationEnabled={true}
          allowColumnResizing={true}
          height={300}
          columnAutoWidth={true}>
          <Column dataField="nombre" caption="Nombre" />
          <Column dataField="cuenta_contable" caption="Cuenta contable" />
          <Column dataField="cuenta_secundaria" caption="Cuenta secundaria" />
        </DataGrid>
        <h2>Alta de formas de cobro</h2>
        <form action="" enctype="multipart/form-data" className={styles.form}>
          <div className={styles.inputContainer}>
            <span>Nombre</span>
            <input type="text" name='nombre' value={form["nombre"]}
              onChange={handleChange} />
          </div>
          <div className={styles.inputContainer}>
            <span>Cuenta contable</span>
            <Select

              options={cuentasOptions}
              placeholder="Seleccione una cuenta"
              value={form.cuenta_contable
                ? cuentasOptions.find(opt => opt.value == form.cuenta_contable)
                : null}
              onChange={(e) => {
                const selectedCuenta = cuentasContables?.find(c => c.Codigo === e.value);
                console.log(selectedCuenta)
                setForm({
                  ...form,
                  cuenta_contable: selectedCuenta.Codigo,
                  cuenta_secundaria: selectedCuenta.CuentaSecundaria
                });
              }}
              filterOption={(option, inputValue) =>
                option.data.searchKey.includes(inputValue.toLowerCase())
              }
              menuPlacement='top'
              styles={customStylesCuenta}
            />
            {/*               <select name="cuenta_contable"  value={form["cuenta_contable"]} 
              onChange={handleChange} id="">
                <option value={""} disabled selected>{"Seleccione una cuenta"}</option>
                {
                  cuentasContables?.length && cuentasContables?.map(e => {
                    return <option key={e.Codigo} value={e.Codigo}>{e.Codigo} - {e.Nombre}</option>
                  })
                }
              </select> */}
          </div>
          <div className={styles.inputContainer}>
            <span>Cuenta secundaria</span>
            <input type="text" name='cuenta_secundaria'
              value={form["cuenta_secundaria"]} disabled />
          </div>
        </form>
        <button
          className={styles.sendBtn} onClick={handleSubmit}
          disabled={!form["cuenta_contable"] || !form["nombre"]}>
          Enviar
        </button>
      </div>
    </div>
  )
}

export default FormasDeCobro