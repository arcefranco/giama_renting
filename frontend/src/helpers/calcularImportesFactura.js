/**
 * Funciones de cálculo de importes para facturación.
 * Garantizan que siempre se cumpla la validación estricta de AFIP:
 * Importe Total == Importe Neto + Importe IVA + Importe Percepciones
 */

export const calcularImportesDesdeTotal = ({ total, porcentajeIva = 21, tasaPercepcion = 0 }) => {
  const tot = parseFloat(total || 0);
  if (tot <= 0 || isNaN(tot)) {
    return { neto: '', iva: '', percepcion: '', total: '' };
  }
  const porcIva = parseFloat(porcentajeIva || 0) / 100;
  const tasaPerc = parseFloat(tasaPercepcion || 0) / 100;

  // 1. Neto redondeado a 2 decimales
  const netoNum = parseFloat((tot / (1 + porcIva + tasaPerc)).toFixed(2));

  // 2. Percepción redondeada a 2 decimales (si aplica)
  const percNum = tasaPerc > 0 ? parseFloat((netoNum * tasaPerc).toFixed(2)) : 0;

  // 3. IVA calculado por sustracción para absorber diferencias de redondeo al centavo
  const ivaNum = porcIva > 0 ? parseFloat((tot - netoNum - percNum).toFixed(2)) : 0;

  return {
    neto: netoNum.toFixed(2),
    iva: ivaNum.toFixed(2),
    percepcion: percNum > 0 ? percNum.toFixed(2) : '',
    total: tot.toFixed(2)
  };
};

export const calcularImportesDesdeNeto = ({ neto, porcentajeIva = 21, tasaPercepcion = 0, importePercepcion = null }) => {
  const net = parseFloat(neto || 0);
  if (net <= 0 || isNaN(net)) {
    return { neto: '', iva: '', percepcion: '', total: '' };
  }
  const porcIva = parseFloat(porcentajeIva || 0) / 100;
  const tasaPerc = parseFloat(tasaPercepcion || 0) / 100;

  const ivaNum = parseFloat((net * porcIva).toFixed(2));
  const percNum = importePercepcion !== null && importePercepcion !== '' && !isNaN(parseFloat(importePercepcion))
    ? parseFloat(importePercepcion)
    : (tasaPerc > 0 ? parseFloat((net * tasaPerc).toFixed(2)) : 0);

  const totNum = parseFloat((net + ivaNum + percNum).toFixed(2));

  return {
    neto: net.toFixed(2),
    iva: ivaNum.toFixed(2),
    percepcion: percNum > 0 ? percNum.toFixed(2) : '',
    total: totNum.toFixed(2)
  };
};
