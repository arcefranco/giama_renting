import {
  postFunction,
  postArrayFunction,
  getObjectFunction,
} from "../axios/axiosFunctions";

const postPago = async (data) => {
  return postFunction("ctacte/pago", data);
};

const ctacteCliente = async (data) => {
  return postArrayFunction("ctacte/ctacteCliente", data);
};

const fichaCtaCte = async () => {
  return getObjectFunction("ctacte/fichaCtaCte")
}

const pagosClientesService = {
    postPago,
    ctacteCliente,
    fichaCtaCte
}

export default pagosClientesService;