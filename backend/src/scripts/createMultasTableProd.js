import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

async function createTableProd() {
  const host = process.env.DB_HOST_prod || process.env.DB_HOST;
  const dbName = process.env.DB_NAME_PROD || "giama_renting";
  const user = process.env.DB_USERNAME;
  const pass = process.env.DB_PASSWORD;

  console.log(`Conectando a base de datos en: ${host} (BD: ${dbName})...`);

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
    console.log("Conexión a la base de datos establecida con éxito.");

    await prodDb.query(`
      CREATE TABLE IF NOT EXISTS multas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dominio VARCHAR(20) NOT NULL,
        fecha_infraccion DATE NOT NULL,
        hora TIME NULL,
        motivo_infraccion TEXT NULL,
        importe DECIMAL(12, 2) NOT NULL,
        acta_nro VARCHAR(100) NULL,
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
        INDEX idx_acta_nro (acta_nro),
        INDEX idx_id_cliente (id_cliente),
        INDEX idx_id_vehiculo (id_vehiculo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `, { type: QueryTypes.RAW });

    const alterCols = [
      "ALTER TABLE multas ADD COLUMN usuario_alta VARCHAR(100) NULL;",
      "ALTER TABLE multas ADD COLUMN fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP;",
      "ALTER TABLE multas ADD COLUMN se_proceso TINYINT(1) DEFAULT 0;",
      "ALTER TABLE multas ADD COLUMN fecha_proceso DATETIME NULL;"
    ];

    for (const sql of alterCols) {
      try {
        await prodDb.query(sql, { type: QueryTypes.RAW });
      } catch (err) {
        // Ignorar si la columna ya existe
      }
    }

    console.log("¡Tabla multas creada y verificada con éxito en Producción!");
    await prodDb.close();
    process.exit(0);
  } catch (error) {
    console.error("Error al crear la tabla multas en Producción:", error.message || error);
    if (prodDb) await prodDb.close().catch(() => {});
    process.exit(1);
  }
}

createTableProd();
