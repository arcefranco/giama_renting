import { getFunction, postFunction } from "../axios/axiosFunctions";
import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";
const getVehiculos = async () => {
  return getFunction("vehiculos/getVehiculos");
};
const getVehiculosById = async (data) => {
  let header = {};
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "vehiculos/getVehiculosById",
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
    return ServiceErrorHandler(error, "vehiculos/getVehiculosById");
  }
};
const postVehiculo = async (form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "vehiculos/postVehiculo",
      form,
      {
        headers:
          form instanceof FormData
            ? {}
            : { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    if (response.data.hasOwnProperty("status") && response.data.status) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "vehiculos/postVehiculo");
  }
};
const updateVehiculo = async (form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "vehiculos/updateVehiculo",
      form,
      {
        headers:
          form instanceof FormData
            ? {}
            : { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    if (response.data.hasOwnProperty("status") && response.data.status) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "vehiculos/updateVehiculo");
  }
};
const eliminarImagenes = async (key) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "vehiculos/eliminarImagenes",
      key,
      {
        headers:
          key instanceof FormData ? {} : { "Content-Type": "application/json" },
        withCredentials: true,
      }
    );
    if (response.data.hasOwnProperty("status") && response.data.status) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "vehiculos/eliminarImagenes");
  }
};
const getCostosPeriodo = async (data) => {
  let header = {};
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "vehiculos/getCostosPeriodo",
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
    return ServiceErrorHandler(error, "vehiculos/getCostosPeriodo");
  }
};
const getAlquileresPeriodo = async (data) => {
  let header = {};
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "vehiculos/getAlquileresPeriodo",
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
    return ServiceErrorHandler(error, "vehiculos/getAlquileresPeriodo");
  }
};
const vehiculosService = {
  getVehiculos,
  getVehiculosById,
  postVehiculo,
  updateVehiculo,
  eliminarImagenes,
  getCostosPeriodo,
  getAlquileresPeriodo,
};
export default vehiculosService;
