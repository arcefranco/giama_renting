import axios, { AxiosError } from "axios";

export const ServiceErrorHandler = (error, table) => {
  let errorMessage = "Error desconocido";
  console.log("ServiceErrorHandler: ", error);
  // Verifica si el error es un error de Axios
  if (axios.isAxiosError(error)) {
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else {
      errorMessage = error.message;
    }
  } else if (error.message) {
    // Verifica si el error tiene la propiedad `message`
    errorMessage = error.message;
  } else if (error.name) {
    // Verifica si el error tiene la propiedad `name`
    errorMessage = error.name;
  } else if (typeof error === "string") {
    // Si el error es un string
    errorMessage = error;
  } else {
    // Para cualquier otro tipo de error, intenta convertirlo a string
    errorMessage = JSON.stringify(error);
  }

  return { status: false, message: `${errorMessage} (${table})` };
};
