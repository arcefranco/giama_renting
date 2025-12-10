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

const usuariosService = {
  createUsuario,
  createPass,
  recoveryPass,
};

export default usuariosService;
