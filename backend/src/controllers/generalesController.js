import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";

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
    return res.send(error);
  }
};
export const getModelos = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM modelos", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
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
    return res.send(error);
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
    return res.send(error);
  }
};

export const getTiposSexo = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM tipos_sexo", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

export const getProvincias = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM provincias", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

export const getSucursales = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM sucursales", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
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
    return res.send(error);
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
    AMRT = result[0]["valor_str"];
  } catch (error) {
    return res.send(error);
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
    return res.send(error);
  }
};
