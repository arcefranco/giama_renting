import React from "react";
import { getColorByEstadoId, getNombreByEstadoId } from "./estadosVehiculoConfig.js";

export const renderEstadoVehiculo = (vehiculo) => {
  const baseStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "14px",
    borderRadius: "4px",
    width: "fit-content",
    padding: "4px 8px",
    marginLeft: ".5rem",
    color: "#fff"
  };

  if (vehiculo?.fecha_venta) {
    return <span style={{ ...baseStyle, background: "#6fd66ab0" }}>Vendido</span>;
  }

  if (vehiculo?.vehiculo_alquilado === 1) {
    return <span style={{ ...baseStyle, background: "#6f8babb0" }}>Alquilado</span>;
  }

  if (vehiculo?.vehiculo_reservado === 1) {
    return <span style={{ ...baseStyle, background: "#bda6ff" }}>Reservado</span>;
  }

  const estadoId = vehiculo?.estado_actual;
  const color = getColorByEstadoId(estadoId);
  const nombre = getNombreByEstadoId(estadoId);

  return <span style={{ ...baseStyle, background: color }}>{nombre}</span>;
};