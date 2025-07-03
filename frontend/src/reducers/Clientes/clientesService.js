import {
  getFunction,
  postFunction,
  postArrayFunction,
} from "../axios/axiosFunctions";
import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";

const postCliente = async (form) => {
  console.log(form);
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "clientes/postCliente",
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
    return ServiceErrorHandler(error, "clientes/postCliente");
  }
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
const eliminarImagenes = async (key) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "clientes/eliminarImagenes",
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
    return ServiceErrorHandler(error, "clientes/eliminarImagenes");
  }
};
const updateCliente = async (form) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "clientes/updateCliente",
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
    return ServiceErrorHandler(error, "clientes/updateCliente");
  }
};
const clientesService = {
  postCliente,
  getClientes,
  eliminarImagenes,
  getClientesById,
  getDateroByIdCliente,
  updateCliente,
};

export default clientesService;
