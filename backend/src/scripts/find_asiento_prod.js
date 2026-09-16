import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const pa7_prod = new Sequelize(
  "pa7_giama_renting",
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST_prod,
    dialect: "mysql",
    logging: false,
  }
);

async function run() {
  try {
    const [tables] = await pa7_prod.query(`SHOW TABLES LIKE '%asiento%'`);
    console.log("tables pa7 asiento:", tables);
    
    const [tables2] = await pa7_prod.query(`SHOW TABLES LIKE '%movimiento%'`);
    console.log("tables pa7 movimiento:", tables2);
    
  } catch (error) {
    console.error(error);
  } finally {
    await pa7_prod.close();
  }
}

run();
