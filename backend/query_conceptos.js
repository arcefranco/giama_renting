import { giama_renting } from './helpers/connection.js';
async function run() {
  try {
    const res = await giama_renting.query("SELECT id, nombre, genera_factura FROM conceptos_costos WHERE nombre LIKE '%telepase%'", { type: giama_renting.QueryTypes.SELECT });
    console.log(res);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
