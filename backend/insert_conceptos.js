import { giama_renting } from './helpers/connection.js';

async function run() {
  try {
    await giama_renting.query(`
      INSERT INTO conceptos_costos (id, nombre, cuenta_contable, cuenta_secundaria, ingreso_egreso, activable, genera_recibo, genera_factura)
      VALUES 
      (61, 'Excedentes Pasadas Telepase', '110303', '110303', 'I', 0, 1, 1),
      (74, 'Telepases Empresas', '410506', '410506', 'I', 0, 1, 1)
    `);
    console.log("Insertados correctamente");
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
