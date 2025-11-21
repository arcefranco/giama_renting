import { getFunction, postObjectFunction, postFunction, postArrayFunction } from "../axios/axiosFunctions";

export const getReciboById = async (id) => {
  return postObjectFunction("recibos/getReciboById", id);
};

export const getRecibos = async () => {
  return getFunction("recibos/getRecibos");
}

export const anulacionRecibo = async (id) => {
  return postFunction("recibos/anulacionRecibo", id)
}

export const getRecibosByFormaCobro = async (id) => {
  return postArrayFunction("recibos/getRecibosByFormaCobro", id)
}

const recibosService = {
  getReciboById,
  getRecibos,
  anulacionRecibo,
  getRecibosByFormaCobro
};
export default recibosService;
