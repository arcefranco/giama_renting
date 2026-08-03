import { pa7_giama_renting } from './helpers/connection.js';

async function run() {
  try {
    const res = await pa7_giama_renting.query("SELECT * FROM conceptosfacturacion LIMIT 50", { type: pa7_giama_renting.QueryTypes.SELECT });
    console.log(res);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
