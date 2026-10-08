/**
 * Calcula el período por defecto a facturar para un contrato en el mes en curso.
 * 
 * Reglas de negocio:
 * - Si el contrato inició en el mes actual (o posterior al día 1), toma la fecha de inicio del contrato.
 * - Si el contrato inició antes del mes actual, toma el primer día del mes actual (YYYY-MM-01).
 * - La fecha de fin toma el último día del mes actual, salvo que el contrato finalice antes de fin de mes.
 *
 * @param {string|Date} fechaDesdeContrato - Fecha de inicio del contrato
 * @param {string|Date} [fechaHastaContrato] - Fecha de fin del contrato (opcional)
 * @param {Date} [fechaReferencia=new Date()] - Fecha base (por defecto hoy, permite testear fechas fijas)
 * @returns {{ fechaDesde: string, fechaHasta: string }} Fechas en formato YYYY-MM-DD
 */
export const calcularPeriodoFacturacion = (
  fechaDesdeContrato,
  fechaHastaContrato,
  fechaReferencia = new Date()
) => {
  const anio = fechaReferencia.getFullYear();
  const mes = fechaReferencia.getMonth(); // 0-indexed

  const formatYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const primerDiaMes = new Date(anio, mes, 1);
  const ultimoDiaMes = new Date(anio, mes + 1, 0);

  const primerDiaMesStr = formatYMD(primerDiaMes);
  const ultimoDiaMesStr = formatYMD(ultimoDiaMes);

  const desdeContratoStr = typeof fechaDesdeContrato === 'string'
    ? fechaDesdeContrato.split('T')[0]
    : (fechaDesdeContrato ? formatYMD(fechaDesdeContrato) : primerDiaMesStr);

  // Si inició con posterioridad al 1° del mes (ej. este mes), arranca en la fecha del contrato
  const fechaDesde = desdeContratoStr > primerDiaMesStr ? desdeContratoStr : primerDiaMesStr;

  // Acotar la fecha hasta si el contrato termina antes de fin de mes
  let fechaHasta = ultimoDiaMesStr;
  if (fechaHastaContrato) {
    const hastaContratoStr = typeof fechaHastaContrato === 'string'
      ? fechaHastaContrato.split('T')[0]
      : formatYMD(fechaHastaContrato);
    if (hastaContratoStr < ultimoDiaMesStr) {
      fechaHasta = hastaContratoStr;
    }
  }

  return {
    fechaDesde,
    fechaHasta,
  };
};
