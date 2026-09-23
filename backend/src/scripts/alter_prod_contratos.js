import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PROD_HOST = "giama-db-t3-11052026.cojfgn4yxtap.us-west-2.rds.amazonaws.com";

const prodDb = new Sequelize("giama_renting", process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: PROD_HOST, dialect: "mysql", logging: false
});

async function alterProd() {
  console.log("Conectando a Producción...");
  try {
    await prodDb.authenticate();
    console.log("Conexión exitosa. Agregando columnas a contratos_alquiler...");

    const alters = [
      "ALTER TABLE contratos_alquiler ADD COLUMN id_unidad_movimiento_entrega INT(11) NULL;",
      "ALTER TABLE contratos_alquiler ADD COLUMN id_unidad_movimiento_devolucion INT(11) NULL;",
      "ALTER TABLE contratos_alquiler ADD COLUMN hora_desde TIME NULL;",
      "ALTER TABLE contratos_alquiler ADD COLUMN hora_hasta TIME NULL;"
    ];

    for (const sql of alters) {
      console.log(`Ejecutando: ${sql}`);
      try {
        await prodDb.query(sql, { type: QueryTypes.RAW });
        console.log("  -> OK");
      } catch (err) {
        if (err.message && err.message.includes("Duplicate column name")) {
          console.log("  -> La columna ya existe, omitiendo.");
        } else {
          console.error("  -> Error:", err.message);
        }
      }
    }
    console.log("Columnas agregadas con éxito en Producción.");
  } catch (err) {
    console.error("Error al alterar la base de datos:", err);
  } finally {
    await prodDb.close();
  }
}

alterProd();
