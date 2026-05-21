import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ToastContainer } from 'react-toastify';
import { postAlerta, reset } from '../../../reducers/Login/loginSlice';
import { getUsuarios } from '../../../reducers/Generales/generalesSlice.js';
import styles from "./Alertas.module.css"
import { useToastFeedback } from '../../../customHooks/useToastFeedback.jsx';
import { ClipLoader } from 'react-spinners';


const Alertas = () => {
    const dispatch = useDispatch()
    const { isError, isSuccess, isLoading, message } = useSelector((state) => state.loginReducer)
    const { usuarios } = useSelector((state) => state.generalesReducer)
    const [form, setForm] = useState({
        fecha: '',
        alerta: '',
        usuario: ''
    })
    useEffect(() => {
        dispatch(getUsuarios())
    }, [])

    useToastFeedback({
        isError,
        isSuccess,
        message,
        resetAction: reset,
        onSuccess: () => {
            dispatch(reset())
            setForm({
                fecha: '',
                alerta: '',
                usuario: ''
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(postAlerta(form))
    }


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
                <h2>Alta de alertas</h2>
                <form action="" enctype="multipart/form-data" className={styles.form}>
                    <div className={styles.inputContainer}>
                        <span>Usuario</span>
                        <select name="usuario" value={form.usuario} onChange={handleChange}>
                            <option value="">Seleccione un usuario</option>
                            {
                                usuarios?.length && usuarios.map(e => {
                                    return <option value={e.id}>{e.nombre}</option>
                                })
                            }
                        </select>
                    </div>
                    <div className={styles.inputContainer}>
                        <span>Fecha</span>
                        <input type="date" name='fecha' value={form["fecha"]}
                            onChange={handleChange} />
                    </div>
                    <div className={styles.inputContainer}>
                        <span>Alerta</span>
                        <textarea type="text" name='alerta' value={form["alerta"]}
                            onChange={handleChange} />
                    </div>
                </form>
                <button
                    className={styles.sendBtn} onClick={handleSubmit}
                    disabled={!form["usuario"] || !form["fecha"] || !form["alerta"]}>
                    Enviar
                </button>
            </div>
        </div>
    )
}

export default Alertas