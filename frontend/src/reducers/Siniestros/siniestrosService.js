import { getFunction, getObjectFunction, postFunction, putFunction } from "../axios/axiosFunctions";

const postSiniestro = async (data) => {
  return postFunction("siniestros", data);
};

const getSiniestros = async () => {
  return getFunction("siniestros");
};

const getSiniestroById = async (id) => {
  return getObjectFunction(`siniestros/${id}`);
};

const updateSiniestro = async (id, data) => {
  return putFunction(`siniestros/${id}`, data);
};

const updateSiniestroEstado = async (id, estado) => {
  return putFunction(`siniestros/${id}`, { estado });
};

const buscarContratos = async (query) => {
  return getFunction(`siniestros/buscar-contrato?q=${encodeURIComponent(query)}`);
};

const siniestrosService = {
  postSiniestro,
  getSiniestros,
  getSiniestroById,
  updateSiniestro,
  updateSiniestroEstado,
  buscarContratos,
};

export default siniestrosService;
