export function esAnteriorAHoy(fechaEvaluar) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Convertimos "YYYY-MM-DD" a año, mes, día
  const [anio, mes, dia] = fechaEvaluar.split("-").map(Number);
  // Ojo: los meses en JS van de 0 a 11
  const fecha = new Date(anio, mes - 1, dia);

  return fecha < hoy ? 1 : 0;
}
