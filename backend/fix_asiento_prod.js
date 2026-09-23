import { pa7_giama_renting } from './helpers/connection.js';
import { QueryTypes } from 'sequelize';

async function run() {
  try {
    console.log("Actualizando c_movimientos...");
    const res1 = await pa7_giama_renting.query(
      `UPDATE c_movimientos SET Cuenta = '210202' WHERE NroAsiento = 29971 AND Cuenta = '210201'`,
      { type: QueryTypes.UPDATE }
    );
    console.log("c_movimientos actualizado:", res1);

    console.log("Actualizando c2_movimientos...");
    const res2 = await pa7_giama_renting.query(
      `UPDATE c2_movimientos SET Cuenta = '210202' WHERE NroAsiento = 29971 AND Cuenta = '210201'`,
      { type: QueryTypes.UPDATE }
    );
    console.log("c2_movimientos actualizado:", res2);

    console.log("Actualizando facturas (cabecera)...");
    const res3 = await pa7_giama_renting.query(
      `UPDATE facturas SET PorcentajeIva = 10.5 WHERE PuntoVenta = 3 AND Numero = 10 AND Tipo = 'FA'`,
      { type: QueryTypes.UPDATE }
    );
    console.log("facturas actualizado:", res3);

    console.log("¡Todo actualizado correctamente!");
  } catch (error) {
    console.error("Error actualizando la base de datos:", error);
  } finally {
    process.exit();
  }
}

run();
