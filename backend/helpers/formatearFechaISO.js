export function formatearFechaISO(isoString) {
  const fecha = new Date(isoString);
  if (isNaN(fecha.getTime())) {
    return isoString;
  }
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // Mes: 0-11
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${año}-${mes}-${dia}`;
}

export function formatearFechaISOText(isoString) {
  console.log(isoString);
  const fecha = new Date(isoString);
  if (isNaN(fecha.getTime())) {
    return isoString;
  }
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // Mes: 0-11
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${dia}-${mes}-${año}`;
}
