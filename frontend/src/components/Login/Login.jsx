import React, {useState, useEffect} from 'react';
import styles from './Login.module.css';
import tick from '../../assets/tick.png';
import cross from '../../assets/cross.png';
import Eye from '../../assets/Eye.svg';
import EyeHidden from '../../assets/Eye-Hidden.svg';
import Car from "../../assets/Vector.svg"
import { logIn } from '../../reducers/Login/loginSlice'; 
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
const Login = () => {
const dispatch = useDispatch(); 
const {status, message} = useSelector(state => state.loginReducer.status) 
  const [email, setEmail] = useState("");
  const [isValidEmail, setIsValidEmail] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
useEffect(() => {

    if(!status){
      toast.error(message, {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        })
    }
    

  }, [status]) 
  const validateEmail = (value) => {
    setEmail(value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleSubmit = (e) => {
      e.preventDefault()
      dispatch(logIn({
        email: email,
        password: password
       }))
  }
  return (
    <div className={styles.container}>
    <ToastContainer /> 
    <div className={`${styles.elipse} ${styles.elipseSuperiorIzquierda}`}></div>
    <div className={`${styles.elipse} ${styles.elipseInferiorDerecha}`}></div>
    <h1 className={styles.title}>Giama Renting</h1>
    <div className={styles.loginForm}>
        <div className={styles.formHeader}>Iniciar sesión</div>
        <div className={styles.formContent}>
        <div className={styles.inputWrapper}>
            <input
              className={styles.input}
              type="text"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => validateEmail(e.target.value)}
              onBlur={() => setIsValidEmail(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))}
            />
            {email && (
              <img
                src={isValidEmail ? tick : cross}
                alt={isValidEmail ? "Válido" : "Inválido"}
                className={styles.inputIcon}
              />
            )}
          </div>
          <div className={styles.inputWrapper}>
            <input
              className={styles.input}
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <img
              src={showPassword ? EyeHidden : Eye}
              alt="Mostrar/Ocultar contraseña"
              className={styles.inputIcon}
              onClick={togglePasswordVisibility}
            />
          </div>
          <a className={styles.a} href="/recovery">¿Olvidaste tu contraseña?</a>
          {
            isValidEmail ?
          <button className={styles.button} onClick={handleSubmit}>Ingresar</button>
          :
          <button className={styles.buttonDisabled}>Ingresar</button>
          }
        </div>
      </div>
    <div className={styles.svg}><img src={Car} alt="" /></div>
  </div>
  )
}

export default Login