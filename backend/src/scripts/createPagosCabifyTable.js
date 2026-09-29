import { giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";

async function createTable() {
  try {
    console.log("Creando tabla pagos_cabify si no existe...");
    await giama_renting.query(`
      CREATE TABLE IF NOT EXISTS pagos_cabify (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conductor VARCHAR(255) NULL,
        cuit VARCHAR(50) NOT NULL,
        patente VARCHAR(20) NOT NULL,
        importe DECIMAL(12, 2) NOT NULL,
        id_cliente INT NULL,
        id_vehiculo INT NULL,
        nro_recibo INT NULL,
        nro_asiento INT NULL,
        nro_asiento_secundario INT NULL,
        usuario VARCHAR(100) NULL,
        fecha_proceso DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cuit (cuit),
        INDEX idx_patente (patente),
        INDEX idx_id_cliente (id_cliente),
        INDEX idx_id_vehiculo (id_vehiculo),
        INDEX idx_fecha_proceso (fecha_proceso)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, { type: QueryTypes.RAW });

    console.log("Tabla pagos_cabify creada / verificada con éxito.");
    await giama_renting.close();
    process.exit(0);
  } catch (error) {
    console.error("Error al crear la tabla pagos_cabify:", error);
    await giama_renting.close().catch(() => {});
    process.exit(1);
  }
}

createTable();
