import { QueryTypes } from "sequelize";
import { pa7_giama_renting } from "./connection.js";
import { getNumeroAsiento, getNumeroAsientoSecundario } from "./getNumeroAsiento.js";
import { getTodayDate } from "./getTodayDate.js";
import { padWithZeros } from "./padWithZeros.js";

/**
 * Pide los números del contra-asiento y verifica que estén libres.
 * Se llama FUERA de la transacción: los procedimientos del numerador hacen su propio
 * START TRANSACTION/COMMIT, que cerraría implícitamente una transacción abierta.
 * Si el numerador está desfasado (NUMA/NUMB por debajo de lo ya usado), frena la anulación
 * en lugar de mezclar el contra-asiento con otro asiento existente.
 */
export const obtenerNumerosContraAsiento = async () => {
  const NroAsiento_nuevo = await getNumeroAsiento();
  const NroAsientoSecundario_nuevo = await getNumeroAsientoSecundario();

  const [usadoC] = await pa7_giama_renting.query(
    "SELECT 1 AS usado FROM c_movimientos WHERE NroAsiento = ? LIMIT 1",
    { type: QueryTypes.SELECT, replacements: [NroAsiento_nuevo] },
  );
  if (usadoC) {
    throw new Error(
      `El numerador de asientos (NUMA) entregó el número ${NroAsiento_nuevo}, que ya está usado en c_movimientos. Hay que actualizar el numerador antes de anular.`,
    );
  }
  const [usadoC2] = await pa7_giama_renting.query(
    "SELECT 1 AS usado FROM c2_movimientos WHERE NroAsiento = ? LIMIT 1",
    { type: QueryTypes.SELECT, replacements: [NroAsientoSecundario_nuevo] },
  );
  if (usadoC2) {
    throw new Error(
      `El numerador de asientos secundarios (NUMB) entregó el número ${NroAsientoSecundario_nuevo}, que ya está usado en c2_movimientos. Hay que actualizar el numerador antes de anular.`,
    );
  }

  return { NroAsiento_nuevo, NroAsientoSecundario_nuevo };
};

/**
 * Frena si el número de asiento lo comparten movimientos de más de un asiento
 * (distinta fecha o distinto asiento secundario): invertirlo completo revertiría asientos ajenos.
 */
export const verificarAsientoNoCompartido = async (nro_asiento) => {
  const [uso] = await pa7_giama_renting.query(
    `SELECT COUNT(DISTINCT DATE(Fecha)) AS fechas, COUNT(DISTINCT IFNULL(AsientoSecundario, 0)) AS secundarios
     FROM c_movimientos WHERE NroAsiento = ?`,
    { type: QueryTypes.SELECT, replacements: [nro_asiento] },
  );
  if (Number(uso?.fechas) > 1 || Number(uso?.secundarios) > 1) {
    throw new Error(
      `El asiento ${nro_asiento} está compartido con otros movimientos en contabilidad; no se puede anular automáticamente.`,
    );
  }
};

// Filas de la deuda dentro de su asiento: mismo número, misma fecha y concepto armado con su observación
const FILTRO_FILAS_DEUDA = `NroAsiento = :nro_asiento_original
  AND DATE(Fecha) = DATE(:fecha_deuda)
  AND LEFT(Concepto, CHAR_LENGTH(:prefijo)) = :prefijo`;

// Largo del prefijo de la observación usado para reconocer el concepto (incluye dominio y acta)
const LARGO_PREFIJO = 50;

/**
 * Contra-asiento de una deuda de costos_ingresos: invierte D/H SOLO de las filas de esa deuda
 * en c_movimientos y graba la misma copia en c2_movimientos con el número secundario nuevo
 * (las cuentas secundarias son las mismas que las principales). Mismos conceptos, tipo y
 * comprobante que la anulación manual de Cuenta Corriente.
 */
export const contraAsientoDeuda = async ({
  nro_asiento_original,
  fecha_deuda,
  observacion,
  NroAsiento_nuevo,
  NroAsientoSecundario_nuevo,
  transaction,
}) => {
  const prefijo = String(observacion || "").slice(0, LARGO_PREFIJO);
  if (!prefijo) {
    throw new Error("La deuda no tiene observación para identificar su asiento");
  }
  const filtro = { nro_asiento_original, fecha_deuda, prefijo };

  const filas = await pa7_giama_renting.query(
    `SELECT DH, Importe FROM c_movimientos WHERE ${FILTRO_FILAS_DEUDA}`,
    { type: QueryTypes.SELECT, replacements: filtro, transaction },
  );
  if (!filas.length) {
    throw new Error(`No se encontró el asiento ${nro_asiento_original} de esta deuda en contabilidad`);
  }
  const total = (dh) => Math.round(filas.filter((f) => f.DH === dh).reduce((acc, f) => acc + Number(f.Importe), 0) * 100);
  if (total("D") !== total("H")) {
    throw new Error(`El asiento ${nro_asiento_original} de esta deuda está desbalanceado; no se anula`);
  }

  const replacements = {
    ...filtro,
    fecha: getTodayDate(),
    NroAsiento_nuevo,
    NroAsientoSecundario_nuevo,
    nro_comprobante: padWithZeros(`${NroAsiento_nuevo}`, 13),
  };

  await pa7_giama_renting.query(
    `INSERT INTO c_movimientos (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, TipoComprobante, NroComprobante, AsientoSecundario)
     SELECT :fecha, :NroAsiento_nuevo, Cuenta,
            CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END,
            Importe, CONCAT('Anulación de asiento ', :nro_asiento_original), 'ASD', :nro_comprobante, :NroAsientoSecundario_nuevo
     FROM c_movimientos
     WHERE ${FILTRO_FILAS_DEUDA}`,
    { type: QueryTypes.INSERT, replacements, transaction },
  );

  await pa7_giama_renting.query(
    `INSERT INTO c2_movimientos (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, TipoComprobante, NroComprobante)
     SELECT :fecha, :NroAsientoSecundario_nuevo, Cuenta,
            CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END,
            Importe, CONCAT('Anulación de asiento original ', :nro_asiento_original), 'ASD', :nro_comprobante
     FROM c_movimientos
     WHERE ${FILTRO_FILAS_DEUDA}`,
    { type: QueryTypes.INSERT, replacements, transaction },
  );

  return NroAsiento_nuevo;
};
