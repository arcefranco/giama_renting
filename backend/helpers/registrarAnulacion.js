import { QueryTypes } from "sequelize";
import { giama_renting } from "./connection.js";

/**
 * Registra una anulación en el historial de auditoría.
 *
 * @param {object} params
 * @param {string} params.tipo              - Tipo de comprobante: 'factura' | 'recibo' | 'deuda'
 * @param {number} params.id_registro       - ID del registro anulado en su tabla de origen
 * @param {number|null} params.id_movimiento        - ID del comprobante en pa7 (opcional)
 * @param {number|null} params.nro_asiento_anulacion - NroAsiento del contra-asiento (opcional)
 * @param {string} params.motivo            - Motivo de la anulación (obligatorio)
 * @param {object} params.req               - Objeto request de Express (para obtener req.user)
 * @param {object|null} params.transaction  - Transacción Sequelize activa (opcional)
 */
export const registrarAnulacion = async ({
  tipo,
  id_registro,
  id_movimiento = null,
  nro_asiento_anulacion = null,
  motivo,
  req,
  transaction = null,
}) => {
  const id_usuario = req.user?.id;
  const usuario_email = req.user?.user;

  await giama_renting.query(
    `INSERT INTO historial_anulaciones
       (tipo, id_registro, id_movimiento, nro_asiento_anulacion, motivo, id_usuario, usuario_email)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    {
      type: QueryTypes.INSERT,
      replacements: [
        tipo,
        id_registro,
        id_movimiento,
        nro_asiento_anulacion,
        motivo,
        id_usuario,
        usuario_email,
      ],
      ...(transaction ? { transaction } : {}),
    }
  );
};
