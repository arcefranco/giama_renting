import { Link } from "react-router-dom";
import styles from "./Header.module.css"

const menuItems = [
  {
    title: "Vehículos",
    submenus: [
      {
        title: "Por tipo",
        items: [
          { label: "Autos", to: "/vehiculos/autos" },
          { label: "Camionetas", to: "/vehiculos/camionetas" }
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
        <span>Hola, Usuario</span>
        <button className={styles.logoutBtn}>Salir</button>
      </div>
    </header>
  );
};

export default Header;