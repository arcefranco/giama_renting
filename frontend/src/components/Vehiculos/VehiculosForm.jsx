import React from 'react'
import styles from './VehiculosForm.module.css'

const VehiculosForm = () => {
  return (
    <div>
      <div className={styles.container}>
        <h2>Formulario de ingreso de vehiculos</h2>
        <form action="" className={styles.form}>
        <div className={styles.inputContainer}>
          <span>Modelo</span>
          <select name="" id=""></select>
        </div>
        <div className={styles.inputContainer}>
          <span>Dominio</span>
          <input type="text" />
        </div>
        <div className={styles.inputContainer}>
          <span>Nro. Chasis</span>
          <input type="text" />
        </div>
        <div className={styles.inputContainer}>
        <span>Nro. Motor</span>
        <input type="text" />
        </div>
        <div className={styles.inputContainer}>
        <span>Kilometros</span>
        <input type="text" />
        </div>
        <div className={styles.inputContainer}>
        <span>Proveedor GPS</span>
        <select name="" id=""></select>
        </div>
        <div className={styles.inputContainer}>
        <span>Nro. Serie GPS</span>
        <input type="text" />
        </div>
        <div className={styles.inputContainer}>
        <span>Dispositivo Peaje</span>
        <input type="text" />
        </div>
        <div className={styles.inputContainer}>
        <span>Meses amortización</span>
        <input type="text" />
        </div>
        <div className={styles.inputContainer}>
        <span>Color</span>
        <input type="text" />
        </div>
        <div className={styles.inputContainer}>
        <span>Cargar imagenes</span>
        <input lang='es' type="file" multiple/>
        </div>
        </form>
        <button className={styles.sendBtn}>Enviar</button>
      </div>
    </div>
  )
}

export default VehiculosForm