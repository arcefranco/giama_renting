import { mock } from "node:test";
import { giama_renting, pa7_giama_renting } from "../../../helpers/connection.js";
import { getTodayDate } from "../../../helpers/getTodayDate.js";

/**
 * Base en memoria para el circuito de multas (giama_renting + pa7_giama_renting).
 * Reemplaza `query` y `transaction` de ambas conexiones: los controladores reales corren
 * completos y lo que escriben queda en tablas inspeccionables. Las transacciones soportan
 * rollback (deshacen lo que escribieron), igual que en MySQL.
 *
 * Solo contempla las queries del circuito de multas: cualquier SQL nuevo hace fallar el
 * test con "SQL no contemplado", para que el mock no oculte cambios en las queries.
 */

const normalizar = (sql) => sql.replace(/\s+/g, " ").trim();
const soloFecha = (valor) => (valor == null ? null : String(valor).slice(0, 10));
const mismoValor = (a, b) => (a == null && b == null) || (a != null && b != null && Number(a) === Number(b));

export const COLUMNAS_MULTAS = [
  "id", "dominio", "fecha_infraccion", "hora", "motivo_infraccion", "importe", "acta_nro",
  "id_vehiculo", "id_cliente", "cuit_cliente", "usuario", "usuario_alta", "fecha_alta",
  "se_proceso", "fecha_proceso", "created_at", "id_costo_ingreso", "nro_asiento", "id_lote",
];

