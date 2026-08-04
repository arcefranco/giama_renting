import { sequelize } from "./backend/src/database/database.js";
import { QueryTypes } from "sequelize";

async function run() {
  try {
    const clientes = await sequelize.query("SELECT id FROM clientes WHERE razon_social LIKE '%BURNET%'", { type: QueryTypes.SELECT });
    if (!clientes.length) { console.log("Cliente no encontrado"); return; }
    const id_cliente = clientes[0].id;

    console.log("ID Cliente:", id_cliente);

    const alquileres = await sequelize.query("SELECT id, id_contrato, nro_asiento FROM alquileres WHERE id_cliente = ? ORDER BY id DESC LIMIT 10", { replacements: [id_cliente], type: QueryTypes.SELECT });
    console.log("Últimos alquileres:", alquileres);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
