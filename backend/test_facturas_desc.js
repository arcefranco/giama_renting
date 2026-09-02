import { pa7_giama_renting } from "./helpers/connection.js";
import { QueryTypes } from "sequelize";

async function run() {
  try {
    const cols = await pa7_giama_renting.query("DESCRIBE facturas", { type: QueryTypes.SELECT });
    console.log(JSON.stringify(cols, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
