import { getFunction } from "../axios/axiosFunctions";
import axios from "axios";

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

const getEstados = async () => {
  return getFunction("generales/estados");
};

const getPlanCuentas = async () => {
  return getFunction("generales/plan_cuentas");
};

const getProveedores = async () => {
  return getFunction("generales/proveedores");
};

const getProveedoresVehiculo = async () => {
  return getFunction("generales/proveedores_vehiculo");
};

const getRoles = async () => {
  return getFunction("generales/roles");
};

const getFormasCobro = async () => {
  return getFunction("generales/formas_cobro");
};

const getParametroAMRT = async () => {
  try {
    const response = await axios.get(
      import.meta.env.VITE_REACT_APP_HOST + "generales/AMRT",
      {
        withCredentials: true,
      }
    );
    let parametro = response.data;
    console.log(response.data);
    if (parametro.hasOwnProperty("AMRT")) {
      return response.data;
    } else {
      throw response.data;
    }
  } catch (error) {
    return ServiceErrorHandler(error, "generales/AMRT");
  }
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
  getParametroAMRT,
  getPlanCuentas,
  getProveedores,
  getProveedoresVehiculo,
  getEstados,
  getRoles,
  getFormasCobro,
};
export default generalesService;
