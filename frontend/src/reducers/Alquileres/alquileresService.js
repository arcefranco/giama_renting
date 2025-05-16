import { getFunction, postFunction } from "../axios/axiosFunctions";
import axios from "axios";
import { ServiceErrorHandler } from "../../helpers/ServiceErrorHandler";
const postFormaCobro = async (form) => {
  return postFunction("alquileres/formaDeCobro", form);
};
const postAlquiler = async (form) => {
  return postFunction("alquileres/postAlquiler", form);
};

const getFormasDeCobro = async () => {
  return getFunction("alquileres/formaDeCobro");
};
const alquileresService = {
  postFormaCobro,
  postAlquiler,
  getFormasDeCobro,
};

export default alquileresService;
