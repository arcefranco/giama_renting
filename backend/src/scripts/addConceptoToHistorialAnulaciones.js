import { giama_renting } from "../../helpers/connection.js";

async function run() {
  try {
    console.log("Agregando columna 'concepto' a 'historial_anulaciones' en la base de datos de testing...");

    // MySQL 5.7 / 8.0: Check if column exists, if not add it
    const [columns] = await giama_renting.query(
      "SHOW COLUMNS FROM historial_anulaciones LIKE 'concepto'"
    );

    if (columns.length === 0) {
      await giama_renting.query(
        "ALTER TABLE historial_anulaciones ADD COLUMN concepto VARCHAR(255) NULL AFTER nro_asiento_anulacion"
      );
      console.log("Columna 'concepto' agregada exitosamente.");
    } else {
      console.log("La columna 'concepto' ya existe en 'historial_anulaciones'.");
    }
  } catch (error) {
    console.error("Error al alterar la tabla:", error);
  } finally {
    process.exit(0);
  }
}

run();
