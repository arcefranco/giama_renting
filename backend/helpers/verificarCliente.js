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
    if (!result.length) return "Cliente no registrado";
    if (result[0]["resolucion_datero"] == 2)
      return "El cliente tiene su datero rechazado";
    return null;
  } catch (error) {
    console.log(error);
    return "Hubo un problema al verificar el estado del cliente";
  }
};
