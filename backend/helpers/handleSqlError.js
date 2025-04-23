export const handleSqlError = (error, entidad = "registro", ejemplos = "") => {
  console.log("ERROR: ", error.original?.code);
  const code = error.original?.code;

  switch (code) {
    case "ER_DUP_ENTRY":
      return {
        status: 400,
        body: {
          status: false,
          message: `Ya existe un ${entidad} con esos datos únicos${
            ejemplos ? ` (ej: ${ejemplos})` : ""
          }.`,
        },
      };

    case "ER_NO_DEFAULT_FOR_FIELD":
    case "ER_BAD_NULL_ERROR":
      return {
        status: 400,
        body: {
          status: false,
          message: `Falta un dato obligatorio para el ${entidad}.`,
        },
      };

    default:
      return {
        status: 500,
        body: {
          status: false,
          message: `Error inesperado al guardar el ${entidad}.`,
          error: error.message,
        },
      };
  }
};
