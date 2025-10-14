import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";

export const getFunction = async (route) => {
  try {
    const response = await axios.get(
      import.meta.env.VITE_REACT_APP_HOST + route,
      {
        withCredentials: true,
      }
    );
    const data = response.data;

    if (Array.isArray(data)) {
      return { status: true, data };
    }
    if (data?.status === false) {
      return data; // backend ya manda status:false,message
    }

    return { status: false, message: "Formato inesperado en la respuesta." };
  } catch (error) {
    console.log(error)
    return ServiceErrorHandler(error, route); // devuelve {status:false,message}
  }
};

export const postArrayFunction = async (route, form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + route,
      form,
      {
        withCredentials: true,
      }
    );
    const data = response.data;

    if (Array.isArray(data)) {
      return { status: true, data };
    }
    if (data?.status === false) {
      return data; // backend ya manda status:false,message
    }

    return { status: false, message: "Formato inesperado en la respuesta." };
  } catch (error) {
    return ServiceErrorHandler(error, route); // devuelve {status:false,message}
  }
};

export const postFunction = async (route, form, header = {}) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + route,
      form,
      {
        ...header,
        withCredentials: true,
      }
    );
    const data = response.data;

    if (data?.status === true) {
      return data;
    }
    return data?.status === false
      ? data
      : { status: false, message: "Formato inesperado en la respuesta." };
  } catch (error) {
    return ServiceErrorHandler(error, route);
  }
};

export const postObjectFunction = async (route, form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + route,
      form,
      {
        withCredentials: true,
      }
    );
    const data = response.data;

    if (typeof response.data === "object" && !Array.isArray(response.data)) {
      return { status: true, data };
    }
    if (data?.status === false) {
      return data; // backend ya manda status:false,message
    }

    return { status: false, message: "Formato inesperado en la respuesta." };
  } catch (error) {
    return ServiceErrorHandler(error, route); // devuelve {status:false,message}
  }
};
