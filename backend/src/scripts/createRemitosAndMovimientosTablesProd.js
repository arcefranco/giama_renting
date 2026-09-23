import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

async function createTablesProd() {
  const host = process.env.DB_HOST_prod || process.env.DB_HOST;
  const dbName = process.env.DB_NAME_PROD || "giama_renting";
  const user = process.env.DB_USERNAME;
  const pass = process.env.DB_PASSWORD;

  console.log(`Conectando a base de datos de PRODUCCIÓN en: ${host} (BD: ${dbName})...`);

  const prodDb = new Sequelize(dbName, user, pass, {
    host: host,
    dialect: "mysql",
    timezone: "-03:00",
    dialectOptions: {
      multipleStatements: true,
    },
    logging: console.log,
  });

  try {
    await prodDb.authenticate();
    console.log("Conexión a la base de datos de Producción establecida con éxito.");

    console.log("Creando tabla 'remitos' en Producción si no existe...");
    await prodDb.query(`
      CREATE TABLE IF NOT EXISTS remitos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero INT NOT NULL,
        punto_venta INT NOT NULL,
        fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        estado VARCHAR(50) NOT NULL DEFAULT 'EMITIDO',
        fecha_anulacion DATETIME NULL,
        usuario_anulacion VARCHAR(100) NULL,
        motivo_anulacion TEXT NULL,
        observaciones TEXT NULL,
        usuario_alta VARCHAR(100) NULL,
        usuario_ultima_modificacion VARCHAR(100) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_numero_punto_venta (punto_venta, numero),
        INDEX idx_fecha_emision (fecha_emision)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, { type: QueryTypes.RAW });

    console.log("Creando tabla 'unidad_movimientos' en Producción si no existe...");
    await prodDb.query(`
      CREATE TABLE IF NOT EXISTS unidad_movimientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_unidad INT NOT NULL,
        fecha_movimiento DATETIME NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        motivo VARCHAR(255) NULL,
        destino VARCHAR(255) NULL,
        id_contrato INT NULL,
        id_chofer INT NULL,
        retira VARCHAR(255) NULL,
        observaciones TEXT NULL,
        autorizo VARCHAR(100) NULL,
        usuario_alta VARCHAR(100) NULL,
        usuario_ultima_modificacion VARCHAR(100) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_id_unidad (id_unidad),
        INDEX idx_fecha_movimiento (fecha_movimiento),
        INDEX idx_id_contrato (id_contrato)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, { type: QueryTypes.RAW });

    console.log("Creando tabla 'remito_detalles' en Producción si no existe...");
    await prodDb.query(`
      CREATE TABLE IF NOT EXISTS remito_detalles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_remito INT NOT NULL,
        id_unidad INT NOT NULL,
        id_movimiento INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_id_remito (id_remito),
        INDEX idx_id_unidad (id_unidad),
        INDEX idx_id_movimiento (id_movimiento),
        CONSTRAINT fk_remito_detalles_remito FOREIGN KEY (id_remito) REFERENCES remitos (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_remito_detalles_movimiento FOREIGN KEY (id_movimiento) REFERENCES unidad_movimientos (id) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, { type: QueryTypes.RAW });

    console.log("¡Tablas 'remitos', 'unidad_movimientos' y 'remito_detalles' creadas y verificadas con éxito en PRODUCCIÓN!");
    await prodDb.close();
    process.exit(0);
  } catch (error) {
    console.error("Error al crear las tablas en Producción:", error.message || error);
    if (prodDb) await prodDb.close().catch(() => {});
    process.exit(1);
  }
}

createTablesProd();
