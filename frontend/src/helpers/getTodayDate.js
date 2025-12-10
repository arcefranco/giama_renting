export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Mes empieza en 0
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const calcularDiferenciaDias = (fechaIngresoStr, fechaComparacion) => {
  const fechaIngreso = new Date(fechaIngresoStr);
  let fecha2;
  if (!fechaComparacion) {
    fecha2 = new Date(getTodayDate());
  } else if (fechaComparacion) {
    fecha2 = fechaComparacion;
  }

  const diferenciaMs = fecha2 - fechaIngreso;
  const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
  return dias >= 0 ? dias : 0;
};

export const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // elimina horas
  return today;
};
