import { Link } from "react-router-dom";
import styles from "./Header.module.css"
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { logOut } from "../../reducers/Login/loginSlice";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  {
    title: "Vehículos",
    items: [
      { label: "Ingreso de vehículos", to: "/vehiculos", roles: ["2"] },
      { label: "Listado vehículos", to: "/vehiculosReporte" },
      { label: "Listado fichas", to: "/vehiculos/ficha/reporte" },
      { label: "Situación de la flota", to: "/vehiculos/situacionFlota" },
      { label: "Importación masiva de vehículos", to: "/vehiculos/importacionMasiva", roles: ["2"] }
    ],
    /*     submenus: [
          {
            title: "Logística",
            items: [
              { label: "Formulario de ingreso", to: "/vehiculos" },
              { label: "Reporte vehículos", to: "/vehiculosReporte" },
              { label: "Reporte fichas de vehículos", to: "/vehiculos/ficha/reporte" }
            ]
          }, */
    /*       {
            title: "Por marca",
            items: [
              { label: "Ford", to: "/vehiculos/ford" },
              { label: "Chevrolet", to: "/vehiculos/chevrolet" }
            ]
          } */
    /*   ] */
  },
  {
    title: "Clientes",
    items: [
      { label: "Ingreso de clientes", to: "/clientes", roles: ["3"] },
      { label: "Listado de clientes", to: "/clientesReporte" },
    ]
  },
  {
    title: "Alquileres",
    items: [
      { label: "Alta de contrato", to: "/alquileres/contrato", roles: ["3"] },
      { label: "Listado de alquileres", to: "/alquileres/reporte" },
      { label: "Listado de contratos", to: "/alquileres/contrato/reporte" },

    ]
  },
  {
    title: "Parámetros",
    items: [
      { label: "Formas de cobro", to: "/alquileres/formasDeCobro", roles: ["2"] },
      { label: "Conceptos de ingresos", to: "/costos/alta/ingresos", roles: ["2"] },
      { label: "Conceptos de egresos", to: "/costos/alta/egresos", roles: ["2"] },
      { label: "Modelos", to: "/parametros/modelos" },
      { label: "Proveedores GPS", to: "/parametros/proveedoresGPS" },
      { label: "Sucursales", to: "/parametros/sucursales" }
    ]
  },
  {
    title: "Costos/Ingresos",
    items: [
      { label: "Carga de ingresos", to: "/costos/ingresos", roles: ["2"] },
      { label: "Carga de egresos", to: "/costos/egresos", roles: ["2"] },
      { label: "Carga de egresos prorrateados", to: "/costos/prorrateoIE", roles: ["2"] },
      { label: "Listado de recibos", to: "/recibos/reporte" }
    ]
  },
  ,
  {
    title: "Usuarios",
    items: [
      { label: "Crear usuario", to: "/usuarios/alta", roles: ["1"] }
    ]
  }
];


const Header = () => {
  const { roles, nombre, username } = useSelector((state) => state.loginReducer)
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
        {nombre && <span>Hola, {nombre}</span>}
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Salir
        </button>
      </div>
    </header>
  );
};

export default Header;