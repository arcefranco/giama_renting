import { getFunction, postObjectFunction, postFunction } from "../axios/axiosFunctions";

export const getReciboById = async (id) => {
  return postObjectFunction("recibos/getReciboById", id);
};

export const getRecibos = async () => {
  return getFunction("recibos/getRecibos");
}

export const anulacionRecibo = async (id) => {
  return postFunction("recibos/anulacionRecibo", id)
}

const recibosService = {
  getReciboById,
  getRecibos,
  anulacionRecibo
};
export default recibosService;
