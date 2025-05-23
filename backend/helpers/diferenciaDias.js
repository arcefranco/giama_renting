export const diferenciaDias = (fechaInicio, fechaFin) => {
  console.log("diferenciaDias fechaInicio y fechaFin", fechaInicio, fechaFin);
  const unDiaMs = 1000 * 60 * 60 * 24;

  const fInicio = new Date(fechaInicio);
  const fFin = new Date(fechaFin);

  if (isNaN(fInicio) || isNaN(fFin)) {
    console.error("Fecha inválida:", fechaInicio, fechaFin);
    return 0;
  }

  fInicio.setHours(0, 0, 0, 0);
  fFin.setHours(0, 0, 0, 0);

  console.log("diferenciaDias fInicio y fFin: ", fInicio, fFin);

  return Math.floor((fFin - fInicio) / unDiaMs) + 1;
};
