export const ESTADOS_ESTATICOS = [
  { id: 1, nombre: "Sin preparar", color: "#ff0909a1" },
  { id: 2, nombre: "Listo para alquilar", color: "#ffa809a1" },
  { id: 3, nombre: "En reparación", color: "black" },
  { id: 4, nombre: "Seguro a recuperar", color: "#61c2ff" },
  { id: 5, nombre: "A la venta", color: "#64ff61ff" },
  { id: 6, nombre: "Unidades 0km a recibir", color: "#ff9800" },
  { id: 7, nombre: "En préstamo", color: "#9c27b0" },
  { id: 8, nombre: "Cobrado DT", color: "#555555" },
  { id: 9, nombre: "Reservado venta", color: "#009688" },
  { id: 10, nombre: "Vendido sin facturar", color: "#fd7e14" },
  { id: 11, nombre: "Vendido Facturado", color: "#198754" }
];

export const getColorByEstadoId = (id) =>
  ESTADOS_ESTATICOS.find((e) => e.id === id)?.color || "#ccc";

export const getNombreByEstadoId = (id) =>
  ESTADOS_ESTATICOS.find((e) => e.id === id)?.nombre || "Desconocido";

/**
 * Resuelve el nombre y color del estado de un vehículo con prioridad única
 * para renderizado, filtrado y exportación.
 */
export const getEstadoVehiculoInfo = (vehiculo, estados = []) => {
  if (vehiculo?.estado_actual === 8) {
    return { nombre: "Cobrado DT", color: "#555555" };
  }

  if (vehiculo?.estado_actual === 9) {
    return { nombre: "Reservado venta", color: "#009688" };
  }

  if (vehiculo?.estado_actual === 10) {
    return { nombre: "Vendido sin facturar", color: "#fd7e14" };
  }

  if (vehiculo?.estado_actual === 11 || vehiculo?.fecha_venta) {
    return { nombre: "Vendido Facturado", color: "#198754" };
  }

  if (vehiculo?.vehiculo_alquilado === 1) {
    return { nombre: "Alquilado", color: "#6f8babb0" };
  }

  if (vehiculo?.vehiculo_reservado === 1) {
    return { nombre: "Reservado alquiler", color: "#bda6ff" };
  }

  const estadoId = vehiculo?.estado_actual;
  const estadoDB = estados?.find((e) => e.id === estadoId);
  return {
    nombre: estadoDB?.nombre || getNombreByEstadoId(estadoId),
    color: getColorByEstadoId(estadoId)
  };
};
