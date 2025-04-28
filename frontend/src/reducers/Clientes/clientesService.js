import { getFunction, postFunction } from "../axios/axiosFunctions";
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
const clientesService = {
  postCliente,
  getClientes,
};

export default clientesService;
