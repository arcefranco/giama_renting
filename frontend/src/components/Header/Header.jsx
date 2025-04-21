import { Link } from "react-router-dom";
import styles from "./Header.module.css"
import axios from "axios";

const menuItems = [
  {
    title: "Vehículos",
    submenus: [
      {
        title: "Logística",
        items: [
          { label: "Formulario de ingreso", to: "/vehiculos" },
          { label: "Reporte vehículos", to: "/vehiculosReporte" }
        ]
      },
      {
        title: "Por marca",
        items: [
          { label: "Ford", to: "/vehiculos/ford" },
          { label: "Chevrolet", to: "/vehiculos/chevrolet" }
        ]
      }
    ]
  },
  {
    title: "Clientes",
    items: [
      { label: "Listado", to: "/clientes/listado" },
      { label: "Nuevo Cliente", to: "/clientes/nuevo" }
    ]
  }
];

const Header = () => {
const handleLogout = async () => {
        await axios.get(import.meta.env.VITE_REACT_APP_HOST + "login/logout", {
          withCredentials: true,
        });
        localStorage.removeItem("username");
        window.location.replace("/");
      };
const username = JSON.parse(localStorage.getItem("username")); // ej: "farce@giama.com.ar"
const nombreUsuario = username?.split("@")[0];
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Giama Renting</div>

      <nav className={styles.nav}>
        <ul className={styles.menu}>
          {menuItems.map((item, idx) => (
            <li className={styles.menuItem} key={idx}>
              {item.title}
              <div className={styles.dropdown}>
                {item.submenus ? (
                  item.submenus.map((submenu, i) => (
                    <div className={styles.dropdownColumn} key={i}>
                      <h4>{submenu.title}</h4>
                      <ul>
                        {submenu.items.map((subitem, j) => (
                          <li key={j}>
                            <Link to={subitem.to}>{subitem.label}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <ul>
                    {item.items.map((subitem, i) => (
                      <li key={i}>
                        <Link to={subitem.to}>{subitem.label}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.userSection}>
        <span>Hola, {nombreUsuario}</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>Salir</button>
      </div>
    </header>
  );
};

export default Header;