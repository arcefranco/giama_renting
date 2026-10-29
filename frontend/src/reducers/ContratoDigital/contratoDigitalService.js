import { getFunction, getObjectFunction, postFunction } from "../axios/axiosFunctions";

export const buscarContratosParaDigital = async (query = "") => {
  return getFunction(`contratos-digitales/buscar-contratos?q=${encodeURIComponent(query)}`);
};

export const postContratoDigital = async (data) => {
  return postFunction("contratos-digitales/", data);
};

export const getContratosDigitales = async (busqueda = "") => {
  return getFunction(`contratos-digitales/?busqueda=${encodeURIComponent(busqueda)}`);
};

export const getContratoDigitalById = async (id) => {
  return getObjectFunction(`contratos-digitales/${id}`);
};
