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
    if (!result || result.length === 0) {
      throw new Error(`La forma de cobro ID ${id} no existe en la base de datos de Renting o no tiene cuenta contable.`);
    }
    return result[0]["cuenta_contable"];
  } catch (error) {
    console.log(error);
    throw new Error(`Error al buscar forma cobro: ${id}. Detalle: ${error.message}`);
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