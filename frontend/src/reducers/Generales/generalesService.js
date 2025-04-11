import { getFunction } from "../axios/axiosFunctions";

const getModelos = async () => {
  return getFunction("generales/modelos");
};

const getProveedoresGPS = async () => {
  return getFunction("generales/proveedoresGps");
};

const generalesService = {
  getModelos,
  getProveedoresGPS,
};
export default generalesService;
