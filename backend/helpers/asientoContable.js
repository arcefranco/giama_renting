import { pa7_giama_renting } from "./connection.js";
import { getTodayDate } from "./getTodayDate.js";
import { QueryTypes } from "sequelize";

export const asientoContable = async (
  db,
  NroAsiento,
  cuenta_contable,
  DH,
  importe,
  concepto,
  transaction
) => {
  try {
    await pa7_giama_renting.query(
      `INSERT INTO ${db} 
    (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto) VALUES (?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          NroAsiento,
          cuenta_contable,
          DH,
          importe,
          concepto,
        ],
        transaction: transaction,
      }
    );
  } catch (error) {
    console.log(error);
    transaction.rollback();
    throw "Error al generar un asiento";
  }
};
