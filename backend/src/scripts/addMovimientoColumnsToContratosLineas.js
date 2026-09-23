import dotenv from "dotenv";
dotenv.config();
import { giama_renting } from "../../helpers/connection.js";

async function addColumnsTesting() {
  try {
    console.log(`Modificando la tabla 'contratos_alquiler' en la base de datos (${process.env.DB_NAME} en ${process.env.DB_HOST})...`);

    const columns = [
      { name: "id_unidad_movimiento_entrega", spec: "INT NULL" },
      { name: "id_unidad_movimiento_devolucion", spec: "INT NULL" }
    ];

    for (const col of columns) {
      try {
        await giama_renting.query(`ALTER TABLE contratos_alquiler ADD COLUMN ${col.name} ${col.spec};`);
        console.log(`Columna '${col.name}' agregada con éxito a 'contratos_alquiler'.`);
      } catch (err) {
        if (err.original && (err.original.code === "ER_DUP_FIELDNAME" || err.original.errno === 1060)) {
          console.log(`La columna '${col.name}' ya existía en 'contratos_alquiler'.`);
        } else {
          console.error(`Error agregando la columna '${col.name}':`, err.message || err);
        }
      }
    }

    console.log("Proceso completado en TESTING con éxito.");
    await giama_renting.close();
    process.exit(0);
  } catch (error) {
    console.error("Error al ejecutar la alteración en Testing:", error.message || error);
    await giama_renting.close().catch(() => {});
    process.exit(1);
  }
}

addColumnsTesting();
