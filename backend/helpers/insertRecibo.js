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
  id_forma_cobro_1,
  id_forma_cobro_2,
  id_forma_cobro_3,
  nro_factura,
  transaction,
  importe_total_2,
  importe_total_3,
  importe_total_1,
) => {
  try {
    const [result] = await giama_renting.query(
      `INSERT INTO recibos 
      (fecha, detalle, importe_total, id_cliente,
      id_vehiculo, id_contrato, id_alquiler, id_forma_cobro, id_forma_cobro_2, id_forma_cobro_3, id_factura_pa6, usuario_alta,
      importe_total_2, importe_total_3, importe_total_1) 
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
          id_forma_cobro_1 ? id_forma_cobro_1 : null,
          id_forma_cobro_2 ? id_forma_cobro_2 : null,
          id_forma_cobro_3 ? id_forma_cobro_3 : null,
          nro_factura ? nro_factura : null,
          usuario,
          importe_total_2,
          importe_total_3,
          importe_total_1
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
