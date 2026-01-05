import {
  getFunction,
  postArrayFunction,
  postFunction,
} from "../axios/axiosFunctions";

const postFormaCobro = async (form) => {
  return postFunction("alquileres/formaDeCobro", form);
};

const postAlquiler = async (form) => {
  return postFunction("alquileres/postAlquiler", form);
};

const postContratoAlquiler = async (form) => {
  return postFunction("alquileres/contrato", form);
};


const anulacionAlquiler = async (form) => {
  return postFunction("alquileres/anulacion", form);
};

const anulacionContrato = async (form) => {
  return postFunction("alquileres/contrato/anulacion", form);
};

const cambioVehiculo = async (form) => {
  return postFunction("alquileres/contrato/cambioVehiculo", form);
};

const getFormasDeCobro = async () => {
  return getFunction("alquileres/formaDeCobro");
};

const getAlquileres = async (form) => {
  return postArrayFunction("alquileres/", form);
};

const getContratos = async (form) => {
  return postArrayFunction("alquileres/contratos", form);
};

const getContratosAVencer = async (form) => {
  return postArrayFunction("alquileres/contratosAVencer", form);
};

const getAnulaciones = async (form) => {
  return postArrayFunction("alquileres/getAnulaciones", form);
};

const getAlquileresByIdVehiculo = async (data) => {
  return postArrayFunction("alquileres/idVehiculo", data);
};

const getContratosByIdVehiculo = async (data) => {
  return postArrayFunction("alquileres/contrato/idVehiculo", data);
};

const getContratosByIdCliente = async (data) => {
  return postArrayFunction("alquileres/contrato/idCliente", data);
};

const getAlquilerByIdContrato = async (data) => {
  return postArrayFunction("alquileres/id", data);
};

const getContratoById = async (data) => {
  return postArrayFunction("alquileres/contrato/id", data);
};

const alquileresService = {
  postFormaCobro,
  postAlquiler,
  getFormasDeCobro,
  getAlquileresByIdVehiculo,
  getAlquileres,
  getContratos,
  getContratosAVencer,
  getAlquilerByIdContrato,
  getContratoById,
  anulacionAlquiler,
  anulacionContrato,
  getAnulaciones,
  postContratoAlquiler,
  getContratosByIdVehiculo,
  getContratosByIdCliente,
  cambioVehiculo,
};

export default alquileresService;
