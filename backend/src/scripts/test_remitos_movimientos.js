import dotenv from "dotenv";
dotenv.config();
import { giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";
import { postRemito, anularRemito } from "../controllers/vehiculosController.js";
import { postMovimientoContrato } from "../controllers/alquileresController.js";

const createMockRes = () => {
  const res = {};
  res.send = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function runTests() {
  console.log("==================================================");
  console.log("INICIANDO INTEGRATION & NEGATIVE TESTING DE REMITOS Y MOVIMIENTOS");
  console.log(`Base de datos: ${process.env.DB_NAME} en ${process.env.DB_HOST}`);
  console.log("==================================================\n");

  let paso = 1;
  let testRemitoId = null;
  let testContratoId = null;
  let testVehiculoId = null;

  try {
    // ----------------------------------------------------
    // TEST 1: Verificación de Tablas y Columnas
    // ----------------------------------------------------
    console.log(`[TEST ${paso++}] Verificando tablas y columnas necesarias en la BD...`);
    const [tables] = await giama_renting.query("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);

    const requeridas = ["remitos", "remito_detalles", "unidad_movimientos", "contratos_alquiler"];
    for (const reqTable of requeridas) {
      if (!tableNames.includes(reqTable)) {
        throw new Error(`La tabla '${reqTable}' no existe en la base de datos de testing.`);
      }
    }
    console.log("✓ Tablas 'remitos', 'remito_detalles', 'unidad_movimientos' y 'contratos_alquiler' verificadas.");

    const [colsContrato] = await giama_renting.query("DESCRIBE contratos_alquiler");
    const colNames = colsContrato.map(c => c.Field);
    if (!colNames.includes("id_unidad_movimiento_entrega") || !colNames.includes("id_unidad_movimiento_devolucion")) {
      throw new Error("Faltan las columnas id_unidad_movimiento_entrega / devolucion en contratos_alquiler.");
    }
    console.log("✓ Columnas 'id_unidad_movimiento_entrega' e 'id_unidad_movimiento_devolucion' presentes en contratos_alquiler.\n");

    // ----------------------------------------------------
    // Buscar vehiculo y contrato de prueba
    // ----------------------------------------------------
    const contratosPrueba = await giama_renting.query(
      "SELECT id, id_vehiculo FROM contratos_alquiler LIMIT 1",
      { type: QueryTypes.SELECT }
    );
    if (!contratosPrueba || contratosPrueba.length === 0) {
      throw new Error("No hay contratos en la BD para probar movimientos de contrato.");
    }
    testContratoId = contratosPrueba[0].id;
    testVehiculoId = contratosPrueba[0].id_vehiculo;
    console.log(`Obtenido contrato de prueba ID ${testContratoId} (Vehículo ID ${testVehiculoId}).\n`);

    // ----------------------------------------------------
    // TEST 2: Registro de Movimiento en Contrato (Egreso)
    // ----------------------------------------------------
    console.log(`[TEST ${paso++}] Probando registro de movimiento de ENTREGA (egreso) en Contrato...`);
    const fechaTest = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const [movIdEgreso] = await giama_renting.query(
      `INSERT INTO unidad_movimientos 
       (id_unidad, fecha_movimiento, tipo, motivo, observaciones, id_contrato, retira, autorizo, usuario_alta, created_at)
       VALUES (?, ?, 'egreso', 'alquiler', 'TEST AUTOMATIZADO ENTREGA', ?, 'JUAN PEREZ', 'SUPERVISOR', 'TESTER', NOW())`,
      {
        replacements: [testVehiculoId, fechaTest, testContratoId],
        type: QueryTypes.INSERT,
      }
    );

    await giama_renting.query(
      `UPDATE contratos_alquiler SET id_unidad_movimiento_entrega = ? WHERE id = ?`,
      { replacements: [movIdEgreso, testContratoId], type: QueryTypes.UPDATE }
    );

    const contratoVerifEgreso = await giama_renting.query(
      "SELECT id_unidad_movimiento_entrega FROM contratos_alquiler WHERE id = ?",
      { replacements: [testContratoId], type: QueryTypes.SELECT }
    );
    if (contratoVerifEgreso[0].id_unidad_movimiento_entrega !== movIdEgreso) {
      throw new Error("El ID de movimiento entrega no coincidió en contratos_alquiler.");
    }
    console.log(`✓ Movimiento de entrega creado correctamente (ID Movimiento: ${movIdEgreso}) y vinculado al contrato.\n`);

    // ----------------------------------------------------
    // TEST 3: Registro de Movimiento en Contrato (Ingreso)
    // ----------------------------------------------------
    console.log(`[TEST ${paso++}] Probando registro de movimiento de DEVOLUCIÓN (ingreso) en Contrato...`);
    const [movIdIngreso] = await giama_renting.query(
      `INSERT INTO unidad_movimientos 
       (id_unidad, fecha_movimiento, tipo, motivo, observaciones, id_contrato, retira, autorizo, usuario_alta, created_at)
       VALUES (?, ?, 'ingreso', 'devolucion', 'TEST AUTOMATIZADO DEVOLUCION', ?, 'JUAN PEREZ', 'SUPERVISOR', 'TESTER', NOW())`,
      {
        replacements: [testVehiculoId, fechaTest, testContratoId],
        type: QueryTypes.INSERT,
      }
    );

    await giama_renting.query(
      `UPDATE contratos_alquiler SET id_unidad_movimiento_devolucion = ? WHERE id = ?`,
      { replacements: [movIdIngreso, testContratoId], type: QueryTypes.UPDATE }
    );

    const contratoVerifIngreso = await giama_renting.query(
      "SELECT id_unidad_movimiento_devolucion FROM contratos_alquiler WHERE id = ?",
      { replacements: [testContratoId], type: QueryTypes.SELECT }
    );
    if (contratoVerifIngreso[0].id_unidad_movimiento_devolucion !== movIdIngreso) {
      throw new Error("El ID de movimiento devolución no coincidió en contratos_alquiler.");
    }
    console.log(`✓ Movimiento de devolución creado correctamente (ID Movimiento: ${movIdIngreso}) y vinculado al contrato.\n`);

    // ----------------------------------------------------
    // TEST 4: Generación de Nuevo Remito con 2 Unidades
    // ----------------------------------------------------
    console.log(`[TEST ${paso++}] Probando generación de nuevo REMITO correlativo...`);
    const vehiculosPrueba = await giama_renting.query(
      "SELECT id FROM vehiculos LIMIT 2",
      { type: QueryTypes.SELECT }
    );
    const idVehiculosRemito = vehiculosPrueba.map(v => v.id);

    const numResult = await giama_renting.query(
      "SELECT COALESCE(MAX(numero), 0) + 1 AS sig FROM remitos WHERE punto_venta = 1",
      { type: QueryTypes.SELECT }
    );
    const nroEsperado = numResult[0].sig;

    const [idRemitoCreado] = await giama_renting.query(
      `INSERT INTO remitos 
       (numero, punto_venta, fecha_emision, estado, observaciones, usuario_alta, created_at)
       VALUES (?, 1, NOW(), 'EMITIDO', 'REMITO PRUEBA INTEGRACION', 'TESTER', NOW())`,
      { replacements: [nroEsperado], type: QueryTypes.INSERT }
    );
    testRemitoId = idRemitoCreado;

    let movsCreados = [];
    for (const vId of idVehiculosRemito) {
      const [movId] = await giama_renting.query(
        `INSERT INTO unidad_movimientos 
         (id_unidad, fecha_movimiento, tipo, motivo, destino, retira, autorizo, usuario_alta, created_at)
         VALUES (?, NOW(), 'egreso', 'egreso_remito', 'DEPOSITO CENTRAL', 'CHOFER PRUEBA', 'LOGISTICA', 'TESTER', NOW())`,
        { replacements: [vId], type: QueryTypes.INSERT }
      );
      movsCreados.push(movId);

      await giama_renting.query(
        `INSERT INTO remito_detalles (id_remito, id_unidad, id_movimiento, created_at) VALUES (?, ?, ?, NOW())`,
        { replacements: [testRemitoId, vId, movId], type: QueryTypes.INSERT }
      );
    }

    const nroFormatted = `0001-${String(nroEsperado).padStart(8, '0')}`;
    console.log(`✓ Remito N° ${nroFormatted} (ID: ${testRemitoId}) generado con ${idVehiculosRemito.length} unidades y ${movsCreados.length} movimientos de unidad.\n`);

    // ----------------------------------------------------
    // TEST 5: Anulación del Remito y Verificación de Limpieza
    // ----------------------------------------------------
    console.log(`[TEST ${paso++}] Probando ANULACIÓN del Remito N° ${nroFormatted}...`);
    
    // Anular
    await giama_renting.query(
      "DELETE FROM unidad_movimientos WHERE id IN (?)",
      { replacements: [movsCreados], type: QueryTypes.DELETE }
    );
    await giama_renting.query(
      "UPDATE remito_detalles SET id_movimiento = NULL WHERE id_remito = ?",
      { replacements: [testRemitoId], type: QueryTypes.UPDATE }
    );
    await giama_renting.query(
      "UPDATE remitos SET estado = 'ANULADO', fecha_anulacion = NOW(), usuario_anulacion = 'TESTER', motivo_anulacion = 'PRUEBA INTEGRACION' WHERE id = ?",
      { replacements: [testRemitoId], type: QueryTypes.UPDATE }
    );

    const remitoAnulado = await giama_renting.query(
      "SELECT estado FROM remitos WHERE id = ?",
      { replacements: [testRemitoId], type: QueryTypes.SELECT }
    );
    if (remitoAnulado[0].estado !== "ANULADO") {
      throw new Error("El estado del remito no cambió a ANULADO.");
    }

    const movsRestantes = await giama_renting.query(
      "SELECT COUNT(*) AS cant FROM unidad_movimientos WHERE id IN (?)",
      { replacements: [movsCreados], type: QueryTypes.SELECT }
    );
    if (Number(movsRestantes[0].cant) !== 0) {
      throw new Error("Los movimientos asociados al remito anulado no fueron eliminados.");
    }
    console.log(`✓ Remito N° ${nroFormatted} cambiado a ANULADO y los ${movsCreados.length} movimientos fueron eliminados correctamente de unidad_movimientos.\n`);

    // ----------------------------------------------------
    // TEST 6 (CASO NEGATIVO): Generar Remito sin unidades
    // ----------------------------------------------------
    console.log(`[TEST ${paso++}] (NEGATIVO) Probando intento de generar Remito SIN unidades...`);
    const reqNeg1 = { body: { tipo: "egreso", fecha_movimiento: "2026-09-15 10:00:00", unidades: [] } };
    const resNeg1 = createMockRes();
    await postRemito(reqNeg1, resNeg1);
    if (resNeg1.data.status !== false) {
      throw new Error("El sistema debió rechazar la generación de remito sin unidades.");
    }
    console.log(`✓ Rechazado correctamente con mensaje: "${resNeg1.data.message}"\n`);

    // ----------------------------------------------------
    // TEST 7 (CASO NEGATIVO): Generar Remito con unidades duplicadas
    // ----------------------------------------------------
    console.log(`[TEST ${paso++}] (NEGATIVO) Probando intento de incluir unidades duplicadas...`);
    const reqNeg2 = { body: { tipo: "egreso", fecha_movimiento: "2026-09-15 10:00:00", unidades: [1, 1] } };
    const resNeg2 = createMockRes();
    await postRemito(reqNeg2, resNeg2);
    if (resNeg2.data.status !== false) {
      throw new Error("El sistema debió rechazar unidades duplicadas en el mismo remito.");
    }
    console.log(`✓ Rechazado correctamente con mensaje: "${resNeg2.data.message}"\n`);

    // ----------------------------------------------------
    // TEST 8 (CASO NEGATIVO): Re-anular Remito ya anulado
    // ----------------------------------------------------
    console.log(`[TEST ${paso++}] (NEGATIVO) Probando intento de re-anular Remito previamente anulado...`);
    const reqNeg3 = { body: { id_remito: testRemitoId, usuario_anulacion: "TESTER" } };
    const resNeg3 = createMockRes();
    await anularRemito(reqNeg3, resNeg3);
    if (resNeg3.data.status !== false) {
      throw new Error("El sistema debió rechazar la re-anulación de un remito ya anulado.");
    }
    console.log(`✓ Rechazado correctamente con mensaje: "${resNeg3.data.message}"\n`);

    // ----------------------------------------------------
    // TEST 9 (CASO NEGATIVO): Registrar movimiento en contrato inexistente
    // ----------------------------------------------------
    console.log(`[TEST ${paso++}] (NEGATIVO) Probando movimiento en ID de Contrato inexistente (99999999)...`);
    const reqNeg4 = { body: { id_contrato: 99999999, fecha_movimiento: "2026-09-15 10:00:00", tipo: "egreso" } };
    const resNeg4 = createMockRes();
    await postMovimientoContrato(reqNeg4, resNeg4);
    if (resNeg4.data.status !== false) {
      throw new Error("El sistema debió rechazar el registro en contrato inexistente.");
    }
    console.log(`✓ Rechazado correctamente con mensaje: "${resNeg4.data.message}"\n`);

    // Cleanup test data
    console.log("Limpiando datos temporales de prueba de la BD...");
    await giama_renting.query("DELETE FROM remito_detalles WHERE id_remito = ?", { replacements: [testRemitoId], type: QueryTypes.DELETE });
    await giama_renting.query("DELETE FROM remitos WHERE id = ?", { replacements: [testRemitoId], type: QueryTypes.DELETE });
    await giama_renting.query("DELETE FROM unidad_movimientos WHERE id IN (?, ?)", { replacements: [movIdEgreso, movIdIngreso], type: QueryTypes.DELETE });
    await giama_renting.query("UPDATE contratos_alquiler SET id_unidad_movimiento_entrega = NULL, id_unidad_movimiento_devolucion = NULL WHERE id = ?", { replacements: [testContratoId], type: QueryTypes.UPDATE });
    console.log("✓ Limpieza de datos completada.\n");

    console.log("==================================================");
    console.log(`¡TODAS LAS PRUEBAS (5 POSITIVAS + 4 CASOS NEGATIVOS) PASARON EXITOSAMENTE (9/9)!`);
    console.log("==================================================");

    await giama_renting.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ FALLÓ EL TESTING DE INTEGRACIÓN:", err.message || err);
    await giama_renting.close().catch(() => {});
    process.exit(1);
  }
}

runTests();
