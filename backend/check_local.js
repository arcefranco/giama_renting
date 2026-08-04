import { sequelize } from "./src/database/database.js";
import { QueryTypes } from "sequelize";

async function run() {
  try {
    const clientes = await sequelize.query("SELECT id, razon_social FROM clientes WHERE razon_social LIKE '%prueba%' OR razon_social LIKE '%BURNET%'", { type: QueryTypes.SELECT });
    console.log("Clientes encontrados:");
    console.log(clientes);

    for (const c of clientes) {
       const alquileres = await sequelize.query("SELECT id as id_alquiler, id_contrato, id_vehiculo, fecha_desde, fecha_hasta, nro_asiento FROM alquileres WHERE id_cliente = ? ORDER BY id DESC LIMIT 5", { replacements: [c.id], type: QueryTypes.SELECT });
       console.log(`\nAlquileres para cliente ${c.id} (${c.razon_social}):`);
       console.table(alquileres);
    }

    process.exit(0);
  } catch (e) {
    console.error("Error connecting to DB:", e);
    process.exit(1);
  }
}
run();
