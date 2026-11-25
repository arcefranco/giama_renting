import { describe, it, beforeEach, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import xlsx from "xlsx";
import {
  preprocesarMultas,
  confirmarImportacionMultas,
  getUltimoLoteMultas,
  anularMultasImportadas,
} from "../controllers/importacionesController.js";
import { anulacionDeuda } from "../controllers/ctacteController.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { padWithZeros } from "../../helpers/padWithZeros.js";
import { instalarBaseMultas } from "./fixtures/fakeDbMultas.js";

/**
 * Circuito completo de multas masivas, de punta a punta, sobre una base en memoria:
 * Excel -> preprocesar -> confirmar (lote + multa + deuda + asientos c/c2) -> última importación ->
 * anulación masiva (contra-asientos c/c2 + deuda anulada + historial + multa liberada) -> reimportar.
 */

const CUENTA_DEUDORES = "110310";
// Igual que producción: el concepto 36 usa la misma cuenta como principal y como secundaria
const CUENTA_MULTAS = "210118";
const CUENTA_MULTAS_SECUNDARIA = "210118";

const FIXTURES = {
  vehiculos: [
    { id: 65, dominio: "AH645XB" },
    { id: 66, dominio: "AE123CD" },
    { id: 67, dominio: "AF456GH" },
    { id: 68, dominio: "AG789JK" },
    { id: 69, dominio: "AD321LM" },
    { id: 70, dominio: "AC999ZZ" }, // vendido: sin contrato a la fecha de la multa
  ],
  clientes: [
    { id: 576, nro_documento: "30715489231", nombre: null, apellido: null, razon_social: "SERVICIOS Y MARKETING AGROPECUARIO SRL", no_es_chofer: 0 },
    { id: 577, nro_documento: "20301234567", nombre: "Juan", apellido: "Pérez", razon_social: null, no_es_chofer: 0 },
    { id: 578, nro_documento: "27345678901", nombre: "María", apellido: "Gómez", razon_social: null, no_es_chofer: 0 },
    { id: 579, nro_documento: "20287654321", nombre: "Carlos", apellido: "López", razon_social: null, no_es_chofer: 0 },
    { id: 580, nro_documento: "23401112223", nombre: "Lucía", apellido: "Fernández", razon_social: null, no_es_chofer: 0 },
  ],
  contratos: [
    { id: 329, id_vehiculo: 65, id_cliente: 576, fecha_desde: "2026-10-01", fecha_hasta: null },
    { id: 330, id_vehiculo: 66, id_cliente: 577, fecha_desde: "2026-10-01", fecha_hasta: "2026-12-31" },
    { id: 331, id_vehiculo: 67, id_cliente: 578, fecha_desde: "2026-09-15", fecha_hasta: null },
    { id: 332, id_vehiculo: 68, id_cliente: 579, fecha_desde: "2026-11-01", fecha_hasta: null },
    { id: 333, id_vehiculo: 69, id_cliente: 580, fecha_desde: "2026-08-01", fecha_hasta: null },
    { id: 334, id_vehiculo: 70, id_cliente: 577, fecha_desde: "2026-01-01", fecha_hasta: "2026-06-30" },
  ],
  conceptos: [
    { id: 36, nombre: "Infracción de Tránsito", cuenta_contable: CUENTA_MULTAS, cuenta_secundaria: CUENTA_MULTAS_SECUNDARIA, genera_factura: 0 },
  ],
  parametros: [
    { codigo: "IV21", valor_str: "210201" },
    { codigo: "IV22", valor_str: "210201" },
  ],
};

// 5 vehículos con contrato (uno con 2 multas) + 1 vehículo vendido
const FILAS_EXCEL = [
  { Dominio: "AH645XB", Fecha_Infraccion: "15/11/2026", Hora: "14:35:00", Motivo_Infraccion: "Exceso de velocidad", Importe: 85000, Acta_Nro: "A-1001" },
  { Dominio: "AE123CD", Fecha_Infraccion: "16/11/2026", Hora: "09:10:00", Motivo_Infraccion: "Semáforo en rojo", Importe: 120000, Acta_Nro: "A-1002" },
  { Dominio: "AF456GH", Fecha_Infraccion: "17/11/2026", Hora: "18:45:00", Motivo_Infraccion: "Estacionamiento indebido", Importe: 35000.5, Acta_Nro: "A-1003" },
  { Dominio: "AG789JK", Fecha_Infraccion: "18/11/2026", Hora: "07:55:00", Motivo_Infraccion: "Exceso de velocidad", Importe: 85000, Acta_Nro: "A-1004" },
  { Dominio: "AD321LM", Fecha_Infraccion: "19/11/2026", Hora: "22:20:00", Motivo_Infraccion: "Uso de celular", Importe: 64000, Acta_Nro: "A-1005" },
  { Dominio: "AH645XB", Fecha_Infraccion: "20/11/2026", Hora: "11:00:00", Motivo_Infraccion: "Exceso de velocidad", Importe: 85000, Acta_Nro: "A-1006" },
  { Dominio: "AC999ZZ", Fecha_Infraccion: "21/11/2026", Hora: "13:30:00", Motivo_Infraccion: "Exceso de velocidad", Importe: 85000, Acta_Nro: "A-1007" },
];
const MULTAS_IMPUTABLES = 6;

const USUARIO = { id: 7, user: "qa@giama.com" };
const MOTIVO = "Reimportación para agregar fecha y hora de infracción en el motivo";

const crearRes = () => {
  const res = { body: null, send(body) { res.body = body; return res; } };
  return res;
};

const llamar = async (controlador, req) => {
  const res = crearRes();
  await controlador({ user: USUARIO, ...req }, res);
  return res.body;
};

const excelBuffer = (filas) => {
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(filas), "Multas");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
};

