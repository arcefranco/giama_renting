import {
  postFunction,
  postArrayFunction,
} from "../axios/axiosFunctions";

const postPago = async (data) => {
  return postFunction("ctacte/pago", data);
};

const ctacteCliente = async (data) => {
  return postArrayFunction("ctacte/ctacteCliente", data);
};

const pagosClientesService = {
    postPago,
    ctacteCliente
}

export default pagosClientesService;