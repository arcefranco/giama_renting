export function formatearFecha(fechaStr) {
  if (!fechaStr) return "";
  const [anio, mes, dia] = fechaStr.split("-");
  return `${dia}/${mes}/${anio}`;
}
