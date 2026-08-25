import { getFunction, postFunction, putFunction, deleteFunction } from "../axios/axiosFunctions";

const createUsuario = async (data) => {
  return postFunction("login/createUsuario", data);
};

const createPass = async (data) => {
  return postFunction("login/createPass", data);
};

const recoveryPass = async (data) => {
  return postFunction("login/recovery", data);
};

const getUsuarios = async () => {
  return getFunction("usuarios");
};

const toggleAcceso = async (id) => {
  return postFunction(`usuarios/toggleAcceso/${id}`, {});
};

const updateRoles = async (data) => {
  return putFunction(`usuarios/roles/${data.id}`, { roles: data.roles });
};

const deleteUsuario = async (id) => {
  return deleteFunction(`usuarios/${id}`);
};

const usuariosService = {
  createUsuario,
  createPass,
  recoveryPass,
  getUsuarios,
  toggleAcceso,
  updateRoles,
  deleteUsuario
};

export default usuariosService;
