import {
  postFunction,
  postArrayFunction,
  getFunction,
} from "../axios/axiosFunctions";

const postModelo = async (data) => {
  return postFunction("parametros/postModelo", data);
};
const postProveedorGPS = async (data) => {
  return postFunction("parametros/postProveedorGPS", data);
};
const postSucursal = async (data) => {
  return postFunction("parametros/postSucursal", data);
};

const deleteModelo = async (data) => {
  return postFunction("parametros/deleteModelo", data);
};
const deleteProveedorGPS = async (data) => {
  return postFunction("parametros/deleteProveedorGPS", data);
};
const deleteSucursal = async (data) => {
  return postFunction("parametros/deleteSucursal", data);
};

const updateModelo = async (data) => {
  return postFunction("parametros/updateModelo", data);
};
const updateProveedorGPS = async (data) => {
  return postFunction("parametros/updateProveedorGPS", data);
};
const updateSucursal = async (data) => {
  return postFunction("parametros/updateSucursal", data);
};

const getModelosVehiculos = async () => {
  return getFunction("parametros/getModelosVehiculos");
};

const getModeloById = async (data) => {
  return postArrayFunction("parametros/getModeloById", data);
};

const getSucursalById = async (data) => {
  return postArrayFunction("parametros/getSucursalById", data);
};

const getProveedorGPSById = async (data) => {
  return postArrayFunction("parametros/getProveedorGPSById", data);
};

const parametrosService = {
  postModelo,
  postProveedorGPS,
  postSucursal,
  deleteModelo,
  deleteProveedorGPS,
  deleteSucursal,
  updateModelo,
  updateProveedorGPS,
  updateSucursal,
  getModelosVehiculos,
  getModeloById,
  getSucursalById,
  getProveedorGPSById,
};
export default parametrosService;
