import { getFunction, postFunction } from "../axios/axiosFunctions";

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

const usuariosService = {
  createUsuario,
  createPass,
  recoveryPass,
  getUsuarios,
  toggleAcceso
};

export default usuariosService;
