export function countDates(fecha1, fecha2) {
  const diferenciaMilisegundos = Math.abs(fecha2.getTime() - fecha1.getTime()); // Obtener la diferencia en milisegundos
  const dias = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24)); // Dividir por el número de milisegundos en un día
  return dias + 1;
}
