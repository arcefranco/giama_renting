import { giama_renting } from './helpers/connection.js';

async function run() {
  try {
    const res = await giama_renting.query("SELECT * FROM clientes LIMIT 1", { type: giama_renting.QueryTypes.SELECT });
    console.log(res);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
