export const mapCuentaPorEmpresaYConcepto = ({
  esEmpresa = false,
  tipo = "", // 'alquiler' | 'costo' | 'otro'
  nombreConcepto = "",
  cuentaActual = null,
}) => {
  if (!esEmpresa) {
    return cuentaActual;
  }

  const concepto = `${nombreConcepto || ""}`.toLowerCase().trim();

  if (tipo === "alquiler") {
    return "410501";
  }

  if (concepto.includes("km extra")) {
    return "410502";
  }
  if (concepto.includes("siniestro")) {
    return "410503";
  }
  if (concepto.includes("franquicia")) {
    return "410504";
  }
  if (concepto.includes("penalidad")) {
    return "410505";
  }
  if (concepto.includes("telepase") || concepto.includes("telepases")) {
    return "410506";
  }
  if (concepto.includes("interes") || concepto.includes("financ")) {
    return "410507";
  }

  return cuentaActual;
};
