import { pa7_giama_renting } from './helpers/connection.js';

async function run() {
  try {
    const res = await pa7_giama_renting.query("SHOW TABLES LIKE '%concepto%'", { type: pa7_giama_renting.QueryTypes.SELECT });
    console.log(res);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
