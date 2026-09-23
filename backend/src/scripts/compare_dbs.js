import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PROD_HOST = "giama-db-t3-11052026.cojfgn4yxtap.us-west-2.rds.amazonaws.com";
const TEST_HOST = process.env.DB_HOST;

const prodDb = new Sequelize("giama_renting", process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: PROD_HOST, dialect: "mysql", logging: false
});

const testDb = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: TEST_HOST, dialect: "mysql", logging: false
});

async function compare() {
  console.log("=== INICIANDO COMPARACION DE TESTING VS PRODUCCION ===");
  try {
    // We only need table names, mysql SHOW TABLES returns objects like { Tables_in_db: 'name' }
    const testTablesRes = await testDb.query("SHOW TABLES", { type: QueryTypes.SHOWTABLES });
    const prodTablesRes = await prodDb.query("SHOW TABLES", { type: QueryTypes.SHOWTABLES });
    
    // Sometimes it's directly array of strings depending on dialect config
    const testTables = testTablesRes;
    const prodTables = prodTablesRes;

    const missingTables = testTables.filter(t => !prodTables.includes(t));
    if (missingTables.length > 0) {
      console.log("\n[!] TABLAS QUE FALTAN EN PRODUCCION:");
      missingTables.forEach(t => console.log(`  - ${t}`));
    } else {
      console.log("\n[✓] Todas las tablas de testing existen en produccion.");
    }
    
    console.log("\n[!] COLUMNAS QUE FALTAN EN PRODUCCION (buscando en tablas existentes):");
    let missingColumnsCount = 0;
    
    const commonTables = testTables.filter(t => prodTables.includes(t));
    for (const table of commonTables) {
      const [testCols] = await testDb.query(`DESCRIBE \`${table}\``);
      const [prodCols] = await prodDb.query(`DESCRIBE \`${table}\``);
      
      const testColNames = testCols.map(c => c.Field);
      const prodColNames = prodCols.map(c => c.Field);
      
      const missingInProd = testCols.filter(c => !prodColNames.includes(c.Field));
      
      if (missingInProd.length > 0) {
        console.log(`  Tabla '${table}':`);
        missingInProd.forEach(c => {
          console.log(`    - Falta columna: ${c.Field} (${c.Type})`);
          missingColumnsCount++;
        });
      }
    }
    
    if (missingColumnsCount === 0) {
      console.log("  Ninguna, las tablas comunes tienen las mismas columnas.");
    }
    
  } catch (err) {
    console.error("Error comparando:", err);
  } finally {
    await prodDb.close();
    await testDb.close();
  }
}

compare();
