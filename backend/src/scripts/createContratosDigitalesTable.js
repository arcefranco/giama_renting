import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const createTableSql = `
  CREATE TABLE IF NOT EXISTS contratos_digitales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_contrato INT NULL,
    id_cliente INT NULL,
    id_vehiculo INT NULL,
    numero_contrato VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    locatario_nombre VARCHAR(150) NOT NULL,
    locatario_dni VARCHAR(30) NOT NULL,
    locatario_telefono VARCHAR(50) NULL,
    locatario_domicilio VARCHAR(255) NULL,
    locatario_localidad VARCHAR(100) NULL,
    locatario_email VARCHAR(150) NULL,
    vehiculo_marca VARCHAR(50) NULL,
    vehiculo_modelo VARCHAR(100) NULL,
    vehiculo_patente VARCHAR(20) NOT NULL,
    vehiculo_color VARCHAR(50) NULL,
    vehiculo_kilometraje INT NULL,
    alquiler_semanal DECIMAL(12,2) NOT NULL DEFAULT 0,
    deposito_garantia DECIMAL(12,2) NOT NULL DEFAULT 0,
    km_limite_semanal INT NOT NULL DEFAULT 1800,
    valor_km_excedente DECIMAL(12,2) NOT NULL DEFAULT 0,
    plazo_semanas INT NOT NULL DEFAULT 12,
    acepta_contrato TINYINT(1) NOT NULL DEFAULT 1,
    acepta_cabify TINYINT(1) NOT NULL DEFAULT 1,
    acepta_telepase TINYINT(1) NOT NULL DEFAULT 1,
    firma_digital MEDIUMTEXT NULL,
    usuario_alta VARCHAR(100) NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Firmado',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_contrato (id_contrato),
    INDEX idx_cliente (id_cliente),
    INDEX idx_vehiculo (id_vehiculo),
    INDEX idx_patente (vehiculo_patente),
    INDEX idx_dni (locatario_dni),
    INDEX idx_fecha (fecha)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

async function runOnDatabase(label, host, dbName, user, pass) {
  console.log(`\n========================================`);
  console.log(`Conectando a ${label} (${host} / DB: ${dbName})...`);
  const db = new Sequelize(dbName, user, pass, {
    host,
    dialect: "mysql",
    timezone: "-03:00",
    dialectOptions: { multipleStatements: true },
    logging: false,
  });

  try {
    await db.authenticate();
    console.log(`[OK] Conexión establecida a ${label}.`);
    console.log(`Ejecutando CREATE TABLE IF NOT EXISTS contratos_digitales...`);
    await db.query(createTableSql, { type: QueryTypes.RAW });
    console.log(`[OK] Tabla 'contratos_digitales' creada o ya existente en ${label}.`);
  } catch (err) {
    console.error(`[ERROR] en ${label}:`, err.message);
  } finally {
    await db.close().catch(() => {});
  }
}

async function main() {
  const user = process.env.DB_USERNAME;
  const pass = process.env.DB_PASSWORD;

  // 1. TESTING
  const testHost = process.env.DB_HOST;
  const testDbName = process.env.DB_NAME || "giama_renting_test";
  await runOnDatabase("TESTING", testHost, testDbName, user, pass);

  // 2. PRODUCCION
  const prodHost = process.env.DB_HOST_prod || "rds.giama.com.ar";
  const prodDbName = process.env.DB_NAME_PROD || "giama_renting";
  await runOnDatabase("PRODUCCION", prodHost, prodDbName, user, pass);

  console.log("\nProceso finalizado.");
}

main();
