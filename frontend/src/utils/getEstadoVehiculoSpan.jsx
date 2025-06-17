export const getEstadoVehiculoSpan = (vehiculo) => {
  const baseStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "16px",
    borderRadius: "4px",
    width: "10rem",
    height: "1rem",
    padding: "3px 6px",
    marginLeft: ".5rem",
    color: "#fff"
  };

  if (vehiculo?.fecha_venta) {
    return (
      <span style={{ ...baseStyle, background: "#6fd66ab0"}}>
        Vendido
      </span>
    );
  }

   else if (vehiculo?.vehiculo_alquilado === 1) {
    return (
      <span style={{ ...baseStyle, background: "#6f8babb0"}}>
        Alquilado
      </span>
    );
  }

  else if (
    vehiculo?.estado_actual == 2 
  ) {
    return (
      <span style={{ ...baseStyle, background: "#ffa809a1" }}>Listo para alquilar</span>
    );
  }
else if (
    vehiculo?.estado_actual == 3
  ) {
    return (
      <span style={{ ...baseStyle, background: "black" }}>En reparación</span>
    );
  }
else if (
    vehiculo?.estado_actual == 4
  ) {
    return (
      <span style={{ ...baseStyle, background: "#61c2ff" }}>Seguro a recuperar</span>
    );
  }
else if (vehiculo?.estado_actual == 1) {
  return (
    <span style={{ ...baseStyle, background: "#ff0909a1", color: "#fff" }}>
      Sin preparar
    </span>
  );
  
}
else  {
  return (
    <span style={{ ...baseStyle, background: "#ccc", color: "#fff" }}>
      Sin estado disponible
    </span>
  );
  
}
};
