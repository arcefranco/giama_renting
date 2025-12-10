const nombresMeses = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];
export const generarPeriodos = () => {
  const hoy = new Date();
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 6); // seis meses adelante
  const inicio = new Date(2025, 0); // enero 2025
  const periodos = [];

  while (fin >= inicio) {
    periodos.push({
      mes: fin.getMonth() + 1,
      anio: fin.getFullYear(),
      nombreMes: nombresMeses[fin.getMonth()],
    });
    fin.setMonth(fin.getMonth() - 1);
  }

  return periodos;
};
