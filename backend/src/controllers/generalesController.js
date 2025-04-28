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
