import { giama_renting } from './helpers/connection.js';
import { QueryTypes } from 'sequelize';

async function run() {
  try {
    const result = await giama_renting.query(
      `UPDATE c_movimientos SET cuenta = '210202' WHERE nro_asiento = 29971 AND cuenta = '210201'`,
      { type: QueryTypes.UPDATE }
    );
    console.log('Update result:', result);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
