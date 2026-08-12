import { giama_renting } from './src/helpers/connection.js';
async function run() {
  const id_cliente = 219;
  const res = await giama_renting.query(`SELECT m.fecha, m.concepto, m.tipo FROM (
    SELECT pc.fecha AS fecha, pc.observacion AS concepto, 4 AS tipo FROM pagos_clientes pc WHERE pc.id_cliente = ?
    UNION ALL
    SELECT a.fecha_alquiler AS fecha, 'alquiler' AS concepto, 1 AS tipo FROM alquileres a WHERE a.id_cliente = ?
    UNION ALL
    SELECT ca.fecha_contrato AS fecha, 'deposito' AS concepto, 2 AS tipo FROM contratos_alquiler ca WHERE ca.id_cliente = ?
    UNION ALL
    SELECT ci.fecha AS fecha, 'costo' AS concepto, 3 AS tipo FROM costos_ingresos ci WHERE ci.id_cliente = ?
  ) m ORDER BY m.fecha, m.tipo`, { replacements: [id_cliente, id_cliente, id_cliente, id_cliente], type: giama_renting.QueryTypes.SELECT });
  console.log("Count for 219:", res.length);
  process.exit(0);
}
run();
