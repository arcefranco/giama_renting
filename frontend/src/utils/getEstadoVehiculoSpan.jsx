export const getEstadoVehiculoSpan = (vehiculo) => {
  const baseStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "16px",
    borderRadius: "4px",
    width: "6rem",
    height: "1rem",
    padding: "3px 6px",
  };

  if (vehiculo.fecha_venta) {
    return (
      <span style={{ ...baseStyle, background: "#6fd66ab0", color: "#fff" }}>
        Vendido
      </span>
    );
  }

  if (vehiculo.vehiculo_alquilado === 1) {
    return (
      <span style={{ ...baseStyle, background: "#6f8babb0", color: "#fff" }}>
        Alquilado
      </span>
    );
  }

  if (
    vehiculo.proveedor_gps !== 0 &&
    vehiculo.nro_serie_gps !== 0 &&
    vehiculo.calcomania !== 0 &&
    vehiculo.gnc !== 0
  ) {
    return (
      <span style={{ ...baseStyle, background: "#ffa809a1" }}>Preparado</span>
    );
  }

  return (
    <span style={{ ...baseStyle, background: "#ff0909a1", color: "#fff" }}>
      Sin preparar
    </span>
  );
};
