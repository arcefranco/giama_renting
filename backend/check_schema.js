import { pa7_giama_renting } from "./helpers/connection.js";

async function check() {
  try {
    const [facturas] = await pa7_giama_renting.query("DESCRIBE facturas");
    const [facturasitems] = await pa7_giama_renting.query("DESCRIBE facturasitems");
    const [clientesfacturacion] = await pa7_giama_renting.query("DESCRIBE clientesfacturacion");
    
    console.log("=== TABLA facturas ===");
    console.table(facturas);
    console.log("\n=== TABLA facturasitems ===");
    console.table(facturasitems);
    console.log("\n=== TABLA clientesfacturacion ===");
    console.table(clientesfacturacion);
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
