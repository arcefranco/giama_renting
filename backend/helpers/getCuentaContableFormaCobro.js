import { giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";

export const getCuentaContableFormaCobro = async (id) => {
  try {
    const result = await giama_renting.query(
      `SELECT cuenta_contable FROM formas_cobro WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return result[0]["cuenta_contable"];
  } catch (error) {
    console.log(error);
    throw new Error(`Error al buscar forma cobro: ${id}`);
  }
};

export const getCuentaSecundariaFormaCobro = async (id) => {
  try {
    const result = await giama_renting.query(
      `SELECT cuenta_secundaria FROM formas_cobro WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return result[0]["cuenta_secundaria"];
  } catch (error) {
    console.log(error);
    throw new Error(`Error al buscar el forma_cobro: ${id}`);
  }
};