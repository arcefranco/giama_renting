import { giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";

export const getParametro = async (codigo) => {
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [codigo],
      }
    );
    return result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    throw new Error(`Error al buscar el parámetro: ${codigo}`);
  }
};
