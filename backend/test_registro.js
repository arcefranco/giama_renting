import { giama_renting, pa7_giama_renting } from "./helpers/connection.js";
import { registrarIngresoIndividual } from "./src/controllers/costosController.js";
import { getTodayDate } from "./helpers/getTodayDate.js";

async function test() {
  const transaction = await giama_renting.transaction();
  const transaction_asientos = await pa7_giama_renting.transaction();
  try {
    await registrarIngresoIndividual({
      debe_ingreso: 1500,
      id_vehiculo: 10, // Un vehiculo de prueba
      fecha_deuda: `${getTodayDate()} 00:00:00`,
      fecha_pago: null,
      id_forma_cobro_1: null,
      total_cobro_1: 0,
      id_cliente: 381, // LABORATORIOS BURNET
      observacion: "Test observacion",
      observacion_pago: "",
      usuario: "sistema",
      id_concepto: 35,
      importe_neto: 1500,
      importe_iva: 0,
      importe_total: 1500,
      transaction_costos_ingresos: transaction,
      transaction_asientos: transaction_asientos,
    });
    console.log("Exito!");
    await transaction.rollback();
    await transaction_asientos.rollback();
  } catch (e) {
    console.error("Error:", e.message || e);
    await transaction.rollback();
    await transaction_asientos.rollback();
  }
  process.exit();
}

test();
