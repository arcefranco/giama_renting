export function redondear(numero) {
  const parteDecimal = numero % 1;
  const parteEntera = Math.floor(numero);

  return parteDecimal > 0.5 ? parteEntera + 1 : parteEntera;
}
