export function formatearFechaISO(isoString) {
  const fecha = new Date(isoString);
  if (isNaN(fecha.getTime())) {
    return isoString;
  }
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0"); // Mes: 0-11
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${año}-${mes}-${dia}`;
}

export function formatearFechaISOText(isoString) {
  if (!isoString && isoString !== "") return "";

  // Si no es string, devolver tal cual (o convertir si quieres)
  if (typeof isoString !== "string") return String(isoString);

  let fecha;

  // Caso fecha pura "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
    fecha = new Date(`${isoString}T00:00:00`);
  } else {
    // Intentar parsear tal cual (maneja "2025-10-29T03:00:00.000Z")
    fecha = new Date(isoString);

    // Si falla, intentar extraer la parte de fecha y asumir medianoche local
    if (isNaN(fecha.getTime())) {
      const m = isoString.match(/(\d{4}-\d{2}-\d{2})/);
      if (m) fecha = new Date(`${m[1]}T00:00:00`);
    }
  }

  if (isNaN(fecha.getTime())) return isoString; // fallback seguro

  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${dia}-${mes}-${año}`;
}
