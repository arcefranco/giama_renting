import { giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";
export const insertRecibo = async (
  fecha,
  detalle,
  importe_total,
  usuario,
  id_cliente,
  id_vehiculo,
  id_contrato,
  id_alquiler,
  transaction
) => {
  try {
    const [result] = await giama_renting.query(
      `INSERT INTO recibos 
      (fecha, detalle, importe_total, id_cliente,
      id_vehiculo, id_contrato, id_alquiler, usuario_alta) VALUES (?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          fecha,
          detalle,
          importe_total,
          id_cliente,
          id_vehiculo ? id_vehiculo : null,
          id_contrato ? id_contrato : null,
          id_alquiler ? id_alquiler : null,
          usuario,
        ],
        transaction: transaction,
      }
    );
    console.log("NRO RECIBO: ", result);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error(
      "Error al generar recibo" + error.message ? `: ${error.message}` : ""
    );
  }
};
