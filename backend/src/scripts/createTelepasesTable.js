import { giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";

async function createTable() {
  try {
    console.log("Creando tabla telepases si no existe...");
    await giama_renting.query(`
      CREATE TABLE IF NOT EXISTS telepases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dominio VARCHAR(20) NOT NULL,
        chofer VARCHAR(150) NULL,
        cantidad_pasadas INT DEFAULT 1,
        total_tarifa DECIMAL(12, 2) DEFAULT 0.00,
        total_bonificacion DECIMAL(12, 2) DEFAULT 0.00,
        importe DECIMAL(12, 2) NOT NULL,
        rango_fechas VARCHAR(100) NULL,
        autopistas TEXT NULL,
        id_vehiculo INT NULL,
        id_cliente INT NOT NULL,
        cuit_cliente VARCHAR(50) NULL,
        usuario VARCHAR(100) NULL,
        usuario_alta VARCHAR(100) NULL,
        fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
        se_proceso TINYINT(1) DEFAULT 0,
        fecha_proceso DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dominio (dominio),
        INDEX idx_id_cliente (id_cliente),
        INDEX idx_id_vehiculo (id_vehiculo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, { type: QueryTypes.RAW });

    const alterCols = [
      "ALTER TABLE telepases ADD COLUMN usuario_alta VARCHAR(100) NULL;",
      "ALTER TABLE telepases ADD COLUMN fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP;",
      "ALTER TABLE telepases ADD COLUMN se_proceso TINYINT(1) DEFAULT 0;",
      "ALTER TABLE telepases ADD COLUMN fecha_proceso DATETIME NULL;"
    ];

    for (const sql of alterCols) {
      try {
        await giama_renting.query(sql, { type: QueryTypes.RAW });
      } catch (err) {
        // Ignorar si la columna ya existe
      }
    }
    console.log("Tabla telepases creada / verificada con éxito.");
    await giama_renting.close();
    process.exit(0);
  } catch (error) {
    console.error("Error al crear la tabla telepases:", error);
    await giama_renting.close().catch(() => {});
    process.exit(1);
  }
}

createTable();
