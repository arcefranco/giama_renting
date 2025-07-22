export const acciones = {
  get: "obtener",
  post: "guardar",
  delete: "eliminar",
  update: "actualizar",
};

const handleSqlError = (error, entidad = "registro", accion, ejemplos = "") => {
  const code = error.original?.code;
  switch (code) {
    case "ER_DUP_ENTRY":
      return {
        body: {
          status: false,
          message: `Ya existe un ${entidad} con esos datos únicos: ${
            Object.entries(error.fields)[0]
          }`,
        },
      };

    case "ER_NO_DEFAULT_FOR_FIELD":
    case "ER_BAD_NULL_ERROR":
      return {
        body: {
          status: false,
          message: `Falta un dato obligatorio para ${accion} ${entidad}.`,
        },
      };

    default:
      return {
        body: {
          status: false,
          message: `Error inesperado: ${error.message}.`,
        },
      };
  }
};

export const handleAppError = (
  error,
  entidad = "registro",
  accion = "procesar"
) => {
  let message;

  // Si el error es un string lanzado manualmente
  if (typeof error === "string") {
    message = error;
  }
  // Si es un objeto Error con mensaje específico
  else if (error instanceof Error) {
    message = error.message;
  }
  // Si viene de otra estructura
  else {
    message = `Error inesperado al ${accion} ${entidad}.`;
  }

  return {
    body: {
      status: false,
      message,
    },
  };
};

export const handleError = (error, entidad, accion, ejemplos) => {
  if (error.original) {
    // Error SQL
    return handleSqlError(error, entidad, accion, ejemplos);
  } else {
    // Error lógico, de programación o cualquier otro
    return handleAppError(error, entidad, accion);
  }
};

export const validateArray = (array, entidad = "registros") => {
  if (!Array.isArray(array) || array.length === 0) {
    return {
      status: false,
      message: `No hay ${entidad} disponibles o no hay ${entidad} con las características solicitadas.`,
    };
  }
  return null; // Si está OK, no devolvemos error
};

//handleErrorHelpers para que tire (throw) un error en vez de retornarlo (quizas)
