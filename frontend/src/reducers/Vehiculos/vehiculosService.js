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
const postVehiculosMasivos = async ({ file, usuario }) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("usuario", usuario);

  return postFunction("vehiculos/postVehiculosMasivos", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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
  return postObjectFunction("vehiculos/getCostosPeriodo", data);
};
const getCostoNetoVehiculo = async (data) => {
  return postObjectFunction("vehiculos/getCostoNetoVehiculo", data);
};

const getSituacionFlota = async (data) => {
  return postObjectFunction("vehiculos/getSituacionFlota", data);
};

const getAlquileresPeriodo = async (data) => {
  return postArrayFunction("vehiculos/getAlquileresPeriodo", data);
};
/* const getAllCostosPeriodo = async (data) => {
  return postArrayFunction("vehiculos/getAllCostosPeriodo", data);
}; */
/* const getAllAlquileresPeriodo = async (data) => {
  return postArrayFunction("vehiculos/getAllAlquileresPeriodo", data);
}; */
/* const getAllAmortizaciones = async () => {
  return getFunction("vehiculos/getAllAmortizaciones");
}; */

const getAmortizacion = async (data) => {
  return postObjectFunction("vehiculos/getAmortizacion", data);
};

const getFichas = async (data) => {
  return postArrayFunction("vehiculos/getFichas", data);
};

const vehiculosService = {
  getVehiculos,
  getVehiculosById,
  postVehiculo,
  postVehiculosMasivos,
  updateVehiculo,
  getImagenesVehiculos,
  eliminarImagenes,
  postImagenesVehiculo,
  getCostosPeriodo,
  getCostoNetoVehiculo,
  getSituacionFlota,
  getAlquileresPeriodo,
  /*   getAllAlquileresPeriodo, */
  /*   getAllCostosPeriodo, */
  getAmortizacion,
  /*   getAllAmortizaciones, */
  getFichas,
};
export default vehiculosService;
