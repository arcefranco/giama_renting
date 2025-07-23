import {
  getFunction,
  postFunction,
  postArrayFunction,
} from "../axios/axiosFunctions";
import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";

const postFunctionImages = async (route, form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + route,
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
    return ServiceErrorHandler(error, route);
  }
};

const postCliente = async (form) => {
  return postFunctionImages("clientes/postCliente", form);
};
const getClientes = async () => {
  return getFunction("clientes/getClientes");
};
const getClientesById = async (data) => {
  return postArrayFunction("clientes/getClientesById", data);
};
const getDateroByIdCliente = async (data) => {
  return postArrayFunction("clientes/getDateroByIdCliente", data);
};

const postImagenesCliente = async (data) => {
  return postFunction("clientes/postImagenesCliente", data);
};

const getImagenesClientes = async (data) => {
  return postArrayFunction("clientes/getImagenesclientes", data);
};

const getEstadoCliente = async (form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "clientes/getEstadoCliente",
      form,
      {
        withCredentials: true,
      }
    );
    if (response.data >= 0) {
      return response.data;
    } else {
      console.log("response: ", response);
      throw response.data;
    }
  } catch (error) {
    return -1;
  }
};

const eliminarImagenes = async (key) => {
  return postFunctionImages("clientes/eliminarImagenes", key);
};
const updateCliente = async (form) => {
  return postFunctionImages("clientes/updateCliente", form);
};
const clientesService = {
  postCliente,
  getClientes,
  eliminarImagenes,
  getClientesById,
  getDateroByIdCliente,
  updateCliente,
  postImagenesCliente,
  getImagenesClientes,
  getEstadoCliente,
};

export default clientesService;
