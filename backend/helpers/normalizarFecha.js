export const normalizarFecha = (fecha) => {
  if (fecha) {
    let fechaAnio = parseInt(fecha?.split("-")[0]);
    let fechaMes = parseInt(fecha?.split("-")[1]);
    let fechaDia = parseInt(fecha?.split("-")[2]);
    const f = new Date(fechaAnio, fechaMes - 1, fechaDia);
    f.setHours(0, 0, 0, 0);
    return f;
  } else {
    throw "error al normalizar la fecha";
  }
};
