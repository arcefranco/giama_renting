import axios, { AxiosError } from "axios";

export const ServiceErrorHandler = (error, route) => {
  let message = "Error desconocido";

  if (axios.isAxiosError(error)) {
    message = error.response?.data?.message || error.message;
  } else if (error.message) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else {
    message = JSON.stringify(error);
  }

  return { status: false, message: `${message} (${route})` };
};
