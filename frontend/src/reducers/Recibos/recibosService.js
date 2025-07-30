import { postObjectFunction } from "../axios/axiosFunctions";

export const getReciboById = async (id) => {
  return postObjectFunction("recibos/getReciboById", id);
};

const recibosService = {
  getReciboById,
};
export default recibosService;
