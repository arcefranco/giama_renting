import { giama_renting } from "./helpers/connection.js";
import { QueryTypes } from "sequelize";

async function run() {
  const conceptos = await giama_renting.query("SELECT * FROM conceptos_costos WHERE id IN (61, 74)", { type: QueryTypes.SELECT });
  console.log("Conceptos 61 y 74:");
  console.log(conceptos);
  const telepaseConcepts = await giama_renting.query("SELECT * FROM conceptos_costos WHERE nombre LIKE '%telepase%'", { type: QueryTypes.SELECT });
  console.log("Conceptos con telepase:");
  console.log(telepaseConcepts);
  process.exit(0);
}
run();