const preprocesar = (filas) => llamar(preprocesarMultas, {
  file: {
    buffer: excelBuffer(filas),
    originalname: "multas.xlsx",
    mimetype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
});

const importar = async (filas = FILAS_EXCEL) => {
  const pre = await preprocesar(filas);
  assert.equal(pre.status, true, pre.message);
  const conf = await llamar(confirmarImportacionMultas, { body: { multas: pre.filas.filter((f) => f.incluir) } });
  assert.equal(conf.status, true, conf.message);
  return { pre, conf };
};

const ultimoLoteId = (db) => Math.max(0, ...db.multas_lotes.map((l) => l.id)) || null;

const anularMasivo = (db, ids, { motivo = MOTIVO, id_lote = ultimoLoteId(db) } = {}) =>
  llamar(anularMultasImportadas, { body: { id_lote, ids_multas: ids, motivo } });

const ultimaImportacion = async () => {
  const res = await llamar(getUltimoLoteMultas, { body: {} });
  assert.equal(res.status, true, res.message);
  return res.data;
};

// --- Helpers contables ---
const movimientos = (tabla, nro) => tabla.filter((m) => Number(m.NroAsiento) === Number(nro));
const totales = (filas) => filas.reduce((acc, m) => {
  acc[m.DH] = Math.round((acc[m.DH] + m.Importe) * 100) / 100;
  return acc;
}, { D: 0, H: 0 });

const assertAsientosBalanceados = (tabla, nombre) => {
  const nros = [...new Set(tabla.map((m) => m.NroAsiento))];
  assert.ok(nros.length > 0, `${nombre} no tiene asientos`);
  nros.forEach((nro) => {
    const { D, H } = totales(movimientos(tabla, nro));
    assert.equal(D, H, `${nombre} asiento ${nro} desbalanceado: D=${D} H=${H}`);
  });
};

// Saldo por cuenta (D - H) de un conjunto de movimientos
const saldoPorCuenta = (filas) => filas.reduce((acc, m) => {
  const signo = m.DH === "D" ? 1 : -1;
  acc[m.Cuenta] = Math.round(((acc[m.Cuenta] || 0) + signo * m.Importe) * 100) / 100;
  return acc;
}, {});

const assertSaldoCero = (filas, mensaje) => {
  Object.entries(saldoPorCuenta(filas)).forEach(([cuenta, saldo]) => {
    assert.equal(saldo, 0, `${mensaje}: la cuenta ${cuenta} queda con saldo ${saldo}`);
  });
};

// Contra-asiento generado para un asiento original (en c_movimientos)
const contraAsientoDe = (db, nroOriginal) =>
  db.c_movimientos.filter((m) => m.Concepto === `Anulación de asiento ${nroOriginal}`);

const firmaMovimientos = (filas) =>
  filas.map((m) => `${m.Cuenta}|${m.DH}|${m.Importe}`).sort();

describe("Circuito completo de multas masivas (5 vehículos)", () => {
  let db;

  beforeEach(() => {
    db = instalarBaseMultas(FIXTURES);
  });

  afterEach(() => mock.restoreAll());

  describe("1. Importación", () => {
    it("preprocesa el Excel: asigna el cliente del contrato y no incluye el vehículo vendido", async () => {
      const pre = await preprocesar(FILAS_EXCEL);

      assert.equal(pre.status, true);
      assert.equal(pre.filas.length, FILAS_EXCEL.length);
      assert.equal(pre.filas.filter((f) => f.incluir).length, MULTAS_IMPUTABLES);

      const vendido = pre.filas.find((f) => f.dominio === "AC999ZZ");
      assert.equal(vendido.incluir, false);
      assert.match(vendido.advertencia, /No se encontró un contrato de alquiler activo/);

      const conContrato = pre.filas.filter((f) => f.incluir);
      assert.deepEqual(
        conContrato.map((f) => [f.dominio, f.id_cliente]),
        [["AH645XB", 576], ["AE123CD", 577], ["AF456GH", 578], ["AG789JK", 579], ["AD321LM", 580], ["AH645XB", 576]],
      );
    });

    it("confirma: crea la multa, su deuda en costos_ingresos y la vincula con su asiento", async () => {
      const { conf } = await importar();

      assert.equal(conf.guardados.length, MULTAS_IMPUTABLES);
      assert.equal(conf.errores.length, 0);
      assert.equal(db.multas.length, MULTAS_IMPUTABLES);
      assert.equal(db.costos_ingresos.length, MULTAS_IMPUTABLES);

      db.multas.forEach((multa) => {
        const ci = db.costos_ingresos.find((c) => c.id === multa.id_costo_ingreso);
        assert.ok(ci, `multa ${multa.id} sin id_costo_ingreso`);
        assert.equal(multa.se_proceso, 1);
        assert.equal(multa.nro_asiento, ci.nro_asiento, "multas.nro_asiento debe ser el asiento de la deuda");
        assert.equal(ci.id_concepto, 36);
        assert.equal(ci.id_cliente, multa.id_cliente);
        assert.equal(ci.id_vehiculo, multa.id_vehiculo);
        assert.equal(ci.importe_total, multa.importe);
        assert.equal(ci.anulado, 0);
        assert.equal(ci.id_factura_pa6, null);
        assert.equal(ci.fecha, `${getTodayDate()} 00:00:00`);
        assert.equal(ci.observacion, `Dominio: ${multa.dominio} - MULTA - Acta: ${multa.acta_nro} - Motivo: ${multa.motivo_infraccion}`);
      });
    });

    it("genera en c_movimientos y c2_movimientos el asiento correcto de cada multa", async () => {
      await importar();

      db.costos_ingresos.forEach((ci) => {
        const principal = movimientos(db.c_movimientos, ci.nro_asiento);
        assert.deepEqual(firmaMovimientos(principal), [
          `${CUENTA_DEUDORES}|D|${ci.importe_total}`,
          `${CUENTA_MULTAS}|H|${ci.importe_total}`,
        ].sort(), `asiento ${ci.nro_asiento} incorrecto`);

        const nroSecundario = principal[0].AsientoSecundario;
        assert.ok(nroSecundario, "c_movimientos debe apuntar a su asiento secundario");
        assert.ok(principal.every((m) => m.AsientoSecundario === nroSecundario));

        const secundario = movimientos(db.c2_movimientos, nroSecundario);
        assert.deepEqual(firmaMovimientos(secundario), [
          `${CUENTA_DEUDORES}|D|${ci.importe_total}`,
          `${CUENTA_MULTAS_SECUNDARIA}|H|${ci.importe_total}`,
        ].sort(), `asiento secundario ${nroSecundario} incorrecto`);

        [...principal, ...secundario].forEach((m) => {
          assert.ok(m.Concepto.startsWith(ci.observacion), "el concepto del asiento debe incluir la observación de la deuda");
          assert.equal(m.Fecha, ci.fecha);
        });
      });
    });

    it("no hay asientos desbalanceados ni movimientos de pago (la multa es solo deuda)", async () => {
      await importar();

      assertAsientosBalanceados(db.c_movimientos, "c_movimientos");
      assertAsientosBalanceados(db.c2_movimientos, "c2_movimientos");
      assert.equal(db.c_movimientos.length, MULTAS_IMPUTABLES * 2);
      assert.equal(db.c2_movimientos.length, MULTAS_IMPUTABLES * 2);
      assert.ok(db.transacciones.every((tx) => tx.estado === "commit"));
    });

    it("rechaza en el preprocesamiento las multas ya procesadas", async () => {
      await importar();
      const pre = await preprocesar(FILAS_EXCEL);

      const duplicadas = pre.filas.filter((f) => f.duplicada);
      assert.equal(duplicadas.length, MULTAS_IMPUTABLES);
      assert.ok(duplicadas.every((f) => !f.incluir && /ya fue procesada anteriormente/.test(f.advertencia)));
    });
  });

  describe("2. Última importación", () => {
    it("muestra la importación con su deuda, asiento y estado anulable", async () => {
      await importar();
      const { lote, multas } = await ultimaImportacion();

      assert.equal(lote.id, ultimoLoteId(db));
      assert.equal(multas.length, MULTAS_IMPUTABLES);
      multas.forEach((m) => {
        const ci = db.costos_ingresos.find((c) => c.id === m.id_costo_ingreso);
        assert.equal(m.estado, "anulable");
        assert.equal(m.nro_asiento, ci.nro_asiento);
        assert.ok(m.nombre_cliente);
      });
    });

    it("sin importaciones no muestra nada", async () => {
      const { lote, multas } = await ultimaImportacion();
      assert.equal(lote, null);
      assert.deepEqual(multas, []);
    });
  });

  describe("3. Anulación masiva", () => {
    it("valida que haya multas seleccionadas y motivo", async () => {
      assert.equal((await anularMasivo(db, [])).status, false);
      assert.equal((await anularMasivo(db, [1], { motivo: "   " })).status, false);
    });

    it("anula todo el lote: contra-asiento invertido en c y c2 con las mismas cuentas e importes", async () => {
      await importar();
      const originales = db.costos_ingresos.map((ci) => ({ ...ci }));
      const res = await anularMasivo(db, db.multas.map((m) => m.id));

      assert.equal(res.status, true, res.message);
      assert.equal(res.anuladas.length, MULTAS_IMPUTABLES);
      assert.equal(res.errores.length, 0);

      originales.forEach((ci) => {
        const principalOriginal = movimientos(db.c_movimientos, ci.nro_asiento);
        const nroSecundarioOriginal = principalOriginal[0].AsientoSecundario;
        const secundarioOriginal = movimientos(db.c2_movimientos, nroSecundarioOriginal);

        const contra = contraAsientoDe(db, ci.nro_asiento);
        assert.equal(contra.length, principalOriginal.length, `asiento ${ci.nro_asiento} sin contra-asiento completo`);
        const nroContra = contra[0].NroAsiento;
        const nroContraSecundario = contra[0].AsientoSecundario;
        assert.notEqual(nroContra, ci.nro_asiento, "el contra-asiento debe tener número nuevo");

        // Mismas cuentas e importes con DH invertido
        assert.deepEqual(
          firmaMovimientos(contra),
          firmaMovimientos(principalOriginal.map((m) => ({ ...m, DH: m.DH === "D" ? "H" : "D" }))),
        );
        const contraSecundario = movimientos(db.c2_movimientos, nroContraSecundario);
        assert.deepEqual(
          firmaMovimientos(contraSecundario),
          firmaMovimientos(secundarioOriginal.map((m) => ({ ...m, DH: m.DH === "D" ? "H" : "D" }))),
        );

        // Original + contra-asiento deja cada cuenta en cero, en c y en c2
        assertSaldoCero([...principalOriginal, ...contra], `c_movimientos asiento ${ci.nro_asiento}`);
        assertSaldoCero([...secundarioOriginal, ...contraSecundario], `c2_movimientos asiento ${nroSecundarioOriginal}`);

        // Datos de cabecera del contra-asiento
        [...contra, ...contraSecundario].forEach((m) => {
          assert.equal(m.TipoComprobante, "ASD");
          assert.equal(m.NroComprobante, padWithZeros(`${nroContra}`, 13));
          assert.equal(m.Fecha, getTodayDate());
        });
        contraSecundario.forEach((m) => assert.equal(m.Concepto, `Anulación de asiento original ${ci.nro_asiento}`));
      });

      assertAsientosBalanceados(db.c_movimientos, "c_movimientos");
      assertAsientosBalanceados(db.c2_movimientos, "c2_movimientos");
      assertSaldoCero(db.c_movimientos, "c_movimientos total");
      assertSaldoCero(db.c2_movimientos, "c2_movimientos total");
    });

    it("marca la deuda anulada, registra el historial y libera la multa para reprocesar", async () => {
      await importar();
      const vinculos = db.multas.map((m) => ({ id_multa: m.id, id_costo_ingreso: m.id_costo_ingreso, nro_asiento: m.nro_asiento }));
      await anularMasivo(db, vinculos.map((v) => v.id_multa));

      vinculos.forEach(({ id_multa, id_costo_ingreso, nro_asiento }) => {
        const ci = db.costos_ingresos.find((c) => c.id === id_costo_ingreso);
        assert.equal(ci.anulado, 1);
        assert.equal(ci.fecha_anulacion, getTodayDate());

        const historial = db.historial_anulaciones.filter((h) => h.id_registro === id_costo_ingreso);
        assert.equal(historial.length, 1);
        assert.equal(historial[0].tipo, "deuda");
        assert.equal(historial[0].motivo, MOTIVO);
        assert.equal(historial[0].id_usuario, USUARIO.id);
        assert.equal(historial[0].usuario_email, USUARIO.user);
        assert.equal(historial[0].nro_asiento_anulacion, contraAsientoDe(db, nro_asiento)[0].NroAsiento);

        const multa = db.multas.find((m) => m.id === id_multa);
        assert.equal(multa.se_proceso, 0);
        assert.equal(multa.fecha_proceso, null);
        assert.equal(multa.id_costo_ingreso, id_costo_ingreso, "el vínculo queda guardado como auditoría");
        assert.equal(multa.nro_asiento, nro_asiento);
      });

      const { multas } = await ultimaImportacion();
      assert.equal(multas.length, MULTAS_IMPUTABLES, "la importación anulada se sigue mostrando");
      assert.ok(multas.every((m) => m.estado === "anulada"), "pero sin multas para anular");
    });

    it("anula solo las seleccionadas y deja intactas las demás", async () => {
      await importar();
      const [primera, segunda, ...resto] = db.multas;
      const res = await anularMasivo(db, [primera.id, segunda.id]);

      assert.equal(res.anuladas.length, 2);
      resto.forEach((m) => {
        assert.equal(m.se_proceso, 1);
        assert.equal(db.costos_ingresos.find((c) => c.id === m.id_costo_ingreso).anulado, 0);
        assert.equal(contraAsientoDe(db, m.nro_asiento).length, 0);
      });
    });

    it("encuentra el asiento aunque la multa se haya importado sin vínculo ni lote (importación anterior al cambio)", async () => {
      await importar();
      const esperados = db.multas.map((m) => ({ id: m.id, id_costo_ingreso: m.id_costo_ingreso, nro_asiento: m.nro_asiento }));
      // Así quedaron las multas importadas antes de guardar el vínculo y el lote
      db.multas.forEach((m) => { m.id_costo_ingreso = null; m.nro_asiento = null; m.id_lote = null; });
      db.multas_lotes = [];

      const { lote, multas } = await ultimaImportacion();
      assert.ok(lote, "las multas sin lote se agrupan en un lote");
      assert.equal(lote.cantidad, MULTAS_IMPUTABLES);
      assert.deepEqual(
        multas.map((m) => [m.id, m.id_costo_ingreso, m.nro_asiento, m.estado]),
        esperados.map((e) => [e.id, e.id_costo_ingreso, e.nro_asiento, "anulable"]),
      );

      const res = await anularMasivo(db, esperados.map((e) => e.id));
      assert.equal(res.anuladas.length, MULTAS_IMPUTABLES, JSON.stringify(res.errores));
      esperados.forEach((e) => {
        assert.equal(db.costos_ingresos.find((c) => c.id === e.id_costo_ingreso).anulado, 1);
        assert.equal(contraAsientoDe(db, e.nro_asiento).length, 2);
        const multa = db.multas.find((m) => m.id === e.id);
        assert.equal(multa.id_costo_ingreso, e.id_costo_ingreso, "guarda el vínculo encontrado por cruce");
        assert.equal(multa.nro_asiento, e.nro_asiento);
      });
      assertSaldoCero(db.c_movimientos, "c_movimientos total");
      assertSaldoCero(db.c2_movimientos, "c2_movimientos total");
    });

    it("si una multa falla, revierte solo esa (sin contra-asiento, deuda ni historial a medias)", async () => {
      await importar();
      const fallida = db.multas[2];
      // Asiento faltante en contabilidad -> la anulación de esa multa debe fallar
      db.c_movimientos = db.c_movimientos.filter((m) => Number(m.NroAsiento) !== Number(fallida.nro_asiento));
      const movimientosAntes = { c: db.c_movimientos.length, c2: db.c2_movimientos.length };

      const res = await anularMasivo(db, db.multas.map((m) => m.id));

      assert.equal(res.status, true);
      assert.equal(res.anuladas.length, MULTAS_IMPUTABLES - 1);
      assert.equal(res.errores.length, 1);
      assert.match(res.errores[0], new RegExp(`Multa ${fallida.id} .*No se encontró el asiento ${fallida.nro_asiento}`));

      assert.equal(fallida.se_proceso, 1);
      assert.equal(db.costos_ingresos.find((c) => c.id === fallida.id_costo_ingreso).anulado, 0);
      assert.equal(db.historial_anulaciones.filter((h) => h.id_registro === fallida.id_costo_ingreso).length, 0);
      // Cada multa anulada agrega 2 movimientos en c y 2 en c2
      assert.equal(db.c_movimientos.length, movimientosAntes.c + (MULTAS_IMPUTABLES - 1) * 2);
      assert.equal(db.c2_movimientos.length, movimientosAntes.c2 + (MULTAS_IMPUTABLES - 1) * 2);
      assertAsientosBalanceados(db.c_movimientos, "c_movimientos");
      assertAsientosBalanceados(db.c2_movimientos, "c2_movimientos");
    });

    it("no anula masivamente una multa con factura (requiere Nota de Crédito)", async () => {
      await importar();
      const conFactura = db.multas[0];
      db.costos_ingresos.find((c) => c.id === conFactura.id_costo_ingreso).id_factura_pa6 = 9001;

      const res = await anularMasivo(db, db.multas.map((m) => m.id));

      assert.equal(res.anuladas.length, MULTAS_IMPUTABLES - 1);
      assert.match(res.errores[0], /Tiene factura emitida/);
      assert.equal(conFactura.se_proceso, 1);
      assert.equal(contraAsientoDe(db, conFactura.nro_asiento).length, 0);
    });

    it("si la deuda ya se anuló desde Cuenta Corriente, solo libera la multa sin duplicar el contra-asiento", async () => {
      await importar();
      const multa = db.multas[0];
      db.costos_ingresos.find((c) => c.id === multa.id_costo_ingreso).anulado = 1;
      const movimientosAntes = db.c_movimientos.length;

      const res = await anularMasivo(db, [multa.id]);

      assert.equal(res.anuladas.length, 1);
      assert.equal(multa.se_proceso, 0);
      assert.equal(db.c_movimientos.length, movimientosAntes);
      assert.equal(db.historial_anulaciones.length, 0);
    });

    it("no anula dos veces el mismo lote", async () => {
      await importar();
      const ids = db.multas.map((m) => m.id);
      await anularMasivo(db, ids);
      const movimientosAntes = db.c_movimientos.length;

      const res = await anularMasivo(db, ids);

      assert.equal(res.status, false);
      assert.equal(res.errores.length, MULTAS_IMPUTABLES);
      assert.ok(res.errores.every((e) => /ya no figura como procesada/.test(e)));
      assert.equal(db.c_movimientos.length, movimientosAntes);
    });
  });

  describe("4. Lotes de importación", () => {
    const FILAS_PRIMER_LOTE = FILAS_EXCEL.slice(0, 3);
    const FILAS_SEGUNDO_LOTE = FILAS_EXCEL.slice(3, 6);

    it("cada confirmación crea un lote con usuario, cantidad y total", async () => {
      const { conf } = await importar();

      assert.equal(db.multas_lotes.length, 1);
      const [lote] = db.multas_lotes;
      assert.equal(conf.id_lote, lote.id);
      assert.equal(lote.usuario, USUARIO.user);
      assert.equal(lote.cantidad, MULTAS_IMPUTABLES);
      assert.equal(lote.importe_total, FILAS_EXCEL.slice(0, MULTAS_IMPUTABLES).reduce((acc, f) => acc + f.Importe, 0));
      assert.ok(db.multas.every((m) => m.id_lote === lote.id));
    });

    it("con dos importaciones, solo se muestra la última", async () => {
      await importar(FILAS_PRIMER_LOTE);
      await importar(FILAS_SEGUNDO_LOTE);

      const { lote, multas } = await ultimaImportacion();

      assert.equal(db.multas_lotes.length, 2);
      assert.equal(lote.id, ultimoLoteId(db));
      assert.deepEqual(multas.map((m) => m.acta_nro), FILAS_SEGUNDO_LOTE.map((f) => f.Acta_Nro));
    });

    it("no permite anular una importación anterior", async () => {
      await importar(FILAS_PRIMER_LOTE);
      const primerLote = ultimoLoteId(db);
      const idsPrimerLote = db.multas.map((m) => m.id);
      await importar(FILAS_SEGUNDO_LOTE);
      const movimientosAntes = db.c_movimientos.length;

      const conLoteViejo = await anularMasivo(db, idsPrimerLote, { id_lote: primerLote });
      assert.equal(conLoteViejo.status, false);
      assert.match(conLoteViejo.message, /Solo se puede anular la última importación masiva/);

      // Tampoco colando ids del lote anterior en la última importación
      const colando = await anularMasivo(db, idsPrimerLote);
      assert.equal(colando.status, false);
      assert.ok(colando.errores.every((e) => /ya no figura como procesada en esta importación/.test(e)));

      assert.equal(db.c_movimientos.length, movimientosAntes);
      assert.ok(db.multas.every((m) => m.se_proceso === 1));
      assert.ok(db.costos_ingresos.every((c) => c.anulado === 0));
    });

    it("si la confirmación no guarda ninguna multa, no deja un lote vacío", async () => {
      await importar(FILAS_PRIMER_LOTE);
      const loteVigente = ultimoLoteId(db);
      const pre = await preprocesar(FILAS_SEGUNDO_LOTE);
      const sinCliente = pre.filas.filter((f) => f.incluir).map((f) => ({ ...f, id_cliente: null }));

      const conf = await llamar(confirmarImportacionMultas, { body: { multas: sinCliente } });

      assert.equal(conf.status, false);
      assert.equal(db.multas_lotes.length, 1);
      assert.equal(ultimoLoteId(db), loteVigente);
    });

    it("agrupa por día las multas importadas antes de existir los lotes", async () => {
      await importar();
      const [ayer1, ayer2, ...hoy] = db.multas;
      db.multas.forEach((m) => { m.id_lote = null; });
      db.multas_lotes = [];
      [ayer1, ayer2].forEach((m) => { m.fecha_proceso = "2026-01-10 09:00:00"; });

      const { lote, multas } = await ultimaImportacion();

      assert.equal(db.multas_lotes.length, 2);
      assert.equal(lote.cantidad, hoy.length, "el último lote es el del día más reciente");
      assert.deepEqual(multas.map((m) => m.id), hoy.map((m) => m.id));
      assert.equal(ayer1.id_lote, ayer2.id_lote);
      assert.ok(ayer1.id_lote < lote.id);
    });
  });

  describe("5. Reimportación", () => {
    it("después de anular, el mismo lote se reimporta con fecha y hora en el motivo", async () => {
      await importar();
      await anularMasivo(db, db.multas.map((m) => m.id));

      const filasCorregidas = FILAS_EXCEL.map((f) => ({
        ...f,
        Motivo_Infraccion: `${f.Motivo_Infraccion} - ${f.Fecha_Infraccion} ${f.Hora}`,
      }));
      const { pre, conf } = await importar(filasCorregidas);

      assert.equal(pre.filas.filter((f) => f.duplicada).length, 0, "las anuladas no deben figurar como duplicadas");
      assert.equal(conf.guardados.length, MULTAS_IMPUTABLES);

      const activas = db.costos_ingresos.filter((c) => !c.anulado);
      assert.equal(activas.length, MULTAS_IMPUTABLES);
      activas.forEach((ci) => assert.match(ci.observacion, /Motivo: .* - \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/));

      // Las nuevas multas quedan vinculadas a sus nuevas deudas
      db.multas.filter((m) => m.se_proceso === 1).forEach((m) => {
        assert.ok(activas.some((ci) => ci.id === m.id_costo_ingreso && ci.nro_asiento === m.nro_asiento));
      });
      assertAsientosBalanceados(db.c_movimientos, "c_movimientos");
      assertAsientosBalanceados(db.c2_movimientos, "c2_movimientos");

      // La importación anulada queda afuera: se muestra solo la reimportada
      const { lote, multas } = await ultimaImportacion();
      assert.equal(lote.id, conf.id_lote);
      assert.ok(multas.every((m) => m.estado === "anulable"));
      assert.deepEqual(multas.map((m) => m.id_costo_ingreso).sort(), activas.map((c) => c.id).sort());
    });
  });
});

describe("Números de asiento repetidos (numerador desfasado)", () => {
  let db;

  beforeEach(() => {
    db = instalarBaseMultas(FIXTURES);
  });

  afterEach(() => mock.restoreAll());

  const anularManual = (id_costo_ingreso) =>
    llamar(anulacionDeuda, { body: { tipo: 3, id_registro: id_costo_ingreso, motivo: MOTIVO } });

  const secundarioDe = (nroAsiento) => movimientos(db.c_movimientos, nroAsiento)[0].AsientoSecundario;

  // Movimientos de otro asiento grabados con el mismo número (como en las 8 deudas de producción)
  const asientoAjeno = (importe, extra) => [
    { Fecha: "2026-10-07", Cuenta: CUENTA_DEUDORES, DH: "D", Importe: importe, Concepto: "Factura B Nº 00002-00002184 - Cliente ajeno", TipoComprobante: "FVB", NroComprobante: "0000200002184", ...extra },
    { Fecha: "2026-10-07", Cuenta: "410101", DH: "H", Importe: importe, Concepto: "Factura B Nº 00002-00002184 - Cliente ajeno", TipoComprobante: "FVB", NroComprobante: "0000200002184", ...extra },
  ];

  it("si el número secundario de la multa lo comparte otro asiento en c2, solo revierte la multa", async () => {
    await importar();
    const multa = db.multas[0];
    const sec = secundarioDe(multa.nro_asiento);
    const ajenas = asientoAjeno(385714, { NroAsiento: sec });
    db.c2_movimientos.push(...ajenas);

    const res = await anularMasivo(db, [multa.id]);

    assert.equal(res.status, true, JSON.stringify(res.errores));
    const contra = contraAsientoDe(db, multa.nro_asiento);
    const contraC2 = movimientos(db.c2_movimientos, contra[0].AsientoSecundario);
    assert.equal(contraC2.length, 2, "c2 solo debe tener las 2 filas de la multa");
    assert.deepEqual(firmaMovimientos(contraC2), [`${CUENTA_DEUDORES}|H|${multa.importe}`, `${CUENTA_MULTAS}|D|${multa.importe}`].sort());
    assert.ok(db.c2_movimientos.filter((m) => m.Concepto.includes("Cliente ajeno")).length === 2, "el asiento ajeno no se toca");
    assertAsientosBalanceados(db.c2_movimientos, "c2_movimientos");
  });

  it("si el número principal lo comparte otro asiento en c, la masiva solo revierte las filas de la multa", async () => {
    await importar();
    const multa = db.multas[0];
    db.c_movimientos.push(...asientoAjeno(18700786.52, { NroAsiento: multa.nro_asiento, Fecha: "2025-06-17", AsientoSecundario: 2659 }));

    const res = await anularMasivo(db, [multa.id]);

    assert.equal(res.status, true, JSON.stringify(res.errores));
    const contra = contraAsientoDe(db, multa.nro_asiento);
    assert.deepEqual(firmaMovimientos(contra), [`${CUENTA_DEUDORES}|H|${multa.importe}`, `${CUENTA_MULTAS}|D|${multa.importe}`].sort());
    assert.equal(movimientos(db.c2_movimientos, contra[0].AsientoSecundario).length, 2);
    assert.ok(!contra.some((m) => m.Importe === 18700786.52), "no invierte el asiento ajeno");
  });

  it("la anulación manual frena si el asiento está compartido, sin escribir nada", async () => {
    await importar();
    const multa = db.multas[0];
    db.c_movimientos.push(...asientoAjeno(18700786.52, { NroAsiento: multa.nro_asiento, Fecha: "2025-06-17", AsientoSecundario: 2659 }));
    const antes = { c: db.c_movimientos.length, c2: db.c2_movimientos.length };

    const res = await anularManual(multa.id_costo_ingreso);

    assert.equal(res.status, false);
    assert.match(res.message, new RegExp(`El asiento ${multa.nro_asiento} está compartido`));
    assert.deepEqual({ c: db.c_movimientos.length, c2: db.c2_movimientos.length }, antes);
    assert.equal(db.costos_ingresos.find((c) => c.id === multa.id_costo_ingreso).anulado, 0);
    assert.equal(multa.se_proceso, 1);
  });

  it("si el numerador principal (NUMA) entrega un número ya usado, no anula", async () => {
    await importar();
    const multa = db.multas[0];
    db.c_movimientos.push(...asientoAjeno(1000, { NroAsiento: db.nroAsiento + 1 }));
    const antes = db.c_movimientos.length;

    const masiva = await anularMasivo(db, [multa.id]);
    assert.equal(masiva.status, false);
    assert.match(masiva.errores[0], /NUMA.*ya está usado/);
    assert.equal(db.c_movimientos.length, antes);
    assert.equal(db.costos_ingresos.find((c) => c.id === multa.id_costo_ingreso).anulado, 0);
    assert.equal(multa.se_proceso, 1);
    assert.equal(db.historial_anulaciones.length, 0);
  });

  it("si el numerador secundario (NUMB) entrega un número ya usado, no anula (masiva ni manual)", async () => {
    await importar();
    const [multaMasiva, multaManual] = db.multas;

    db.c2_movimientos.push(...asientoAjeno(1000, { NroAsiento: db.nroAsientoSecundario + 1 }));
    const masiva = await anularMasivo(db, [multaMasiva.id]);
    assert.equal(masiva.status, false);
    assert.match(masiva.errores[0], /NUMB.*ya está usado/);

    db.c2_movimientos.push(...asientoAjeno(1000, { NroAsiento: db.nroAsientoSecundario + 1 }));
    const manual = await anularManual(multaManual.id_costo_ingreso);
    assert.equal(manual.status, false);
    assert.match(manual.message, /NUMB.*ya está usado/);

    assert.ok(db.costos_ingresos.every((c) => c.anulado === 0));
    assert.equal(contraAsientoDe(db, multaMasiva.nro_asiento).length + contraAsientoDe(db, multaManual.nro_asiento).length, 0);
  });

  it("pide los números del contra-asiento fuera de la transacción (para que el rollback sea real)", async () => {
    await importar();
    const desde = db.llamadasNumerador.length;

    await anularMasivo(db, db.multas.map((m) => m.id));

    const llamadas = db.llamadasNumerador.slice(desde);
    assert.equal(llamadas.length, MULTAS_IMPUTABLES * 2);
    assert.ok(llamadas.every((l) => !l.enTransaccion));
  });
});

describe("Paridad entre anulación masiva y anulación manual de Cuenta Corriente", () => {
  let db;

  beforeEach(() => {
    db = instalarBaseMultas(FIXTURES);
  });

  afterEach(() => mock.restoreAll());

  const anularManual = (id_costo_ingreso) =>
    llamar(anulacionDeuda, { body: { tipo: 3, id_registro: id_costo_ingreso, motivo: MOTIVO } });

  const resultadoAnulacion = (nroOriginal) => {
    const contra = contraAsientoDe(db, nroOriginal);
    const nroContra = contra[0].NroAsiento;
    const contraSecundario = movimientos(db.c2_movimientos, contra[0].AsientoSecundario);
    return { contra, nroContra, contraSecundario };
  };

  it("genera contra-asientos con los mismos conceptos, tipo y comprobante que la anulación manual", async () => {
    await importar();
    const [multaManual, multaMasiva] = db.multas;

    const manual = await anularManual(multaManual.id_costo_ingreso);
    assert.equal(manual.status, true, manual.message);
    const masiva = await anularMasivo(db, [multaMasiva.id]);
    assert.equal(masiva.status, true, masiva.message);

    const m = resultadoAnulacion(multaManual.nro_asiento);
    const x = resultadoAnulacion(multaMasiva.nro_asiento);

    // c_movimientos: mismo concepto y formato
    assert.deepEqual(
      m.contra.map((r) => [r.Concepto.replace(multaManual.nro_asiento, "#"), r.TipoComprobante]),
      x.contra.map((r) => [r.Concepto.replace(multaMasiva.nro_asiento, "#"), r.TipoComprobante]),
    );
    assert.equal(m.contra[0].Concepto, `Anulación de asiento ${multaManual.nro_asiento}`);
    assert.equal(x.contra[0].Concepto, `Anulación de asiento ${multaMasiva.nro_asiento}`);
    assert.equal(m.contra[0].NroComprobante, padWithZeros(`${m.nroContra}`, 13));
    assert.equal(x.contra[0].NroComprobante, padWithZeros(`${x.nroContra}`, 13));
    assert.ok(m.contra[0].AsientoSecundario && x.contra[0].AsientoSecundario);

    // c_movimientos: mismas cuentas, DH e importes (las dos multas son de distinto importe, se compara la estructura)
    const estructura = (filas) => filas.map((r) => `${r.Cuenta}|${r.DH}`).sort();
    assert.deepEqual(estructura(m.contra), estructura(x.contra));

    // c2_movimientos: mismo concepto y formato
    assert.deepEqual(
      m.contraSecundario.map((r) => [r.Concepto.replace(multaManual.nro_asiento, "#"), r.TipoComprobante, r.NroComprobante.length]),
      x.contraSecundario.map((r) => [r.Concepto.replace(multaMasiva.nro_asiento, "#"), r.TipoComprobante, r.NroComprobante.length]),
    );
    assert.equal(x.contraSecundario[0].Concepto, `Anulación de asiento original ${multaMasiva.nro_asiento}`);

    // Mismo efecto sobre deuda, historial y multa
    [multaManual, multaMasiva].forEach((multa) => {
      assert.equal(db.costos_ingresos.find((c) => c.id === multa.id_costo_ingreso).anulado, 1);
      const historial = db.historial_anulaciones.find((h) => h.id_registro === multa.id_costo_ingreso);
      assert.equal(historial.tipo, "deuda");
      assert.equal(historial.motivo, MOTIVO);
      assert.equal(multa.se_proceso, 0, "la anulación manual también debe liberar la multa");
    });
    assert.equal(
      db.historial_anulaciones.find((h) => h.id_registro === multaManual.id_costo_ingreso).nro_asiento_anulacion,
      m.nroContra,
    );
  });

  it("la anulación manual libera la multa aunque se haya importado sin vínculo", async () => {
    await importar();
    const multa = db.multas[3];
    const id_costo_ingreso = multa.id_costo_ingreso;
    db.multas.forEach((m) => { m.id_costo_ingreso = null; m.nro_asiento = null; });

    const res = await anularManual(id_costo_ingreso);

    assert.equal(res.status, true, res.message);
    assert.equal(multa.se_proceso, 0);
    assert.equal(multa.id_costo_ingreso, id_costo_ingreso);
    assert.equal(db.multas.filter((m) => m.se_proceso === 0).length, 1, "solo debe liberar la multa de esa deuda");
  });

  it("generan exactamente el mismo contra-asiento en c y en c2", async () => {
    await importar();
    const [multaManual, multaMasiva] = db.multas;
    await anularManual(multaManual.id_costo_ingreso);
    await anularMasivo(db, [multaMasiva.id]);

    const m = resultadoAnulacion(multaManual.nro_asiento);
    const x = resultadoAnulacion(multaMasiva.nro_asiento);
    const estructura = (filas) => filas.map((r) => `${r.Cuenta}|${r.DH}|${r.TipoComprobante}`).sort();
    assert.deepEqual(estructura(m.contraSecundario), estructura(x.contraSecundario));
    // En las dos, c2 es la copia invertida de las filas de la deuda en c
    [m, x].forEach(({ contra, contraSecundario }) => {
      assert.deepEqual(firmaMovimientos(contraSecundario), firmaMovimientos(contra));
    });
  });
});
