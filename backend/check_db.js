import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    timezone: "-03:00",
    logging: false,
  }
);

async function main() {
  try {
    const rows = await db.query(
      `SELECT * FROM costos_ingresos WHERE id_concepto = 35 ORDER BY id DESC LIMIT 5`,
      { type: QueryTypes.SELECT }
    );
    console.log("Últimos costos_ingresos (telepase):", rows);
    await db.close();
  } catch (error) {
    console.error(error);
    await db.close();
  }
}
main();
