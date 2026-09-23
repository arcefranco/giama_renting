import 'dotenv/config';
import { pa7_giama_renting } from "../../helpers/connection.js";

async function run() {
  try {
    const q4 = await pa7_giama_renting.query(`SELECT * FROM net_c_view_getasientoscontables WHERE NroAsiento = 27534`);
    console.log("net_c_view_getasientoscontables:", q4[0]);
    
    // Check other possible tables
    const q5 = await pa7_giama_renting.query(`SHOW TABLES LIKE '%asiento%'`);
    console.log("Tables with asiento:", q5[0]);
    
    const q6 = await pa7_giama_renting.query(`SHOW TABLES LIKE '%movimiento%'`);
    console.log("Tables with movimiento:", q6[0]);

  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

run();
