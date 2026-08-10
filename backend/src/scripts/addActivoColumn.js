import { giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";

const runMigration = async () => {
  try {
    console.log("Iniciando migración...");

    // 1. Agregar columna activo si no existe
    try {
      await giama_renting.query(
        "ALTER TABLE vehiculos ADD COLUMN activo TINYINT(1) DEFAULT 1;"
      );
      console.log("Columna 'activo' agregada exitosamente.");
    } catch (err) {
      if (err.message.includes("Duplicate column name")) {
        console.log("La columna 'activo' ya existe, omitiendo...");
      } else {
        throw err;
      }
    }

    // 2. Actualizar autos vendidos a activo = 0
    await giama_renting.query(
      "UPDATE vehiculos SET activo = 0 WHERE fecha_venta IS NOT NULL;"
    );
    console.log("Autos vendidos actualizados a activo = 0.");

    // 3. Crear el estado Cobrado DT si no existe
    const estados = await giama_renting.query(
      "SELECT id FROM estados_vehiculos WHERE nombre = 'Cobrado DT'",
      { type: QueryTypes.SELECT }
    );

    if (estados.length === 0) {
      await giama_renting.query(
        "INSERT INTO estados_vehiculos (nombre) VALUES ('Cobrado DT')"
      );
      console.log("Estado 'Cobrado DT' insertado.");
    } else {
      console.log("El estado 'Cobrado DT' ya existe.");
    }

    console.log("Migración finalizada con éxito.");
  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await giama_renting.close();
  }
};

runMigration();
