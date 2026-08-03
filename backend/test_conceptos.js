import { giama_renting } from './helpers/connection.js';

async function run() {
  try {
    const res = await giama_renting.query("SELECT * FROM conceptos_costos WHERE id IN (61, 74)", { type: giama_renting.QueryTypes.SELECT });
    console.log(res);
    
    const res2 = await giama_renting.query("SELECT * FROM conceptos WHERE id IN (61, 74)", { type: giama_renting.QueryTypes.SELECT });
    console.log("conceptos:", res2);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
