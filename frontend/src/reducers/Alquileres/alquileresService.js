import { getFunction, postFunction } from "../axios/axiosFunctions";
import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";
const postFormaCobro = async (form) => {
  return postFunction("alquileres/formaDeCobro", form);
};
const postAlquiler = async (form) => {
  return postFunction("alquileres/postAlquiler", form);
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
const alquileresService = {
  postFormaCobro,
  postAlquiler,
  getFormasDeCobro,
  getAlquileresByIdVehiculo,
  getAlquileres,
};

export default alquileresService;
