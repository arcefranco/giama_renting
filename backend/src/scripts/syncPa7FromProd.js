import dotenv from "dotenv";
import { execSync } from "child_process";
import { Sequelize, QueryTypes } from "sequelize";

dotenv.config();

const {
  DB_HOST,
  DB_HOST_prod,
  DB_USERNAME,
  DB_PASSWORD,
  DB_PA7_NAME,
} = process.env;

if (!DB_HOST || !DB_HOST_prod || !DB_USERNAME || !DB_PASSWORD || !DB_PA7_NAME) {
  console.error("Faltan variables de entorno necesarias.");
  process.exit(1);
}

const tables = ["facturas", "facturasitems", "c_movimientos", "c2_movimientos"];

async function main() {
  console.log("=== INICIANDO SINCRONIZACIÓN PA7 PROD -> TEST ===");
  console.log(`Origen (Prod): ${DB_HOST_prod} / DB: ${DB_PA7_NAME}`);
  console.log(`Destino (Test): ${DB_HOST} / DB: ${DB_PA7_NAME}`);
  console.log(`Tablas: ${tables.join(", ")}\n`);

  // 1. Backup previo de test
  const backupFile = `/tmp/backup_test_pa7_${Date.now()}.sql`;
  console.log(`Generando backup de resguardo de testing en ${backupFile}...`);
  try {
    execSync(
      `mysqldump --single-transaction --set-gtid-purged=OFF -h "${DB_HOST}" -u "${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_PA7_NAME}" ${tables.join(" ")} > "${backupFile}"`,
      { stdio: "pipe" }
    );
    console.log("[OK] Backup previo de testing completado.");
  } catch (err) {
    console.warn("[WARN] No se pudo generar backup previo de test (posiblemente tablas vacías o permiso):", err.message);
  }

  // 2. Dump desde Prod e import a Test
  console.log("\nTransfiriendo tablas desde Producción hacia Testing...");
  const syncCmd = `mysqldump --single-transaction --quick --set-gtid-purged=OFF --add-drop-table -h "${DB_HOST_prod}" -u "${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_PA7_NAME}" ${tables.join(" ")} | mysql -h "${DB_HOST}" -u "${DB_USERNAME}" -p"${DB_PASSWORD}" "${DB_PA7_NAME}"`;

  const startTime = Date.now();
  execSync(syncCmd, { stdio: "inherit" });
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[OK] Transferencia completada en ${duration} segundos.\n`);

  // 3. Verificación de conteos
  const testPa7 = new Sequelize(DB_PA7_NAME, DB_USERNAME, DB_PASSWORD, {
    host: DB_HOST,
    dialect: "mysql",
    logging: false,
  });

  const prodPa7 = new Sequelize(DB_PA7_NAME, DB_USERNAME, DB_PASSWORD, {
    host: DB_HOST_prod,
    dialect: "mysql",
    logging: false,
  });

  console.log("=== VERIFICANDO CONTEOS ===");
  for (const table of tables) {
    const [p] = await prodPa7.query(`SELECT COUNT(*) as count, MAX(id) as max_id FROM \`${table}\``, { type: QueryTypes.SELECT }).catch(async () => {
      return await prodPa7.query(`SELECT COUNT(*) as count, MAX(ID) as max_id FROM \`${table}\``, { type: QueryTypes.SELECT });
    });
    const [t] = await testPa7.query(`SELECT COUNT(*) as count, MAX(id) as max_id FROM \`${table}\``, { type: QueryTypes.SELECT }).catch(async () => {
      return await testPa7.query(`SELECT COUNT(*) as count, MAX(ID) as max_id FROM \`${table}\``, { type: QueryTypes.SELECT });
    });

    console.log(`Tabla [${table}]:`);
    console.log(`  Prod: ${p.count} registros (Max ID: ${p.max_id})`);
    console.log(`  Test: ${t.count} registros (Max ID: ${t.max_id})`);
    console.log(`  Estado: ${p.count === t.count ? "✅ EXACTO" : "⚠️ DIFERENCIA"}`);
  }

  await prodPa7.close();
  await testPa7.close();

  console.log("\n=== SINCRONIZACIÓN FINALIZADA CON ÉXITO ===");
}

main().catch((err) => {
  console.error("[FATAL ERROR]:", err);
  process.exit(1);
});