export const instalarBaseMultas = ({ vehiculos, clientes, contratos, conceptos, parametros }) => {
  const db = {
    vehiculos: structuredClone(vehiculos),
    clientes: structuredClone(clientes),
    contratos_alquiler: structuredClone(contratos),
    conceptos_costos: structuredClone(conceptos),
    parametros: structuredClone(parametros),
    multas: [],
    multas_lotes: [],
    costos_ingresos: [],
    historial_anulaciones: [],
    c_movimientos: [],
    c2_movimientos: [],
    nroAsiento: 5000,
    nroAsientoSecundario: 9000,
    transacciones: [],
    llamadasNumerador: [],
  };

  const siguienteId = (tabla, primero = 1) => (tabla.length ? Math.max(...tabla.map((r) => r.id)) + 1 : primero);

  const registrarDeshacer = (options, deshacer) => {
    if (options?.transaction) options.transaction.deshacer.push(deshacer);
  };

  const insertar = (tabla, fila, options) => {
    tabla.push(fila);
    registrarDeshacer(options, () => tabla.splice(tabla.indexOf(fila), 1));
    return fila;
  };

  const actualizar = (fila, cambios, options) => {
    const anterior = Object.fromEntries(Object.keys(cambios).map((k) => [k, fila[k]]));
    Object.assign(fila, cambios);
    registrarDeshacer(options, () => Object.assign(fila, anterior));
  };

  const crearTransaccion = (base) => {
    const tx = {
      base,
      deshacer: [],
      estado: "abierta",
      async commit() {
        if (tx.estado !== "abierta") throw new Error(`commit sobre transacción ${tx.estado}`);
        tx.estado = "commit";
      },
      async rollback() {
        if (tx.estado !== "abierta") throw new Error(`rollback sobre transacción ${tx.estado}`);
        tx.deshacer.reverse().forEach((fn) => fn());
        tx.estado = "rollback";
      },
    };
    db.transacciones.push(tx);
    return tx;
  };

  const nombreCliente = (c) => c?.razon_social || [c?.nombre, c?.apellido].filter(Boolean).join(" ");

  const queryGiama = async (sqlCrudo, options = {}) => {
    const sql = normalizar(sqlCrudo);
    const r = options.replacements ?? {};

    if (sql.startsWith("CREATE TABLE IF NOT EXISTS multas")) return [];
    if (sql === "SHOW COLUMNS FROM multas") return COLUMNAS_MULTAS.map((Field) => ({ Field }));
    if (sql.startsWith("ALTER TABLE multas")) return [];
    if (sql.startsWith("CREATE TABLE IF NOT EXISTS multas_lotes")) return [];

    // --- lotes de importación ---
    if (sql.includes("FROM multas WHERE id_lote IS NULL AND se_proceso = 1 AND fecha_proceso IS NOT NULL GROUP BY DATE(fecha_proceso)")) {
      const porDia = new Map();
      db.multas
        .filter((m) => m.id_lote == null && m.se_proceso === 1 && m.fecha_proceso)
        .forEach((m) => {
          const fecha = soloFecha(m.fecha_proceso);
          const dia = porDia.get(fecha) ?? { fecha, fecha_alta: m.fecha_proceso, usuario: m.usuario, cantidad: 0, importe_total: 0 };
          dia.cantidad += 1;
          dia.importe_total += Number(m.importe);
          if (m.fecha_proceso < dia.fecha_alta) dia.fecha_alta = m.fecha_proceso;
          porDia.set(fecha, dia);
        });
      return [...porDia.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
    }
    if (sql.startsWith("INSERT INTO multas_lotes")) {
      const esNuevaImportacion = sql.includes("VALUES (NOW(), :usuario, 0, 0)");
      const fila = insertar(db.multas_lotes, {
        id: siguienteId(db.multas_lotes),
        fecha_alta: esNuevaImportacion ? `${getTodayDate()} 10:00:00` : r.fecha_alta,
        usuario: r.usuario,
        cantidad: esNuevaImportacion ? 0 : r.cantidad,
        importe_total: esNuevaImportacion ? 0 : r.importe_total,
      }, options);
      return [fila.id, 1];
    }
    if (sql.startsWith("UPDATE multas SET id_lote = :id_lote WHERE id_lote IS NULL AND se_proceso = 1 AND DATE(fecha_proceso) = :fecha")) {
      const filas = db.multas.filter((m) => m.id_lote == null && m.se_proceso === 1 && soloFecha(m.fecha_proceso) === r.fecha);
      filas.forEach((m) => actualizar(m, { id_lote: r.id_lote }, options));
      return [undefined, filas.length];
    }
    if (sql.startsWith("UPDATE multas_lotes SET cantidad = :cantidad, importe_total = :importe_total WHERE id = :id_lote")) {
      const lote = db.multas_lotes.find((l) => l.id === r.id_lote);
      if (lote) actualizar(lote, { cantidad: r.cantidad, importe_total: Number(r.importe_total) }, options);
      return [undefined, lote ? 1 : 0];
    }
    if (sql.startsWith("DELETE FROM multas_lotes WHERE id = :id_lote")) {
      db.multas_lotes = db.multas_lotes.filter((l) => l.id !== r.id_lote);
      return undefined;
    }
    if (sql.startsWith("SELECT id, fecha_alta, usuario, cantidad, importe_total FROM multas_lotes ORDER BY id DESC LIMIT 1")) {
      return [...db.multas_lotes].sort((a, b) => b.id - a.id).slice(0, 1).map((l) => ({ ...l }));
    }

    // --- preprocesarMultas ---
    if (sql.startsWith("SELECT id, nro_documento, nombre, apellido, razon_social FROM clientes ORDER BY")) {
      return db.clientes.map(({ id, nro_documento, nombre, apellido, razon_social }) => ({ id, nro_documento, nombre, apellido, razon_social }));
    }
    if (sql.startsWith("SELECT ID FROM vehiculos WHERE UPPER(TRIM(Dominio)) = :dominio")) {
      const v = db.vehiculos.find((x) => String(x.dominio).trim().toUpperCase() === r.dominio);
      return v ? [{ ID: v.id }] : [];
    }
    if (sql.startsWith("SELECT id, acta_nro, fecha_infraccion, hora, se_proceso, fecha_proceso FROM multas")) {
      return db.multas
        .filter((m) => m.se_proceso === 1 && (
          (r.acta !== "" && m.acta_nro === r.acta) ||
          (m.dominio === r.dominio && m.fecha_infraccion === r.fecha_solo_date && m.hora === r.hora)
        ))
        .slice(0, 1);
    }
    if (sql.includes("FROM contratos_alquiler ca JOIN clientes c ON ca.id_cliente = c.id")) {
      const fecha = soloFecha(r.fecha_infraccion);
      const contrato = db.contratos_alquiler.find((ca) =>
        ca.id_vehiculo === r.id_vehiculo && ca.fecha_desde <= fecha && (!ca.fecha_hasta || ca.fecha_hasta >= fecha));
      return contrato ? [db.clientes.find((c) => c.id === contrato.id_cliente)] : [];
    }

    // --- confirmarImportacionMultas / registrarIngresoIndividual ---
    if (sql.startsWith("INSERT INTO multas")) {
      const fila = insertar(db.multas, {
        id: siguienteId(db.multas),
        dominio: r.dominio,
        fecha_infraccion: r.fecha_infraccion,
        hora: r.hora,
        motivo_infraccion: r.motivo_infraccion,
        importe: Number(r.importe),
        acta_nro: r.acta_nro,
        id_vehiculo: r.id_vehiculo,
        id_cliente: r.id_cliente,
        cuit_cliente: r.cuit_cliente,
        usuario: r.usuario,
        se_proceso: 1,
        fecha_proceso: `${getTodayDate()} 10:00:00`,
        id_costo_ingreso: null,
        nro_asiento: null,
        id_lote: r.id_lote,
      }, options);
      return [fila.id, 1];
    }
    if (sql.startsWith("SELECT nro_documento, nombre, apellido, razon_social, no_es_chofer FROM clientes WHERE id = ?")) {
      return db.clientes.filter((c) => c.id === r[0]);
    }
    if (sql.startsWith("SELECT dominio, dominio_provisorio FROM vehiculos WHERE id = ?")) {
      return db.vehiculos.filter((v) => v.id === r[0]).map((v) => ({ dominio: v.dominio, dominio_provisorio: null }));
    }
    if (sql.startsWith("SELECT nombre, cuenta_contable, cuenta_secundaria, genera_factura FROM conceptos_costos")) {
      return db.conceptos_costos.filter((c) => c.id === r.id_concepto);
    }
    if (sql.startsWith("SELECT valor_str FROM parametros WHERE codigo = ?")) {
      return db.parametros.filter((p) => p.codigo === r[0]);
    }
    if (sql.startsWith("INSERT INTO costos_ingresos")) {
      const [id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva, importe_otros_impuestos,
        importe_total, observacion, nro_asiento, id_forma_cobro, id_cliente, nro_recibo, id_factura_pa6] = r;
      const fila = insertar(db.costos_ingresos, {
        id: siguienteId(db.costos_ingresos, 101),
        id_vehiculo, fecha, id_concepto, comprobante, importe_neto: Number(importe_neto), importe_iva,
        importe_otros_impuestos, importe_total: Number(importe_total), observacion, nro_asiento, id_forma_cobro,
        id_cliente, nro_recibo, id_factura_pa6, anulado: 0, fecha_anulacion: null,
      }, options);
      return [fila.id, 1];
    }
    if (sql.startsWith("UPDATE multas SET id_costo_ingreso = :id_costo_ingreso, nro_asiento = :nro_asiento WHERE id = :id_multa")) {
      const m = db.multas.find((x) => x.id === r.id_multa);
      if (m) actualizar(m, { id_costo_ingreso: r.id_costo_ingreso, nro_asiento: r.nro_asiento }, options);
      return [undefined, m ? 1 : 0];
    }

    // --- getMultasProcesadas / anularMultasImportadas / resolverCostosIngresosMultas ---
    if (sql.includes("FROM multas m LEFT JOIN clientes c ON c.id = m.id_cliente WHERE m.id_lote = :id_lote")) {
      return db.multas
        .filter((m) => m.id_lote === r.id_lote)
        .sort((a, b) => a.id - b.id)
        .map((m) => ({ ...m, nombre_cliente: nombreCliente(db.clientes.find((c) => c.id === m.id_cliente)) }));
    }
    if (sql.startsWith("SELECT id, dominio, acta_nro, motivo_infraccion, importe, id_vehiculo, id_cliente, fecha_proceso, se_proceso, id_costo_ingreso FROM multas WHERE id IN (:ids) AND id_lote = :id_lote AND se_proceso = 1")) {
      return db.multas.filter((m) => r.ids.includes(m.id) && m.id_lote === r.id_lote && m.se_proceso === 1).sort((a, b) => a.id - b.id).map((m) => ({ ...m }));
    }
    if (sql.startsWith("SELECT id, nro_asiento, anulado, id_factura_pa6, observacion, fecha FROM costos_ingresos WHERE id IN (:ids)")) {
      return db.costos_ingresos.filter((c) => r.ids.includes(c.id)).map(({ id, nro_asiento, anulado, id_factura_pa6, observacion, fecha }) => ({ id, nro_asiento, anulado, id_factura_pa6, observacion, fecha }));
    }
    if (sql.includes("FROM multas m JOIN costos_ingresos ci ON ci.id_concepto = :id_concepto")) {
      const vinculados = new Set(db.multas.map((m) => m.id_costo_ingreso).filter(Boolean));
      return db.multas
        .filter((m) => r.ids.includes(m.id))
        .flatMap((m) => db.costos_ingresos
          .filter((ci) => ci.id_concepto === r.id_concepto && ci.id_cliente === m.id_cliente &&
            mismoValor(ci.id_vehiculo, m.id_vehiculo) && Number(ci.importe_total) === Number(m.importe) &&
            soloFecha(ci.fecha) === soloFecha(m.fecha_proceso) && !vinculados.has(ci.id))
          .map((ci) => ({ id_multa: m.id, id: ci.id, nro_asiento: ci.nro_asiento, anulado: ci.anulado, id_factura_pa6: ci.id_factura_pa6, observacion: ci.observacion, fecha: ci.fecha })))
        .sort((a, b) => a.id_multa - b.id_multa || a.id - b.id);
    }
    if (sql.startsWith("UPDATE costos_ingresos SET anulado = 1, fecha_anulacion = :fecha WHERE id = :id AND IFNULL(anulado, 0) = 0")) {
      const ci = db.costos_ingresos.find((c) => c.id === r.id && !c.anulado);
      if (ci) actualizar(ci, { anulado: 1, fecha_anulacion: r.fecha }, options);
      return [undefined, ci ? 1 : 0];
    }
    if (sql.startsWith("INSERT INTO historial_anulaciones")) {
      const [tipo, id_registro, id_movimiento, nro_asiento_anulacion, concepto, motivo, id_usuario, usuario_email] = r;
      const fila = insertar(db.historial_anulaciones, {
        id: siguienteId(db.historial_anulaciones), tipo, id_registro, id_movimiento, nro_asiento_anulacion, concepto, motivo, id_usuario, usuario_email,
      }, options);
      return [fila.id, 1];
    }
    if (sql.startsWith("UPDATE multas SET se_proceso = 0, fecha_proceso = NULL")) {
      const [id_costo_ingreso, nro_asiento, id] = Array.isArray(r) ? r : [r.id_costo_ingreso, r.nro_asiento, r.id];
      const m = db.multas.find((x) => x.id === id);
      if (m) actualizar(m, { se_proceso: 0, fecha_proceso: null, id_costo_ingreso, nro_asiento }, options);
      return [undefined, m ? 1 : 0];
    }

    // --- anulación manual desde Cuenta Corriente (anulacionDeuda + liberarMultaDeCostoIngreso) ---
    if (sql.startsWith("SELECT nro_asiento FROM costos_ingresos WHERE id = ?")) {
      return db.costos_ingresos.filter((c) => c.id === Number(r[0])).map((c) => ({ nro_asiento: c.nro_asiento }));
    }
    if (sql.startsWith("UPDATE costos_ingresos SET anulado = 1, fecha_anulacion = ? WHERE id = ?")) {
      const ci = db.costos_ingresos.find((c) => c.id === Number(r[1]));
      if (ci) actualizar(ci, { anulado: 1, fecha_anulacion: r[0] }, options);
      return [undefined, ci ? 1 : 0];
    }
    if (sql.startsWith("SELECT id, id_concepto, nro_asiento FROM costos_ingresos WHERE id = ?")) {
      return db.costos_ingresos.filter((c) => c.id === Number(r[0])).map(({ id, id_concepto, nro_asiento }) => ({ id, id_concepto, nro_asiento }));
    }
    if (sql.startsWith("SELECT id FROM multas WHERE id_costo_ingreso = ? AND se_proceso = 1")) {
      return db.multas.filter((m) => m.id_costo_ingreso === Number(r[0]) && m.se_proceso === 1).map((m) => ({ id: m.id }));
    }
    if (sql.includes("FROM multas m JOIN costos_ingresos ci ON ci.id = :id_costo_ingreso")) {
      const ci = db.costos_ingresos.find((c) => c.id === Number(r.id_costo_ingreso));
      if (!ci) return [];
      return db.multas
        .filter((m) => m.se_proceso === 1 && m.id_costo_ingreso == null && m.id_cliente === ci.id_cliente &&
          mismoValor(m.id_vehiculo, ci.id_vehiculo) && Number(m.importe) === Number(ci.importe_total) &&
          soloFecha(m.fecha_proceso) === soloFecha(ci.fecha))
        .map((m) => ({ ...m }));
    }

    throw new Error(`[fakeDbMultas giama] SQL no contemplado: ${sql.slice(0, 180)}`);
  };

  const queryPa7 = async (sqlCrudo, options = {}) => {
    const sql = normalizar(sqlCrudo);
    const r = options.replacements ?? {};

    // El secundario primero: "net_getnumeroasiento" es prefijo de "net_getnumeroasientosecundario"
    if (sql.includes("CALL net_getnumeroasientosecundario")) {
      db.llamadasNumerador.push({ tipo: "secundario", enTransaccion: Boolean(options.transaction) });
      return [[], [], [{ nroAsiento: ++db.nroAsientoSecundario }]];
    }
    if (sql.includes("CALL net_getnumeroasiento")) {
      db.llamadasNumerador.push({ tipo: "principal", enTransaccion: Boolean(options.transaction) });
      return [[], [], [{ nroAsiento: ++db.nroAsiento }]];
    }

    // Controles previos a la anulación
    const numeroUsado = sql.match(/^SELECT 1 AS usado FROM (c2?_movimientos) WHERE NroAsiento = \? LIMIT 1$/);
    if (numeroUsado) {
      return db[numeroUsado[1]].some((m) => mismoValor(m.NroAsiento, r[0])) ? [{ usado: 1 }] : [];
    }
    if (sql.startsWith("SELECT COUNT(DISTINCT DATE(Fecha)) AS fechas, COUNT(DISTINCT IFNULL(AsientoSecundario, 0)) AS secundarios FROM c_movimientos WHERE NroAsiento = ?")) {
      const filas = db.c_movimientos.filter((m) => mismoValor(m.NroAsiento, r[0]));
      return [{
        fechas: new Set(filas.map((m) => soloFecha(m.Fecha))).size,
        secundarios: new Set(filas.map((m) => m.AsientoSecundario ?? 0)).size,
      }];
    }
    if (sql.startsWith("SELECT DH, Importe FROM c_movimientos WHERE")) {
      return filtrarFilasOrigen(db.c_movimientos, sql, r, "nro_asiento_original").map(({ DH, Importe }) => ({ DH, Importe }));
    }

    if (/^INSERT INTO c_movimientos \(.*\) VALUES/.test(sql)) {
      insertar(db.c_movimientos, {
        Fecha: r.Fecha, NroAsiento: r.NroAsiento, Cuenta: String(r.cuenta_contable), DH: r.DH, Importe: Number(r.importe),
        Concepto: r.concepto, NroComprobante: r.comprobante, AsientoSecundario: r.AsientoSecundario, TipoComprobante: r.TipoComprobante,
      }, options);
      return [undefined, 1];
    }
    if (/^INSERT INTO c2_movimientos \(.*\) VALUES/.test(sql)) {
      insertar(db.c2_movimientos, {
        Fecha: r.Fecha, NroAsiento: r.NroAsiento, Cuenta: String(r.cuenta_contable), DH: r.DH, Importe: Number(r.importe),
        Concepto: r.concepto, NroComprobante: r.comprobante, TipoComprobante: r.TipoComprobante,
      }, options);
      return [undefined, 1];
    }
    if (sql.startsWith("SELECT AsientoSecundario FROM c_movimientos WHERE NroAsiento = :nro_asiento_original LIMIT 1")) {
      return db.c_movimientos.filter((m) => mismoValor(m.NroAsiento, r.nro_asiento_original)).slice(0, 1).map((m) => ({ AsientoSecundario: m.AsientoSecundario }));
    }

    // Contra-asientos: INSERT ... SELECT invirtiendo DH (tanto el masivo como el manual de Cuenta Corriente)
    const contra = sql.match(/^INSERT INTO (c2?_movimientos) \(.*\) SELECT .* FROM (c2?_movimientos) WHERE NroAsiento = :(\w+)/);
    if (contra) {
      const [, destino, origen, parametroOrigen] = contra;
      assert(sql.includes("CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END"), "El contra-asiento debe invertir DH");
      assert(sql.includes("'ASD'"), "El contra-asiento debe ser TipoComprobante ASD");
      const textoConcepto = sql.match(/CONCAT\('([^']*)'(, :nro_asiento_original)?\)/);
      const concepto = `${textoConcepto[1]}${textoConcepto[2] ? r.nro_asiento_original : ""}`;
      const esPrincipal = destino === "c_movimientos";
      const filas = filtrarFilasOrigen(db[origen], sql, r, parametroOrigen);
      filas.forEach((m) => insertar(db[destino], {
        Fecha: r.fecha,
        NroAsiento: esPrincipal ? r.NroAsiento_nuevo : r.NroAsientoSecundario_nuevo,
        Cuenta: m.Cuenta,
        DH: m.DH === "D" ? "H" : "D",
        Importe: m.Importe,
        Concepto: concepto,
        TipoComprobante: "ASD",
        NroComprobante: r.nro_comprobante,
        ...(esPrincipal ? { AsientoSecundario: r.NroAsientoSecundario_nuevo } : {}),
      }, options));
      return [undefined, filas.length];
    }

    throw new Error(`[fakeDbMultas pa7] SQL no contemplado: ${sql.slice(0, 180)}`);
  };

  mock.method(giama_renting, "query", queryGiama);
  mock.method(pa7_giama_renting, "query", queryPa7);
  mock.method(giama_renting, "transaction", async () => crearTransaccion("giama"));
  mock.method(pa7_giama_renting, "transaction", async () => crearTransaccion("pa7"));
  // Los controladores loguean mucho por consola; se silencia para que el reporte sea legible
  mock.method(console, "log", () => {});
  mock.method(console, "error", () => {});

  return db;
};

// Filtro de las filas de origen de un contra-asiento: por número y, si la query lo pide,
// por fecha de la deuda y prefijo del concepto (anulación masiva)
function filtrarFilasOrigen(tabla, sql, r, parametroNro) {
  return tabla.filter((m) =>
    mismoValor(m.NroAsiento, r[parametroNro]) &&
    (!sql.includes("DATE(Fecha) = DATE(:fecha_deuda)") || soloFecha(m.Fecha) === soloFecha(r.fecha_deuda)) &&
    (!sql.includes("LEFT(Concepto, CHAR_LENGTH(:prefijo)) = :prefijo") || String(m.Concepto ?? "").startsWith(r.prefijo)));
}

function assert(condicion, mensaje) {
  if (!condicion) throw new Error(`[fakeDbMultas] ${mensaje}`);
}
