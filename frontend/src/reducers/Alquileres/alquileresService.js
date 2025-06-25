import { getFunction, postFunction } from "../axios/axiosFunctions";
import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";

const postFormaCobro = async (form) => {
  return postFunction("alquileres/formaDeCobro", form);
};

const postAlquiler = async (form) => {
  return postFunction("alquileres/postAlquiler", form);
};

const postContratoAlquiler = async (form) => {
  return postFunction("alquileres/contrato", form);
};

const anulacionAlquiler = async (form) => {
  return postFunction("alquileres/anulacion", form);
};

const anulacionContrato = async (form) => {
  return postFunction("alquileres/contrato/anulacion", form);
};

const getFormasDeCobro = async () => {
  return getFunction("alquileres/formaDeCobro");
};

const getAlquileres = async (form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "alquileres/",
      form
    );
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, route);
  }
};

const getContratos = async (form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "alquileres/contratos",
      form
    );
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, route);
  }
};

const getAnulaciones = async (form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "alquileres/getAnulaciones",
      form
    );
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, route);
  }
};

const getAlquileresByIdVehiculo = async (data) => {
  let header = {};
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "alquileres/idVehiculo",
      data,
      {
        ...header,
        withCredentials: true,
      }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "alquileres/idVehiculo");
  }
};

const getContratosByIdVehiculo = async (data) => {
  let header = {};
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "alquileres/contrato/idVehiculo",
      data,
      {
        ...header,
        withCredentials: true,
      }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "alquileres/idVehiculo");
  }
};

const getAlquilerByIdContrato = async (data) => {
  let header = {};
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "alquileres/id",
      data,
      {
        ...header,
        withCredentials: true,
      }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "alquileres/id");
  }
};

const getContratoById = async (data) => {
  let header = {};
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "alquileres/contrato/id",
      data,
      {
        ...header,
        withCredentials: true,
      }
    );
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "alquileres/id");
  }
};

const alquileresService = {
  postFormaCobro,
  postAlquiler,
  getFormasDeCobro,
  getAlquileresByIdVehiculo,
  getAlquileres,
  getContratos,
  getAlquilerByIdContrato,
  getContratoById,
  anulacionAlquiler,
  anulacionContrato,
  getAnulaciones,
  postContratoAlquiler,
  getContratosByIdVehiculo,
};

export default alquileresService;
