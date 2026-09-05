import { giama_renting } from "../../helpers/connection.js";

async function run() {
  try {
    console.log("Creando tabla 'historial_anulaciones'...");

    await giama_renting.query(`
      CREATE TABLE IF NOT EXISTS historial_anulaciones (
        id                    INT AUTO_INCREMENT PRIMARY KEY,
        tipo                  VARCHAR(50)   NOT NULL COMMENT 'factura | recibo | deuda',
        id_registro           INT           NOT NULL COMMENT 'id del registro anulado en su tabla origen',
        id_movimiento         INT           NULL     COMMENT 'id del comprobante en pa7 (factura id / nro_recibo)',
        nro_asiento_anulacion INT           NULL     COMMENT 'NroAsiento del contra-asiento generado',
        motivo                TEXT          NOT NULL,
        id_usuario            INT           NOT NULL,
        usuario_email         VARCHAR(255)  NOT NULL,
        fecha                 DATETIME      NOT NULL DEFAULT NOW(),
        INDEX idx_tipo_registro (tipo, id_registro),
        INDEX idx_usuario (id_usuario),
        INDEX idx_fecha (fecha)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("Tabla 'historial_anulaciones' creada correctamente.");
  } catch (error) {
    console.error("Error al crear la tabla:", error);
  } finally {
    process.exit(0);
  }
}

run();
