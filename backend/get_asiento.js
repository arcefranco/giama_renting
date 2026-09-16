import { pa7_giama_renting } from './helpers/connection.js';
import { QueryTypes } from 'sequelize';

async function run() {
  try {
    console.log("Buscando en c_movimientos...");
    const movs = await pa7_giama_renting.query(
      `SELECT NroAsiento, Fecha, Cuenta, Importe, Concepto 
       FROM c_movimientos 
       WHERE Concepto LIKE '%MONTENEGRO%' AND Cuenta = '210201'`,
      { type: QueryTypes.SELECT }
    );
    console.log("Movimientos con MONTENEGRO y 210201:", movs);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

run();
