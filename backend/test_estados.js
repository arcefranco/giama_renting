import { giama_renting } from "./helpers/connection.js";
import { QueryTypes } from "sequelize";
async function getEstados() {
  const result = await giama_renting.query("SELECT * FROM estados_vehiculos", { type: QueryTypes.SELECT });
  console.log(result);
  process.exit();
}
getEstados();
