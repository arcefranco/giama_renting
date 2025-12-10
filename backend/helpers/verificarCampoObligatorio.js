export const verificarCamposObligatorios = (obj, camposRequeridos) => {
  for (const campo of camposRequeridos) {
    const valor = obj[campo];
    if (
      valor === undefined ||
      valor === null ||
      (typeof valor === "string" && valor.trim() === "")
    ) {
      return campo;
    }
  }
  return null;
};

export const validarCamposObligatorios = (
  data,
  camposObligatorios,
  entidad
) => {
  const faltantes = camposObligatorios.filter(
    (campo) => !data[campo] || data[campo].toString().trim() === ""
  );

  if (faltantes.length > 0) {
    const camposFormateados = faltantes
      .map((campo) =>
        campo
          .split("_") // separa por "_"
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitaliza
          .join(" ")
      )
      .join(", ");

    return `Faltan datos para el ingreso del ${entidad}: ${camposFormateados}`;
  }

  return null; // No faltan datos
};
