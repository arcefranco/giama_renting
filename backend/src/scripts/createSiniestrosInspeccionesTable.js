import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";

async function createTable() {
  console.log("Conectando a base de datos...");

  try {
    await giama_renting.authenticate();
    console.log("Conexión establecida con éxito.");

    console.log("Creando tabla 'siniestros_inspecciones' si no existe...");
    await giama_renting.query(`
      CREATE TABLE IF NOT EXISTS siniestros_inspecciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_contrato INT NOT NULL,
        id_vehiculo INT NOT NULL,
        id_cliente INT NOT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'Entrega',
        fecha_hora DATETIME NOT NULL,
        verificador VARCHAR(100) NOT NULL,
        nivel_combustible VARCHAR(50) NULL,
        segundo_juego_llaves VARCHAR(20) NULL,
        kilometraje INT NOT NULL,
        kilometraje_manual TINYINT(1) DEFAULT 0,
        danos JSON NULL,
        control_general JSON NULL,
        observaciones TEXT NULL,
        fotos_guiadas JSON NULL,
        fotos_adicionales JSON NULL,
        firma_cliente MEDIUMTEXT NULL,
        aclaracion_cliente VARCHAR(100) NULL,
        firma_verificador MEDIUMTEXT NULL,
        aclaracion_verificador VARCHAR(100) NULL,
        id_unidad_movimiento INT NULL,
        usuario_alta VARCHAR(100) NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_contrato (id_contrato),
        INDEX idx_vehiculo (id_vehiculo),
        INDEX idx_cliente (id_cliente),
        INDEX idx_fecha_hora (fecha_hora),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, { type: QueryTypes.RAW });

    console.log("Tabla 'siniestros_inspecciones' creada exitosamente.");
  } catch (err) {
    console.error("Error al crear la tabla:", err);
  } finally {
    await giama_renting.close();
  }
}

createTable();
