import { giama_renting } from './helpers/connection.js';

async function run() {
  try {
    const res = await giama_renting.query("SELECT * FROM c_conceptos WHERE IdConcepto IN (61, 74)", { type: giama_renting.QueryTypes.SELECT });
    console.log(res);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
