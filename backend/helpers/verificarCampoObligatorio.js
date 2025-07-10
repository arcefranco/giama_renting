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
