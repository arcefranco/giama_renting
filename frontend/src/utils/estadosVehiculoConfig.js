export const ESTADOS_ESTATICOS = [
  { id: 1, nombre: "Sin preparar", color: "#ff0909a1" },
  { id: 2, nombre: "Listo para alquilar", color: "#ffa809a1" },
  { id: 3, nombre: "En reparación", color: "black" },
  { id: 4, nombre: "Seguro a recuperar", color: "#61c2ff" },
  {id: 5, nombre: "A la venta", color: "#64ff61ff"}
];

export const getColorByEstadoId = (id) =>
  ESTADOS_ESTATICOS.find((e) => e.id === id)?.color || "#ccc";

export const getNombreByEstadoId = (id) =>
  ESTADOS_ESTATICOS.find((e) => e.id === id)?.nombre || "Desconocido";
