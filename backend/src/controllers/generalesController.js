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
