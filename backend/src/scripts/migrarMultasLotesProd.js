import { Sequelize, QueryTypes } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

/**
 * Migración de multas para la anulación masiva (producción).
 * Hace lo mismo que `asegurarEstructuraMultas()` (helpers/multasVinculo.js), pero en un momento controlado:
 *   1. Agrega a `multas` las columnas id_costo_ingreso, nro_asiento e id_lote.
 *   2. Crea la tabla `multas_lotes`.
 *   3. Agrupa en un lote por día de proceso las multas procesadas que todavía no tienen lote.
 *
 * Uso:
 *   node src/scripts/migrarMultasLotesProd.js             -> prueba en seco: solo muestra lo que haría
 *   node src/scripts/migrarMultasLotesProd.js --ejecutar  -> aplica los cambios
 */

const EJECUTAR = process.argv.includes("--ejecutar");

async function migrar() {
  const host = process.env.DB_HOST_prod || process.env.DB_HOST;
  const dbName = process.env.DB_NAME_PROD || "giama_renting";

  console.log(`Conectando a base de datos en: ${host} (BD: ${dbName})...`);
  console.log(EJECUTAR ? "MODO EJECUCIÓN: se aplicarán los cambios.\n" : "PRUEBA EN SECO: no se modifica nada.\n");

  const prodDb = new Sequelize(dbName, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host,
    dialect: "mysql",
    timezone: "-03:00",
    logging: false,
    pool: { max: 1, min: 1 },
  });

  try {
    await prodDb.authenticate();
    if (!EJECUTAR) {
      // Una sola conexión en modo lectura: cualquier escritura por error falla
      await prodDb.query("SET SESSION TRANSACTION READ ONLY");
    }

    // 1. Columnas de multas
    const columnas = (await prodDb.query("SHOW COLUMNS FROM multas", { type: QueryTypes.SELECT })).map((c) => c.Field);
    const alterCols = [
      ["id_costo_ingreso", "ALTER TABLE multas ADD COLUMN id_costo_ingreso INT NULL, ADD INDEX idx_id_costo_ingreso (id_costo_ingreso)"],
      ["nro_asiento", "ALTER TABLE multas ADD COLUMN nro_asiento INT NULL"],
      ["id_lote", "ALTER TABLE multas ADD COLUMN id_lote INT NULL, ADD INDEX idx_id_lote (id_lote)"],
    ];
    for (const [columna, sql] of alterCols) {
      if (columnas.includes(columna)) {
        console.log(`[OK] La columna multas.${columna} ya existe.`);
      } else if (EJECUTAR) {
        await prodDb.query(sql, { type: QueryTypes.RAW });
        console.log(`[CREADA] multas.${columna}`);
      } else {
        console.log(`[PENDIENTE] Se agregará multas.${columna}`);
      }
    }

    // 2. Tabla de lotes
    const [tablaLotes] = await prodDb.query("SHOW TABLES LIKE 'multas_lotes'", { type: QueryTypes.SELECT });
    if (tablaLotes) {
      console.log("[OK] La tabla multas_lotes ya existe.");
    } else if (EJECUTAR) {
      await prodDb.query(
        `CREATE TABLE IF NOT EXISTS multas_lotes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
          usuario VARCHAR(100) NULL,
          cantidad INT NOT NULL DEFAULT 0,
          importe_total DECIMAL(14, 2) NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        { type: QueryTypes.RAW },
      );
      console.log("[CREADA] Tabla multas_lotes");
    } else {
      console.log("[PENDIENTE] Se creará la tabla multas_lotes");
    }

    // 3. Lotes para las multas ya procesadas (un lote por día de proceso)
    // En la prueba en seco la columna id_lote puede no existir todavía: entonces ninguna multa tiene lote
    const filtroSinLote = EJECUTAR || columnas.includes("id_lote") ? "id_lote IS NULL AND" : "";
    const dias = await prodDb.query(
      `SELECT DATE_FORMAT(fecha_proceso, '%Y-%m-%d') AS fecha, MIN(fecha_proceso) AS fecha_alta, MAX(fecha_proceso) AS ultima,
              MIN(usuario) AS usuario, COUNT(*) AS cantidad, SUM(importe) AS importe_total
       FROM multas
       WHERE ${filtroSinLote} se_proceso = 1 AND fecha_proceso IS NOT NULL
       GROUP BY DATE(fecha_proceso)
       ORDER BY fecha`,
      { type: QueryTypes.SELECT },
    );

    console.log(`\nLotes a crear para multas ya procesadas: ${dias.length}`);
    console.table(dias.map((d) => ({
      dia: d.fecha,
      desde: d.fecha_alta,
      hasta: d.ultima,
      usuario: d.usuario,
      multas: Number(d.cantidad),
      importe: Number(d.importe_total),
    })));
    if (dias.length) {
      console.log(`El último lote (el que verá el modal de anulación) será el del ${dias[dias.length - 1].fecha}.`);
    }

    if (EJECUTAR) {
      for (const dia of dias) {
        const transaction = await prodDb.transaction();
        try {
          const [id_lote] = await prodDb.query(
            `INSERT INTO multas_lotes (fecha_alta, usuario, cantidad, importe_total)
             VALUES (:fecha_alta, :usuario, :cantidad, :importe_total)`,
            { type: QueryTypes.INSERT, replacements: dia, transaction },
          );
          const [, actualizadas] = await prodDb.query(
            `UPDATE multas SET id_lote = :id_lote
             WHERE id_lote IS NULL AND se_proceso = 1 AND DATE(fecha_proceso) = :fecha`,
            { type: QueryTypes.UPDATE, replacements: { id_lote, fecha: dia.fecha }, transaction },
          );
          if (Number(actualizadas) !== Number(dia.cantidad)) {
            throw new Error(`se esperaban ${dia.cantidad} multas y se actualizaron ${actualizadas}`);
          }
          await transaction.commit();
          console.log(`[OK] Lote ${id_lote} -> ${actualizadas} multas del ${dia.fecha}`);
        } catch (error) {
          await transaction.rollback();
          throw new Error(`Error al crear el lote del ${dia.fecha}: ${error.message}`);
        }
      }

      const [sinLote] = await prodDb.query(
        "SELECT COUNT(*) AS n FROM multas WHERE id_lote IS NULL AND se_proceso = 1",
        { type: QueryTypes.SELECT },
      );
      console.log(`\nVerificación: multas procesadas sin lote = ${sinLote.n}`);
    } else {
      console.log("\nPara aplicar los cambios: node src/scripts/migrarMultasLotesProd.js --ejecutar");
    }
  } catch (error) {
    console.error("Error en la migración:", error.message);
    process.exitCode = 1;
  } finally {
    await prodDb.close();
  }
}

migrar();
