import React, { useState, useEffect, useRef } from 'react'
import { useMatch } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify';
import DataGrid, { Column } from "devextreme-react/data-grid"
import { ClipLoader } from "react-spinners";
import styles from "./AltaCostos.module.css"
import {
  getCuentasContables, postConceptoCostos,
  reset, getConceptosCostos, deleteConcepto
} from '../../reducers/Costos/costosSlice'
import { locale } from 'devextreme/localization';
import 'devextreme/dist/css/dx.carmine.css';
import Swal from 'sweetalert2';
import { useToastFeedback } from '../../customHooks/useToastFeedback.jsx';
import Select from 'react-select';

const AltaCostos = () => {
  const dispatch = useDispatch()
  const isIngresos = useMatch("/costos/alta/ingresos");
  const isEgresos = useMatch("/costos/alta/egresos");
  useEffect(() => {
    Promise.all([
      dispatch(getConceptosCostos()),
      dispatch(getCuentasContables()),
      locale('es')
    ])
  }, [])

  const { isError, isSuccess, isLoading, message, cuentasContables, conceptos } = useSelector((state) => state.costosReducer)
  const [form, setForm] = useState({
    nombre: '',
    cuenta_contable: '',
    cuenta_secundaria: '',
    ingreso_egreso: '',
    genera_recibo: 0,
    genera_factura: 0,
    activable: 0
  })
  const [conceptosFiltrados, setConceptosFiltrados] = useState([])
  useEffect(() => {
    if (conceptos.length) {
      if (isEgresos) {
        setConceptosFiltrados(conceptos?.filter(e => e.ingreso_egreso === "E"))
      }
      else if (isIngresos) {
        setConceptosFiltrados(conceptos?.filter(e => e.ingreso_egreso === "I"))
      }
      else {
        setConceptosFiltrados(conceptos)
      }
    }
  }, [conceptos, isEgresos, isIngresos])
  const [tipo, setTipo] = useState(null)
  useToastFeedback({
    isError,
    isSuccess,
    message,
    resetAction: reset,
    onSuccess: () => {
      setForm({
        nombre: '',
        cuenta_contable: '',
        cuenta_secundaria: '',
        ingreso_egreso: '',
        genera_factura: 0,
        genera_recibo: 0,
        activable: 0
      })
    }
  })
  useEffect(() => {
    if (isEgresos) {
      setTipo("E")
      setForm({
        ...form,
        ingreso_egreso: "E"
      })
    }
    else if (isIngresos) {
      setTipo("I")
      setForm({
        ...form,
        ingreso_egreso: "I",
        activable: 0
      })
    }
    else {
      setTipo(null)
      setForm({
        nombre: '',
        cuenta_contable: '',
        cuenta_secundaria: '',
        ingreso_egreso: '',
        activable: 0
      })
    }

  }, [isEgresos, isIngresos, tipo])
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });

  };
  const handleCheckChange = (e) => {
    const { name, checked } = e.target;
    setForm(prevForm => ({
      ...prevForm,
      [name]: checked ? 1 : 0
    }));
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(postConceptoCostos(form))
  }
  const handleActualizar = () => {
    dispatch(getConceptosCostos())
  }
  const customStylesCuenta = {
    container: (provided) => ({
      ...provided,
      width: '10rem',
      fontSize: "10px"
    })
  };
  const renderModificarCell = (data) => {
    return (
      <button
        onClick={() => window.open(`${import.meta.env.VITE_BASENAME}costos/conceptos/${data.data.id}`, '_blank')}
        style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Modificar
      </button>
    );
  };

  const renderCuentaContable = (data) => {
    return <div style={{
      display: "flex",
      justifyContent: "space-evenly",
    }}>
      <span>{data.data.cuenta_contable}</span>
      <span>{" "}</span>
      <span style={{ width: "5rem" }}>{cuentasContables.find(e => e.Codigo == data.data.cuenta_contable)?.Nombre}</span>
    </div>
  }

  const handleDeleteClick = (id) => {
    Swal.fire({
      title: '¿Seguro que querés eliminar este concepto?',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      icon: 'warning',
      didOpen: () => {
        document.body.classList.remove('swal2-height-auto');
      }
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteConcepto({ id: id }));
      }
    });
  };
  const renderEliminarCell = (data) => {
    return (
      <button
        onClick={() => handleDeleteClick(data.data.id)}
        style={{ color: '#1976d2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Eliminar
      </button>
    );
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
        <h2>Conceptos de {isEgresos ? "egresos" : isIngresos ? "ingresos" : ""}</h2>
        <button onClick={handleActualizar} className={styles.refreshButton}>
          🔄 Actualizar
        </button>
        <DataGrid
          className={styles.dataGrid}
          dataSource={conceptosFiltrados || []}
          showBorders={true}
          style={{ fontFamily: "IBM" }}
          rowAlternationEnabled={true}
          height={300}
          columnAutoWidth={true}>
          <Column dataField="nombre" width={200} caption="Nombre" alignment="left" />
          <Column dataField="cuenta_contable" width={400} caption="Cuenta contable" alignment="center" cellRender={renderCuentaContable} />
          <Column dataField="cuenta_secundaria" width={100} caption="Cuenta secundaria" alignment="center" />
          {
            tipo === "E" &&
            <Column dataField="activable" width={100} caption="Es activable"
              alignment="center" cellRender={(data) => {
                return data.data.activable == 1 ? "Sí" : "No"
              }} />
          }
          {
            tipo === "I" &&
            <Column dataField="genera_recibo" caption="Genera recibo" width={100} alignment="center" cellRender={(data) => {
              return data.data.genera_recibo == 1 ? "Sí" : "No"
            }} />
          }
          {
            tipo === "I" &&
            <Column dataField="genera_factura" caption="Genera factura" width={100} alignment="center" cellRender={(data) => {
              return data.data.genera_factura == 1 ? "Sí" : "No"
            }} />
          }
          <Column dataField="id" width={100} caption="" alignment="center" cellRender={renderModificarCell} />
          <Column dataField="id" width={100} caption="" alignment="center" cellRender={renderEliminarCell} />
        </DataGrid>
        <h2>Alta de conceptos de {isEgresos ? "egresos" : isIngresos ? "ingresos" : ""}</h2>
        <form action="" enctype="multipart/form-data" className={styles.form}>
          <div className={styles.inputContainer}>
            <span>Concepto</span>
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
          </div>
          {
            tipo === "E" &&
            <div className={styles.inputContainer} style={{
              flexDirection: "row",
              alignItems: "anchor-center"
            }}>
              <span>Gasto activable</span>
              <input name='activable'
                checked={form["activable"] === 1} onChange={handleCheckChange} type="checkbox" />
            </div>
          }
          {
            tipo === "I" &&
            <div className={styles.inputContainer} style={{
              flexDirection: "row",
              alignItems: "anchor-center"
            }}>
              <span>Genera factura</span>
              <input name='genera_factura'
                checked={form["genera_factura"] === 1} onChange={handleCheckChange} type="checkbox" />
            </div>
          }
          {
            tipo === "I" &&
            <div className={styles.inputContainer} style={{
              flexDirection: "row",
              alignItems: "anchor-center"
            }}>
              <span>Genera recibo</span>
              <input name='genera_recibo'
                checked={form["genera_recibo"] === 1} onChange={handleCheckChange} type="checkbox" />
            </div>
          }
        </form>
        <button
          className={styles.sendBtn} onClick={handleSubmit}
          disabled={!form["cuenta_contable"] || !form["nombre"] || !form["ingreso_egreso"]}>
          Enviar
        </button>
      </div>
    </div>
  )
}

export default AltaCostos