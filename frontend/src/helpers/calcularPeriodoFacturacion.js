/**
 * Parsea una fecha (string YYYY-MM-DD, ISO o Date) a un Date en horario local (sin desfase UTC).
 */
export const parseLocalDate = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
  }
  const cleanStr = String(dateInput).split('T')[0];
  const parts = cleanStr.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(dateInput);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

/**
 * Formatea un Date a YYYY-MM-DD.
 */
export const formatYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Suma N días a una fecha.
 */
export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Obtiene el próximo miércoles a partir de una fecha dada.
 * Si la fecha base ya es miércoles, devuelve ese mismo día.
 * 3 = miércoles (0: Domingo, 1: Lunes, 2: Martes, 3: Miércoles, ...)
 */
export const getNextWednesday = (date) => {
  const day = date.getDay();
  const diff = (3 - day + 7) % 7;
  return addDays(date, diff);
};

/**
 * Calcula el período semanal (miércoles a martes, 7 días inclusive) para clientes particulares.
 * 
 * Reglas de negocio:
 * - Si el contrato ya posee un último alquiler registrado (ultimaFechaHasta), el nuevo período
 *   se calcula a partir del día siguiente al último alquiler para no solapar fechas.
 * - Si no posee alquileres previos, se toma la fecha de inicio del contrato.
 * - La fecha desde será el próximo miércoles más cercano a esa fecha base.
 * - La fecha hasta será 6 días después (martes), acotada por el fin del contrato si vence antes.
 */
export const calcularPeriodoSemanal = (
  fechaDesdeContrato,
  fechaHastaContrato,
  ultimaFechaHasta,
  fechaReferencia = new Date()
) => {
  let baseDate;
  if (ultimaFechaHasta) {
    baseDate = addDays(parseLocalDate(ultimaFechaHasta), 1);
  } else if (fechaDesdeContrato) {
    baseDate = parseLocalDate(fechaDesdeContrato);
  } else {
    baseDate = parseLocalDate(fechaReferencia);
  }

  const proxMiercoles = getNextWednesday(baseDate);
  let fechaHasta = addDays(proxMiercoles, 6);

  if (fechaHastaContrato) {
    const limContrato = parseLocalDate(fechaHastaContrato);
    if (fechaHasta > limContrato) {
      fechaHasta = limContrato;
    }
  }

  return {
    fechaDesde: formatYMD(proxMiercoles),
    fechaHasta: formatYMD(fechaHasta)
  };
};

/**
 * Calcula el período por defecto a facturar para un contrato en facturación masiva.
 * 
 * Reglas de negocio:
 * - Para clientes particulares (esEmpresa = false):
 *   Período semanal de miércoles a martes (+6 días), tomando el próximo miércoles a partir
 *   del día posterior al último alquiler registrado (o inicio de contrato si es nuevo).
 * - Para empresas (esEmpresa = true):
 *   Período mensual calendario (del 1° al último día del mes en curso, acotado por contrato).
 *
 * @param {string|Date} fechaDesdeContrato - Fecha de inicio del contrato
 * @param {string|Date} [fechaHastaContrato] - Fecha de fin del contrato (opcional)
 * @param {Date} [fechaReferencia=new Date()] - Fecha base (por defecto hoy, permite testear fechas fijas)
 * @param {Object} [options={}] - Opciones de configuración
 * @param {boolean} [options.esEmpresa=true] - Indica si el cliente es empresa o particular
 * @param {string|Date} [options.ultimaFechaHasta=null] - Fin del último alquiler registrado
 * @returns {{ fechaDesde: string, fechaHasta: string }} Fechas en formato YYYY-MM-DD
 */
export const calcularPeriodoFacturacion = (
  fechaDesdeContrato,
  fechaHastaContrato,
  fechaReferencia = new Date(),
  options = {}
) => {
  const { esEmpresa = true, ultimaFechaHasta = null } = options;

  if (!esEmpresa) {
    return calcularPeriodoSemanal(
      fechaDesdeContrato,
      fechaHastaContrato,
      ultimaFechaHasta,
      fechaReferencia
    );
  }

  // --- Lógica mensual para Empresas (mes en curso) ---
  const refDate = parseLocalDate(fechaReferencia) || new Date();
  const anio = refDate.getFullYear();
  const mes = refDate.getMonth(); // 0-indexed

  const primerDiaMes = new Date(anio, mes, 1);
  const ultimoDiaMes = new Date(anio, mes + 1, 0);

  const primerDiaMesStr = formatYMD(primerDiaMes);
  const ultimoDiaMesStr = formatYMD(ultimoDiaMes);

  const desdeContratoStr = typeof fechaDesdeContrato === 'string'
    ? fechaDesdeContrato.split('T')[0]
    : (fechaDesdeContrato ? formatYMD(parseLocalDate(fechaDesdeContrato)) : primerDiaMesStr);

  // Si inició con posterioridad al 1° del mes (ej. este mes), arranca en la fecha del contrato
  const fechaDesde = desdeContratoStr > primerDiaMesStr ? desdeContratoStr : primerDiaMesStr;

  // Acotar la fecha hasta si el contrato termina antes de fin de mes
  let fechaHasta = ultimoDiaMesStr;
  if (fechaHastaContrato) {
    const hastaContratoStr = typeof fechaHastaContrato === 'string'
      ? fechaHastaContrato.split('T')[0]
      : formatYMD(parseLocalDate(fechaHastaContrato));
    if (hastaContratoStr < ultimoDiaMesStr) {
      fechaHasta = hastaContratoStr;
    }
  }

  return {
    fechaDesde,
    fechaHasta,
  };
};
