import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const giama_renting = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    dialectOptions: {
      multipleStatements: true,
    },
    logging: console.log,
    pool: {
      max: 15,
      min: 2,
      acquire: 30000, // espera máxima 30s
      idle: 10000,
    },
  }
);

export const pa7_giama_renting = new Sequelize(
  process.env.DB_PA7_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    dialectOptions: {
      multipleStatements: true,
    },
    logging: console.log,
    pool: {
      max: 15,
      min: 2,
      acquire: 30000, // espera máxima 30s
      idle: 10000,
    },
  }
);
