import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { handleError, acciones } from "../../helpers/handleError.js";
import { validateArray } from "../../helpers/handleError.js";

export const getProveedoresGPS = async (req, res) => {
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM proveedores_gps",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Proveedores GPS", acciones.get);
    return res.send(body);
  }
};
export const getModelos = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM modelos", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Modelos", acciones.get);
    return res.send(body);
  }
};

export const getTiposDocumento = async (req, res) => {
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM tipos_documentos",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Tipos de documento", acciones.get);
    return res.send(body);
  }
};

export const getTiposResponsable = async (req, res) => {
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM tipos_responsable",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Tipos de responsable", acciones.get);
    return res.send(body);
  }
};

export const getTiposSexo = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM tipos_sexo", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Tipos sexo", acciones.get);
    return res.send(body);
  }
};

export const getProvincias = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM provincias", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Provincias", acciones.get);
    return res.send(body);
  }
};

export const getSucursales = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM sucursales", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Sucursales", acciones.get);
    return res.send(body);
  }
};

export const getPreciosModelos = async (req, res) => {
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM precios_modelos",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Precios de modelos", acciones.get);
    return res.send(body);
  }
};

export const getParametroAMRT = async (req, res) => {
  let AMRT;
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "AMRT"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    const validatorResult = validateArray(result, "Parámetro de amortización");
    if (validatorResult) {
      return res.send(validatorResult);
    }
    AMRT = result[0]["valor_str"];
  } catch (error) {
    const { body } = handleError(
      error,
      "Parámetro de amortización",
      acciones.get
    );
    return res.send(body);
  }
  return res.send({ AMRT: AMRT });
};

export const getEstados = async (req, res) => {
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM estados_vehiculos",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(
      error,
      "Estados de los vehículos",
      acciones.get
    );
    return res.send(body);
  }
};

export const getPlanCuentas = async (req, res) => {
  try {
    const resultado = await pa7_giama_renting.query(
      "SELECT Codigo, Nombre, CuentaSecundaria FROM c_plancuentas",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Cuentas contables", acciones.get);
    return res.send(body);
  }
};

export const getProveedores = async (req, res) => {
  try {
    const resultado = await pa7_giama_renting.query(
      "SELECT Codigo, RazonSocial, TipoResponsable FROM c_proveedores",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Cuentas contables", acciones.get);
    return res.send(body);
  }
};

export const getProveedoresVehiculo = async (req, res) => {
  try {
    const resultado = await pa7_giama_renting.query(
      "SELECT Codigo, RazonSocial, TipoResponsable FROM c_proveedores WHERE Codigo = 11",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Cuentas contables", acciones.get);
    return res.send(body);
  }
};
