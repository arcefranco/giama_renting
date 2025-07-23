import {
  getFunction,
  postArrayFunction,
  postFunction,
  postObjectFunction,
} from "../axios/axiosFunctions";
import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";
const getVehiculos = async () => {
  return getFunction("vehiculos/getVehiculos");
};
const getVehiculosById = async (form) => {
  return postArrayFunction("vehiculos/getVehiculosById", form);
};
const postVehiculo = async (form) => {
  return postFunction("vehiculos/postVehiculo", form);
};
const updateVehiculo = async (form) => {
  return postFunction("vehiculos/updateVehiculo", form);
};
const getImagenesVehiculos = async (form) => {
  return postArrayFunction("vehiculos/getImagenesVehiculos", form);
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
const postImagenesVehiculo = async (data) => {
  return postFunction("vehiculos/postImagenesVehiculo", data);
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
    if (
      typeof response.data === "object" &&
      response.data !== null &&
      !Array.isArray(response.data)
    ) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "vehiculos/getCostosPeriodo");
  }
};
const getCostoNetoVehiculo = async (data) => {
  let header = {};
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "vehiculos/getCostoNetoVehiculo",
      data,
      {
        ...header,
        withCredentials: true,
      }
    );
    let resultado = response.data;
    console.log("costo_neto_vehiculo: ", response.data);
    if (resultado.hasOwnProperty("costo_neto_total")) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "vehiculos/getCostoNetoVehiculo");
  }
};

const getSituacionFlota = async (data) => {
  return postObjectFunction("vehiculos/getSituacionFlota", data);
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
    if (response.data.hasOwnProperty("alquileres")) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "vehiculos/getAlquileresPeriodo");
  }
};
const getAllCostosPeriodo = async (data) => {
  return postArrayFunction("vehiculos/getAllCostosPeriodo", data);
};
const getAllAlquileresPeriodo = async (data) => {
  return postArrayFunction("vehiculos/getAllAlquileresPeriodo", data);
};
const getAmortizacion = async (data) => {
  let header = {};
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "vehiculos/getAmortizacion",
      data,
      {
        ...header,
        withCredentials: true,
      }
    );
    let resultado = response.data;
    if (resultado.hasOwnProperty("amortizacion")) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "vehiculos/getAmortizacion");
  }
};
const getAllAmortizaciones = async () => {
  return getFunction("vehiculos/getAllAmortizaciones");
};

const getFichas = async (data) => {
  return postArrayFunction("vehiculos/getFichas", data);
};

const vehiculosService = {
  getVehiculos,
  getVehiculosById,
  postVehiculo,
  updateVehiculo,
  getImagenesVehiculos,
  eliminarImagenes,
  postImagenesVehiculo,
  getCostosPeriodo,
  getCostoNetoVehiculo,
  getSituacionFlota,
  getAlquileresPeriodo,
  getAllAlquileresPeriodo,
  getAllCostosPeriodo,
  getAmortizacion,
  getAllAmortizaciones,
  getFichas,
};
export default vehiculosService;
