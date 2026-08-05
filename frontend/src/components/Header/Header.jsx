import { Link } from "react-router-dom";
import styles from "./Header.module.css"
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { logOut } from "../../reducers/Login/loginSlice";
import { getContratosAVencer } from "../../reducers/Alquileres/alquileresSlice";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import notification from "../../assets/notification.svg"

const menuItems = [
  {
    title: "Vehículos",
    items: [
      { label: "Ingreso de vehículos", to: "/vehiculos", roles: ["1"] },
      { label: "Listado vehículos", to: "/vehiculosReporte", roles: ["2", "3", "4", "5"] },
      { label: "Listado fichas", to: "/vehiculos/ficha/reporte", roles: ["4", "5"] },
      { label: "Situación de la flota", to: "/vehiculos/situacionFlota", roles: ["4", "5"] },
      { label: "Importación masiva de vehículos", to: "/vehiculos/importacionMasiva", roles: ["1"] }
    ],
  },
  {
    title: "Clientes",
    items: [
      { label: "Ingreso de clientes", to: "/clientes", roles: ["2", "3"] },
      { label: "Listado de clientes", to: "/clientesReporte", roles: ["2", "3", "4"] },
      { label: "Cta cte clientes", to: "/pagosClientes", roles: ["2", "3", "4", "5"] },
      { label: "Ficha cta cte", to: "/fichaCtaCte", roles: ["2", "3", "4", "5"] },
    ]
  },
  {
    title: "Alquileres",
    items: [
      { label: "Alta de contrato", to: "/alquileres/contrato", roles: ["2"] },
      { label: "Listado de alquileres", to: "/alquileres/reporte", roles: ["2", "3", "5"] },
      { label: "Listado de contratos", to: "/alquileres/contrato/reporte", roles: ["2", "3", "5"] },
    ]
  },
  {
    title: "Parámetros",
    items: [
      { label: "Formas de cobro", to: "/alquileres/formasDeCobro", roles: ["1"] },
      { label: "Conceptos de ingresos", to: "/costos/alta/ingresos", roles: ["1"] },
      { label: "Conceptos de egresos", to: "/costos/alta/egresos", roles: ["1"] },
      { label: "Modelos", to: "/parametros/modelos", roles: ["1"] },
      { label: "Proveedores GPS", to: "/parametros/proveedoresGPS", roles: ["1"] },
      { label: "Sucursales", to: "/parametros/sucursales", roles: ["1"] }
    ]
  },
  {
    title: "Costos/Ingresos",
    items: [
      { label: "Carga de ingresos", to: "/costos/ingresos", roles: ["2"] },
      { label: "Ingresos x seguros", to: "/costos/ingresos_seguros", roles: ["2"] },
      { label: "Carga de egresos", to: "/costos/egresos", roles: ["2"] },
      { label: "Carga de egresos prorrateados", to: "/costos/prorrateo", roles: ["2"] },
      { label: "Listado de recibos", to: "/recibos/reporte" },
      { label: "Importación de multas", to: "/costos/importaciones", roles: ["2", "3", "4"] },
      { label: "Importación de telepases", to: "/costos/importacionTelepases", roles: ["2", "3", "4"] },
    ]
  },
  ,
  {
    title: "Usuarios",
    items: [
      { label: "Crear usuario", to: "/usuarios/alta", roles: ["1"] },
      { label: "Alta de alertas", to: "/usuarios/alertas" }
    ]
  }
];


const Header = () => {
  const { roles, nombre, username, alertas } = useSelector((state) => state.loginReducer)
  const { contratosAVencer } = useSelector((state) => state.alquileresReducer)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const handleLogout = () => {
    dispatch(logOut()).then(() => {
      navigate("/");
    });
  };
  const hasAccess = (itemRoles) => {
    if (!itemRoles || itemRoles.length === 0) return true;

    // roles viene como string: "2,4"
    const userRoles = roles ? roles.split(",") : [];

    // admin siempre pasa
    if (userRoles.includes("1")) return true;

    return userRoles.some((r) => itemRoles.includes(r));
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>Giama Renting</div>

      <nav className={styles.nav}>
        <ul className={styles.menu}>
          {menuItems.map((item, idx) => {
            return (
              <li className={styles.menuItem} key={idx}>
                {item.title}
                <div className={styles.dropdown}>
                  <ul>
                    {item.items.map((subitem, i) => {
                      const disabled = !hasAccess(subitem.roles);

                      return (
                        <li key={i} className={disabled ? styles.disabled : ""}>
                          {disabled ? (
                            <span style={{ color: "darkgray" }}>{subitem.label}</span>
                          ) : (
                            <Link to={subitem.to}>{subitem.label}</Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>


      <div className={styles.userSection}>
        {
          (roles.includes("1") || roles.includes("2") || roles.includes("3")) &&
          <div className={styles.notifItem}>
            <img style={{ width: "32px" }} src={notification} alt="" />
            <div className={styles.dropdownNotif}>
              {
                contratosAVencer.length ?
                  `Contratos a una semana o menos de vencer: ${contratosAVencer?.length}`
                  :
                  `No hay contratos a una semana (o menos) de vencer`
              }
              {
                contratosAVencer?.length ?
                  <div className={styles.containerBtnNotif} style={{
                    display: "flex",
                    justifyContent: "space-around"
                  }}>
                    <button onClick={() => navigate("/alquileres/contrato/reporte/a-vencer")}>Ir</button>
                    <button onClick={() => dispatch(getContratosAVencer())}>Actualizar</button>
                  </div> : ""
              }
              {
                alertas?.length ?
                  alertas.map(e => {
                    return <span>{e.alerta}</span>
                  }) : ""
              }
            </div>
          </div>

        }
        {nombre && <span>Hola, {nombre}</span>}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Salir
        </button>
      </div>
    </header>
  );
};

export default Header;