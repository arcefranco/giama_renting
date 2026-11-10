import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const alterSql = `
  ALTER TABLE contratos_digitales 
    MODIFY COLUMN plazo_semanas VARCHAR(50) NOT NULL DEFAULT '12';

  ALTER TABLE contratos_digitales 
    ADD COLUMN IF NOT EXISTS observaciones TEXT NULL AFTER plazo_semanas;

  ALTER TABLE contratos_digitales 
    ADD COLUMN IF NOT EXISTS fecha_fin DATE NULL AFTER fecha;
`;

async function runOnDatabase(label, host, dbName, user, pass) {
  if (!host || !dbName || !user) {
    console.log(`[SKIP] Falta configuración para ${label}.`);
    return;
  }
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
    
    // Ejecutar alter statements uno por uno para MySQL compat
    console.log(`Modificando columna plazo_semanas a VARCHAR(50)...`);
    await db.query(`ALTER TABLE contratos_digitales MODIFY COLUMN plazo_semanas VARCHAR(50) NOT NULL DEFAULT '12'`);
    
    // Check if observaciones exists
    const [obsCol] = await db.query(
      `SHOW COLUMNS FROM contratos_digitales LIKE 'observaciones'`
    );
    if (obsCol.length === 0) {
      console.log(`Agregando columna observaciones...`);
      await db.query(`ALTER TABLE contratos_digitales ADD COLUMN observaciones TEXT NULL AFTER plazo_semanas`);
    } else {
      console.log(`Columna observaciones ya existe.`);
    }

    // Check if fecha_fin exists
    const [finCol] = await db.query(
      `SHOW COLUMNS FROM contratos_digitales LIKE 'fecha_fin'`
    );
    if (finCol.length === 0) {
      console.log(`Agregando columna fecha_fin...`);
      await db.query(`ALTER TABLE contratos_digitales ADD COLUMN fecha_fin DATE NULL AFTER fecha`);
    } else {
      console.log(`Columna fecha_fin ya existe.`);
    }

    console.log(`[OK] Migración completada en ${label}.`);
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

  // 2. PRODUCCION (si está configurado)
  if (process.env.DB_HOST_prod) {
    const prodHost = process.env.DB_HOST_prod;
    const prodDbName = process.env.DB_NAME_PROD || "giama_renting";
    await runOnDatabase("PRODUCCION", prodHost, prodDbName, user, pass);
  }

  console.log("\nProceso de migración finalizado.");
}

main();

