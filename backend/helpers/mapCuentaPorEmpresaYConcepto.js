const mapCuentasEmpresaPorId = {
  33: "410504", // Franquicia G1
  34: "410504", // Franquicia G2
  35: "410506", // Telepase
  39: "410502", // Km Extra
  41: "410505", // Recargo Medio de Pago (penalidad empresa)
  42: "410505", // Recargo Pago Atrasado (penalidad empresa)
  46: "410401", // Indemnizaciones por seguros
  74: "410506", // Telepases Empresas
};

const mapCuentasEmpresaPorNombre = {
  alquiler: "410501",
  "km extra": "410502",
  siniestro: "410503",
  franquicia: "410504",
  penalidad: "410505",
  telepase: "410506",
  intereses: "410507",
  seguro: "410401",
};

const normalizarTexto = (texto) =>
  `${texto || ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const getCuentaPorNombre = (nombre) => {
  const valor = normalizarTexto(nombre);
  for (const [clave, cuenta] of Object.entries(mapCuentasEmpresaPorNombre)) {
    if (valor.includes(clave)) return cuenta;
  }
  return null;
};

export const mapCuentaPorEmpresaYConcepto = ({
  esEmpresa = false,
  tipo = "",
  idConcepto = null,
  nombreConcepto = "",
  cuentaActual = null,
}) => {
  if (!esEmpresa) return cuentaActual;

  if (tipo === "alquiler") {
    return "410501";
  }

  if (idConcepto && mapCuentasEmpresaPorId[idConcepto]) {
    return mapCuentasEmpresaPorId[idConcepto];
  }

  const cuentaPorNombre = getCuentaPorNombre(nombreConcepto);
  if (cuentaPorNombre) return cuentaPorNombre;

  return cuentaActual;
};
