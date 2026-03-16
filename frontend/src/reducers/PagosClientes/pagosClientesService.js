import {
  postFunction,
  postArrayFunction,
  getObjectFunction,
} from "../axios/axiosFunctions";
import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";

const postPago = async (data) => {
  return postFunction("ctacte/pago", data);
};

const ctacteCliente = async (data) => {
  return postArrayFunction("ctacte/ctacteCliente", data);
};

const fichaCtaCte = async () => {
  return getObjectFunction("ctacte/fichaCtaCte")
}

const getEstadoDeuda = async (form, header = {}) => {
  try {
    const response = await axios.post(
      import.meta.env.VITE_REACT_APP_HOST + "ctacte/getEstadoDeuda",
      form,
      {
        ...header,
        withCredentials: true,
      }
    );
    const data = response.data;
    console.log(response.data)
    if (data?.codigo) {
      return data;
    }
    return data?.status === false
      ? data
      : { status: false, message: "Formato inesperado en la respuesta." };
  } catch (error) {
    console.log(error)
    return ServiceErrorHandler(error, route);
  }
}

const anulacionFactura = async (data) => {
  return postFunction("ctacte/anulacionFactura", data);
};

const anulacionRecibo = async (data) => {
  return postFunction("ctacte/anulacionRecibo", data);
};

const anulacionDeuda = async (data) => {
  return postFunction("ctacte/anulacionDeuda", data);
};

const pagosClientesService = {
    postPago,
    ctacteCliente,
    fichaCtaCte,
    getEstadoDeuda,
    anulacionFactura,
    anulacionRecibo,
    anulacionDeuda
}

export default pagosClientesService;