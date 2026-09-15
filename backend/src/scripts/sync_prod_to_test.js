import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const PROD_HOST = "giama-db-t3-11052026.cojfgn4yxtap.us-west-2.rds.amazonaws.com";
const TEST_HOST = process.env.DB_HOST;

const prodDb = new Sequelize("giama_renting", process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: PROD_HOST, dialect: "mysql", logging: false
});

const testDb = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: TEST_HOST, dialect: "mysql", logging: false
});

async function sync() {
  console.log("Iniciando copia de datos de Producción a Testing...");

  const patentes = ["AH688UW", "AH387LB", "AH252TX"];

  // 1. Obtener Vehículos en PROD
  const vehiculos = await prodDb.query("SELECT * FROM vehiculos WHERE dominio IN (:patentes)", {
    replacements: { patentes }, type: QueryTypes.SELECT
  });
  const vehiculoIds = vehiculos.map(v => v.id);
  console.log(`Vehículos encontrados en PROD: ${vehiculos.length} (IDs: ${vehiculoIds.join(", ")})`);

  // 2. Obtener Contratos en PROD
  const contratos = await prodDb.query("SELECT * FROM contratos_alquiler WHERE id_vehiculo IN (:vehiculoIds)", {
    replacements: { vehiculoIds }, type: QueryTypes.SELECT
  });
  const contratoIds = contratos.map(c => c.id);
  const clienteIds = [...new Set(contratos.map(c => c.id_cliente))];
  console.log(`Contratos encontrados en PROD: ${contratos.length}`);
  console.log(`Clientes involucrados en PROD: ${clienteIds.length} (IDs: ${clienteIds.join(", ")})`);

  // 3. Obtener Clientes en PROD
  const clientes = await prodDb.query("SELECT * FROM clientes WHERE id IN (:clienteIds)", {
    replacements: { clienteIds }, type: QueryTypes.SELECT
  });

  // Helper para insertar o actualizar filas en mysql
  async function upsertRows(tableName, rows) {
    if (!rows || rows.length === 0) return;
    
    // Obtener columnas existentes en la tabla de testing para no fallar por columnas inexistentes
    const [testColsResult] = await testDb.query(`DESCRIBE ${tableName}`);
    const validCols = new Set(testColsResult.map(c => c.Field));

    for (const row of rows) {
      const filteredRow = {};
      for (const [k, v] of Object.entries(row)) {
        if (validCols.has(k)) {
          filteredRow[k] = v;
        }
      }

      const keys = Object.keys(filteredRow);
      const fieldsSql = keys.map(k => `\`${k}\``).join(", ");
      const placeholders = keys.map(k => `:${k}`).join(", ");
      const updateSql = keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");

      const query = `
        INSERT INTO \`${tableName}\` (${fieldsSql})
        VALUES (${placeholders})
        ON DUPLICATE KEY UPDATE ${updateSql};
      `;

      await testDb.query(query, {
        replacements: filteredRow,
        type: QueryTypes.INSERT
      });
    }
    console.log(`✓ Tabla '${tableName}': ${rows.length} registros sincronizados con éxito.`);
  }

  await testDb.query("SET FOREIGN_KEY_CHECKS = 0;");

  try {
    await upsertRows("clientes", clientes);
    await upsertRows("vehiculos", vehiculos);
    await upsertRows("contratos_alquiler", contratos);
    console.log("¡SINCRONIZACIÓN COMPLETADA CON ÉXITO EN TESTING!");
  } catch (err) {
    console.error("Error durante la sincronización:", err);
  } finally {
    await testDb.query("SET FOREIGN_KEY_CHECKS = 1;");
    await prodDb.close();
    await testDb.close();
  }
}

sync();
