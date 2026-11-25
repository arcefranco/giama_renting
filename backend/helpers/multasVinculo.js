import { QueryTypes } from "sequelize";
import { giama_renting } from "./connection.js";

export const ID_CONCEPTO_MULTAS = 36; // 36 = "Infracción de Tránsito"

let estructuraVerificada = false;

/**
 * Asegura la estructura de vínculos de `multas`:
 * - columnas id_costo_ingreso / nro_asiento (deuda y asiento contable de cada multa)
 * - tabla `multas_lotes` y columna id_lote (cada importación masiva es un lote)
 * Las multas procesadas sin lote (importadas antes de existir los lotes) se agrupan en un lote
 * por día de proceso. Eso corre siempre; la verificación de columnas/tabla, una vez por proceso.
 */
export const asegurarEstructuraMultas = async () => {
  if (!estructuraVerificada) {
    await asegurarColumnasYTablaLotes();
    estructuraVerificada = true;
  }
  await agruparMultasSinLote();
};

const asegurarColumnasYTablaLotes = async () => {
  const columnas = await giama_renting.query("SHOW COLUMNS FROM multas", {
    type: QueryTypes.SELECT,
  });
  const nombres = columnas.map((c) => c.Field);
  if (!nombres.includes("id_costo_ingreso")) {
    await giama_renting.query(
      "ALTER TABLE multas ADD COLUMN id_costo_ingreso INT NULL, ADD INDEX idx_id_costo_ingreso (id_costo_ingreso)",
      { type: QueryTypes.RAW },
    );
  }
  if (!nombres.includes("nro_asiento")) {
    await giama_renting.query(
      "ALTER TABLE multas ADD COLUMN nro_asiento INT NULL",
      { type: QueryTypes.RAW },
    );
  }
  if (!nombres.includes("id_lote")) {
    await giama_renting.query(
      "ALTER TABLE multas ADD COLUMN id_lote INT NULL, ADD INDEX idx_id_lote (id_lote)",
      { type: QueryTypes.RAW },
    );
  }
  await giama_renting.query(
    `CREATE TABLE IF NOT EXISTS multas_lotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
      usuario VARCHAR(100) NULL,
      cantidad INT NOT NULL DEFAULT 0,
      importe_total DECIMAL(14, 2) NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    { type: QueryTypes.RAW },
  );
};

const agruparMultasSinLote = async () => {
  const diasSinLote = await giama_renting.query(
    `SELECT DATE(fecha_proceso) AS fecha, MIN(fecha_proceso) AS fecha_alta, MIN(usuario) AS usuario,
            COUNT(*) AS cantidad, SUM(importe) AS importe_total
     FROM multas
     WHERE id_lote IS NULL AND se_proceso = 1 AND fecha_proceso IS NOT NULL
     GROUP BY DATE(fecha_proceso)
     ORDER BY fecha`,
    { type: QueryTypes.SELECT },
  );
  for (const dia of diasSinLote) {
    const [id_lote] = await giama_renting.query(
      `INSERT INTO multas_lotes (fecha_alta, usuario, cantidad, importe_total)
       VALUES (:fecha_alta, :usuario, :cantidad, :importe_total)`,
      { type: QueryTypes.INSERT, replacements: dia },
    );
    await giama_renting.query(
      `UPDATE multas SET id_lote = :id_lote
       WHERE id_lote IS NULL AND se_proceso = 1 AND DATE(fecha_proceso) = :fecha`,
      { type: QueryTypes.UPDATE, replacements: { id_lote, fecha: dia.fecha } },
    );
  }
};

export const getUltimoLote = async () => {
  const [lote] = await giama_renting.query(
    `SELECT id, fecha_alta, usuario, cantidad, importe_total
     FROM multas_lotes ORDER BY id DESC LIMIT 1`,
    { type: QueryTypes.SELECT },
  );
  return lote ?? null;
};

// Las multas importadas antes del vínculo explícito solo se pueden reconocer por la
// observación que armó la importación: "Dominio: X - MULTA - Acta: Y - Motivo: Z".
// Si acta o motivo venían vacíos en el Excel, el template pudo dejar "undefined"/"null".
const variantesValor = (valor) => (valor ? [String(valor)] : ["", "undefined", "null"]);

const coincideObservacion = (observacion, multa) => {
  if (!observacion) return false;
  return variantesValor(multa.acta_nro).some((acta) => {
    const prefijo = `Dominio: ${multa.dominio} - MULTA - Acta: ${acta} - Motivo: `;
    return variantesValor(multa.motivo_infraccion).some((motivo) => {
      const completa = `${prefijo}${motivo}`;
      // Contempla que la columna observacion haya truncado el motivo
      return (
        observacion === completa ||
        (observacion.startsWith(prefijo) && completa.startsWith(observacion))
      );
    });
  });
};

/**
 * Resuelve el registro de `costos_ingresos` de cada multa.
 * Usa `multas.id_costo_ingreso` cuando existe; si no, cruza por cliente, vehículo,
 * importe, fecha de proceso y observación, asignando 1 a 1 por orden de id
 * (la importación inserta multa y deuda de a pares, en el mismo orden).
 *
 * @param {Array<object>} multas - Filas de `multas` (id, dominio, acta_nro, motivo_infraccion, id_costo_ingreso)
 * @returns {Promise<Map<number, object>>} id_multa -> { id, nro_asiento, anulado, id_factura_pa6, observacion, fecha }
 */
export const resolverCostosIngresosMultas = async (multas, transaction = null) => {
  const resultado = new Map();
  if (!multas.length) return resultado;

  const conVinculo = multas.filter((m) => m.id_costo_ingreso);
  if (conVinculo.length) {
    const costos = await giama_renting.query(
      `SELECT id, nro_asiento, anulado, id_factura_pa6, observacion, fecha
       FROM costos_ingresos WHERE id IN (:ids)`,
      {
        type: QueryTypes.SELECT,
        replacements: { ids: conVinculo.map((m) => m.id_costo_ingreso) },
        ...(transaction ? { transaction } : {}),
      },
    );
    const costosPorId = new Map(costos.map((c) => [c.id, c]));
    conVinculo.forEach((m) => {
      const costo = costosPorId.get(m.id_costo_ingreso);
      if (costo) resultado.set(m.id, costo);
    });
  }

  const sinVinculo = multas.filter((m) => !m.id_costo_ingreso);
  if (!sinVinculo.length) return resultado;

  const candidatos = await giama_renting.query(
    `SELECT m.id AS id_multa, ci.id, ci.nro_asiento, ci.anulado, ci.id_factura_pa6, ci.observacion, ci.fecha
     FROM multas m
     JOIN costos_ingresos ci
       ON ci.id_concepto = :id_concepto
      AND ci.id_cliente = m.id_cliente
      AND ci.id_vehiculo <=> m.id_vehiculo
      AND ci.importe_total = m.importe
      AND DATE(ci.fecha) = DATE(m.fecha_proceso)
     WHERE m.id IN (:ids)
       AND NOT EXISTS (SELECT 1 FROM multas m2 WHERE m2.id_costo_ingreso = ci.id)
     ORDER BY m.id, ci.id`,
    {
      type: QueryTypes.SELECT,
      replacements: {
        id_concepto: ID_CONCEPTO_MULTAS,
        ids: sinVinculo.map((m) => m.id),
      },
      ...(transaction ? { transaction } : {}),
    },
  );

  const usados = new Set();
  [...sinVinculo]
    .sort((a, b) => a.id - b.id)
    .forEach((multa) => {
      const costo = candidatos.find(
        (c) =>
          c.id_multa === multa.id &&
          !usados.has(c.id) &&
          coincideObservacion(c.observacion, multa),
      );
      if (costo) {
        usados.add(costo.id);
        const { id_multa, ...datosCosto } = costo;
        resultado.set(multa.id, datosCosto);
      }
    });

  return resultado;
};

/**
 * Habilita el reprocesamiento de la multa asociada a una deuda anulada desde Cuenta Corriente.
 * Si la deuda no es de una multa, no hace nada.
 * Requiere haber llamado antes a `asegurarEstructuraMultas()` FUERA de la transacción
 * (un ALTER TABLE esperaría el lock de la transacción abierta).
 */
export const liberarMultaDeCostoIngreso = async (id_costo_ingreso, transaction = null) => {
  const opciones = transaction ? { transaction } : {};

  const [costo] = await giama_renting.query(
    "SELECT id, id_concepto, nro_asiento FROM costos_ingresos WHERE id = ?",
    { type: QueryTypes.SELECT, replacements: [id_costo_ingreso], ...opciones },
  );
  if (!costo || Number(costo.id_concepto) !== ID_CONCEPTO_MULTAS) return;

  let [multa] = await giama_renting.query(
    "SELECT id FROM multas WHERE id_costo_ingreso = ? AND se_proceso = 1",
    { type: QueryTypes.SELECT, replacements: [id_costo_ingreso], ...opciones },
  );

  if (!multa) {
    // Multas importadas antes del vínculo explícito: se busca por cruce
    const posibles = await giama_renting.query(
      `SELECT m.id, m.dominio, m.acta_nro, m.motivo_infraccion, m.id_costo_ingreso
       FROM multas m
       JOIN costos_ingresos ci ON ci.id = :id_costo_ingreso
       WHERE m.se_proceso = 1 AND m.id_costo_ingreso IS NULL
         AND m.id_cliente = ci.id_cliente
         AND m.id_vehiculo <=> ci.id_vehiculo
         AND m.importe = ci.importe_total
         AND DATE(m.fecha_proceso) = DATE(ci.fecha)`,
      { type: QueryTypes.SELECT, replacements: { id_costo_ingreso }, ...opciones },
    );
    const vinculos = await resolverCostosIngresosMultas(posibles, transaction);
    multa = posibles.find((m) => vinculos.get(m.id)?.id === Number(id_costo_ingreso));
  }
  if (!multa) return;

  await giama_renting.query(
    `UPDATE multas
     SET se_proceso = 0, fecha_proceso = NULL, id_costo_ingreso = ?, nro_asiento = ?
     WHERE id = ?`,
    {
      type: QueryTypes.UPDATE,
      replacements: [costo.id, costo.nro_asiento, multa.id],
      ...opciones,
    },
  );
};
