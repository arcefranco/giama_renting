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

    console.log("Tabla pagos_cabify creada / verificada con éxito en Producción.");
    await prodDb.close();
    process.exit(0);
  } catch (error) {
    console.error("Error al crear la tabla pagos_cabify en Producción:", error);
    await prodDb.close().catch(() => {});
    process.exit(1);
  }
}

createTableProd();
