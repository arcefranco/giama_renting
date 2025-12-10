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
    console.log(result);
    if (!result.length) throw new Error("Cliente no registrado");
    if (result[0]["resolucion_datero"] == 2)
      return `El cliente tiene su datero rechazado`;
    if (result[0]["resolucion_datero"] == 0)
      return `El cliente tiene su datero pendiente de aprobación`;
    return null;
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al verificar el estado del cliente ${
        error.message ? `${" :"}${error.message}` : ""
      } `
    );
  }
};
