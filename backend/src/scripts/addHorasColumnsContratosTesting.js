import dotenv from "dotenv";
dotenv.config();
import { giama_renting } from "../../helpers/connection.js";

async function addHorasColumnsTesting() {
  try {
    console.log(`Agregando columnas de horario a 'contratos_alquiler' en TESTING (${process.env.DB_NAME} en ${process.env.DB_HOST})...`);

    const columns = [
      { name: "hora_desde", spec: "TIME NOT NULL DEFAULT '00:00:00'" },
      { name: "hora_hasta", spec: "TIME NOT NULL DEFAULT '00:00:00'" }
    ];

    for (const col of columns) {
      try {
        await giama_renting.query(`ALTER TABLE contratos_alquiler ADD COLUMN ${col.name} ${col.spec};`);
        console.log(`Columna '${col.name}' agregada con éxito a 'contratos_alquiler'.`);
      } catch (err) {
        if (err.original && (err.original.code === "ER_DUP_FIELDNAME" || err.original.errno === 1060)) {
          console.log(`La columna '${col.name}' ya existía en 'contratos_alquiler'.`);
        } else {
          console.error(`Error agregando columna '${col.name}':`, err.message || err);
        }
      }
    }

    console.log("Columnas agregadas con éxito en TESTING.");
    await giama_renting.close();
    process.exit(0);
  } catch (error) {
    console.error("Error al ejecutar migración en Testing:", error.message || error);
    await giama_renting.close().catch(() => {});
    process.exit(1);
  }
}

addHorasColumnsTesting();
