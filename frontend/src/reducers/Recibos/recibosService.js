import { getFunction, postObjectFunction } from "../axios/axiosFunctions";

export const getReciboById = async (id) => {
  return postObjectFunction("recibos/getReciboById", id);
};

export const getRecibos = async () => {
  return getFunction("recibos/getRecibos");
}

const recibosService = {
  getReciboById,
  getRecibos
};
export default recibosService;
