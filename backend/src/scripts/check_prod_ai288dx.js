import 'dotenv/config';
import { giama_renting } from "../../helpers/connection.js";

async function run() {
  try {
    console.log("--- CONSULTANDO TABLA TELEPASES ---");
    const [telepases] = await giama_renting.query(
      `SELECT id, dominio, cantidad_pasadas, importe, rango_fechas, fecha_alta, se_proceso 
       FROM telepases 
       WHERE dominio = 'AI288DX' 
       ORDER BY id DESC LIMIT 5`
    );
    console.table(telepases);

    console.log("\n--- BUSCANDO MOVIMIENTOS EN COSTOS_INGRESOS ---");
    const [movimientos] = await giama_renting.query(
      `SELECT id, id_cliente, fecha_deuda, debe_ingreso, importe_total, observacion, id_concepto 
       FROM costos_ingresos 
       WHERE observacion LIKE '%AI288DX%' OR observacion LIKE '%01/09/2026 al 31/08/2026%'
       ORDER BY id DESC LIMIT 5`
    );
    console.table(movimientos);

  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

run();
