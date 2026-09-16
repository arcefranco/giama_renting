import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const sequelize = new Sequelize(
  "giama_renting",
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST_prod,
    dialect: "mysql",
    logging: false,
  }
);

async function checkTables() {
  try {
    const tablesToCheck = ['telepases', 'multas', 'observaciones', 'historial_anulaciones'];
    for (const table of tablesToCheck) {
      const [results] = await sequelize.query(`SHOW TABLES LIKE '${table}'`);
      if (results.length > 0) {
        console.log(`[x] La tabla '${table}' EXISTE en producción.`);
      } else {
        console.log(`[ ] La tabla '${table}' NO EXISTE en producción.`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await sequelize.close();
  }
}

checkTables();
