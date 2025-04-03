import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const giama_renting = new Sequelize(
  "giama_renting",
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    dialectOptions: {
      multipleStatements: true,
    },
  }
);
