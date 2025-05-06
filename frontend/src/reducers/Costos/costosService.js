import { getFunction, postFunction } from "../axios/axiosFunctions";

const getCuentasContables = async () => {
  return getFunction("costos/cuentasContables");
};

const postConceptoCostos = async (form) => {
  return postFunction("costos/concepto", form);
};

const costosService = {
  getCuentasContables,
  postConceptoCostos,
};
export default costosService;
