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
  transaction,
  comprobante,
  Fecha
) => {
  try {
    await pa7_giama_renting.query(
      `INSERT INTO ${db} 
    (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante) VALUES (:Fecha,:NroAsiento,:cuenta_contable,
    :DH,:importe,:concepto,:comprobante)`,
      {
        type: QueryTypes.INSERT,
        replacements: {
          Fecha: Fecha ? Fecha : getTodayDate(),
          NroAsiento,
          cuenta_contable,
          DH,
          importe,
          concepto,
          comprobante: comprobante ?? null,
        },
        transaction: transaction,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al generar un asiento ${
        error.message ?? `${" :"}${error.message}`
      }`
    );
  }
};
