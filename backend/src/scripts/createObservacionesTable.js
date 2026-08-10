import { giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";

async function createTable() {
  try {
    console.log("Creando tabla vehiculos_observaciones si no existe...");
    await giama_renting.query(`
      CREATE TABLE IF NOT EXISTS vehiculos_observaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehiculo_id INT NOT NULL,
        observacion TEXT NOT NULL,
        usuario VARCHAR(100) NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vehiculo_id (vehiculo_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, { type: QueryTypes.RAW });
    console.log("Tabla vehiculos_observaciones creada / verificada con éxito.");

    // Migrar observaciones iniciales si existen en la tabla vehiculos
    console.log("Migrando observaciones iniciales de vehiculos...");
    const [vehiculosConObs] = await giama_renting.query(`
      SELECT id, observaciones, usuario_ultima_modificacion, updatedAt
      FROM vehiculos
      WHERE observaciones IS NOT NULL AND TRIM(observaciones) != ''
    `);

    let migrados = 0;
    for (const v of vehiculosConObs) {
      // Verificar si ya existe al menos una observación registrada para este vehículo
      const [existentes] = await giama_renting.query(
        `SELECT id FROM vehiculos_observaciones WHERE vehiculo_id = :vehiculo_id LIMIT 1`,
        { replacements: { vehiculo_id: v.id }, type: QueryTypes.SELECT }
      );

      if (!existentes) {
        await giama_renting.query(
          `INSERT INTO vehiculos_observaciones (vehiculo_id, observacion, usuario, fecha)
           VALUES (:vehiculo_id, :observacion, :usuario, :fecha)`,
          {
            replacements: {
              vehiculo_id: v.id,
              observacion: v.observaciones,
              usuario: v.usuario_ultima_modificacion || "Sistema",
              fecha: v.updatedAt || new Date()
            },
            type: QueryTypes.INSERT
          }
        );
        migrados++;
      }
    }
    console.log(`Migración completada. Registros insertados: ${migrados}`);
    await giama_renting.close();
    process.exit(0);
  } catch (error) {
    console.error("Error al crear la tabla o migrar observaciones:", error);
    await giama_renting.close().catch(() => {});
    process.exit(1);
  }
}

createTable();
