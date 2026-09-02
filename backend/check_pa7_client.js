import { pa7_giama_renting } from "./src/helpers/connection.js";
import { QueryTypes } from "sequelize";

async function run() {
  try {
    const clients = await pa7_giama_renting.query("SELECT * FROM clientesfacturacion ORDER BY Codigo DESC LIMIT 3", { type: QueryTypes.SELECT });
    console.log(JSON.stringify(clients, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
