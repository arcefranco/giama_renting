import { getFunction } from "../axios/axiosFunctions";

const getModelos = async () => {
  return getFunction("generales/modelos");
};

const getProveedoresGPS = async () => {
  return getFunction("generales/proveedoresGps");
};

const getProvincias = async () => {
  return getFunction("generales/provincias");
};

const getTiposDocumento = async () => {
  return getFunction("generales/tipos_documento");
};

const getTiposResponsable = async () => {
  return getFunction("generales/tipos_responsable");
};

const getTiposSexo = async () => {
  return getFunction("generales/tipos_sexo");
};
const getSucursales = async () => {
  return getFunction("generales/sucursales");
};
const getPreciosModelos = async () => {
  return getFunction("generales/precios_modelos");
};

const generalesService = {
  getModelos,
  getProveedoresGPS,
  getProvincias,
  getTiposDocumento,
  getTiposResponsable,
  getTiposSexo,
  getSucursales,
  getPreciosModelos,
};
export default generalesService;
