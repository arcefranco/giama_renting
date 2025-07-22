import { giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";
export const verificarCliente = async (id_cliente) => {
  try {
    let result = await giama_renting.query(
      "SELECT resolucion_datero FROM clientes WHERE id = ? ",
      {
        type: QueryTypes.SELECT,
        replacements: [id_cliente],
      }
    );
    if (!result.length) throw new Error("Cliente no registrado");
    if (result[0]["resolucion_datero"] == 2)
      throw new Error(
        `El cliente tiene su datero rechazado${
          error.message ? `${" :"}${error.message}` : ""
        }`
      );
    return null;
  } catch (error) {
    throw error;
  }
};
