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
  Fecha,
  AsientoSecundario,
  TipoComprobante
) => {
  console.log("IMPORTE: ", importe);
  if (db === "c_movimientos") {
    try {
      await pa7_giama_renting.query(
        `INSERT INTO ${db} 
    (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, AsientoSecundario, TipoComprobante) 
    VALUES (:Fecha,:NroAsiento,:cuenta_contable,
    :DH,:importe,:concepto,:comprobante,:AsientoSecundario, :TipoComprobante)`,
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
            AsientoSecundario: AsientoSecundario ? AsientoSecundario : null,
            TipoComprobante: TipoComprobante ? TipoComprobante : null,
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
  }
  if (db === "c2_movimientos") {
    try {
      await pa7_giama_renting.query(
        `INSERT INTO ${db} 
    (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, TipoComprobante) 
    VALUES (:Fecha,:NroAsiento,:cuenta_contable,
    :DH,:importe,:concepto,:comprobante, :TipoComprobante)`,
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
            TipoComprobante: TipoComprobante ? TipoComprobante : null,
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
  }
};
