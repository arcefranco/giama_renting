import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";
import xlsx from "xlsx";
import { validarArchivo } from "../../helpers/validarArchivo.js";
import {
    registrarIngresoIndividual,
    registrarIngresoMasivoConsolidado
} from "./costosController.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import {
    parseMonto,
    parseFechaTelepase,
    formatFechaDDMMAAAA,
    formatFechaYYYYMMDD,
    agruparPasadasTelepases
} from "../../helpers/telepasesHelper.js";
import { insertRecibo } from "../../helpers/insertRecibo.js";
import { insertPago } from "../../helpers/insertPago.js";
import { asientoContable } from "../../helpers/asientoContable.js";
import { getNumeroAsiento, getNumeroAsientoSecundario } from "../../helpers/getNumeroAsiento.js";

export const preprocesarMultas = async (req, res) => {
    const COLUMNAS_REQUERIDAS = ["Dominio", "Fecha_Infraccion", "Hora", "Motivo_Infraccion", "Importe", "Acta_Nro"];

    try {
        if (!req.file) {
            return res.send({ status: false, message: "No se envió ningún archivo" });
        }

        const validacion = validarArchivo(req.file, ["xls", "xlsx"], [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]);

        if (!validacion.valido) {
            return res.send({ status: false, message: validacion.message });
        }

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.send({ status: false, message: "El archivo está vacío" });
        }

        const columnasArchivo = Object.keys(data[0]);
        const columnasFaltantes = COLUMNAS_REQUERIDAS.filter(col => !columnasArchivo.includes(col));

        if (columnasFaltantes.length > 0) {
            return res.send({
                status: false,
                message: `El Excel no tiene el formato correcto. Faltan las siguientes columnas: ${columnasFaltantes.join(", ")}`
            });
        }

        // Asegurar existencia de la tabla multas para la verificación
        await giama_renting.query(`
          CREATE TABLE IF NOT EXISTS multas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            dominio VARCHAR(20) NOT NULL,
            fecha_infraccion DATE NOT NULL,
            hora TIME NULL,
            motivo_infraccion TEXT NULL,
            importe DECIMAL(12, 2) NOT NULL,
            acta_nro VARCHAR(100) NULL,
            id_vehiculo INT NULL,
            id_cliente INT NOT NULL,
            cuit_cliente VARCHAR(50) NULL,
            usuario VARCHAR(100) NULL,
            usuario_alta VARCHAR(100) NULL,
            fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
            se_proceso TINYINT(1) DEFAULT 0,
            fecha_proceso DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_dominio (dominio),
            INDEX idx_acta_nro (acta_nro),
            INDEX idx_id_cliente (id_cliente),
            INDEX idx_id_vehiculo (id_vehiculo)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `, { type: QueryTypes.RAW });

        // Obtener lista completa de clientes para selección/edición en frontend
        const clientes = await giama_renting.query(
            `SELECT id, nro_documento, nombre, apellido, razon_social FROM clientes ORDER BY razon_social ASC, apellido ASC`,
            { type: QueryTypes.SELECT }
        );

        const errores = [];
        const filasPreprocesadas = [];

        for (const [index, fila] of data.entries()) {
            const numeroFilaExcel = index + 2;
            let advertencia = null;
            let yaExiste = false;
            let idVehiculo = null;
            let idCliente = null;
            let cuitCliente = '';
            let nombreCliente = 'Sin cliente asignado';
            let fechaString = fila.Fecha_Infraccion ? String(fila.Fecha_Infraccion) : '';
            let horaStr = "00:00:00";
            let fechaSql = null;
            let fechaSoloDate = null;

            try {
                // 1. Validar vehículo por Dominio (normalizando espacios y mayúsculas)
                const dominioLimpio = String(fila.Dominio || '').trim().toUpperCase();
                const [vehiculo] = await giama_renting.query(
                    `SELECT ID FROM vehiculos WHERE UPPER(TRIM(Dominio)) = :dominio LIMIT 1`,
                    {
                        replacements: { dominio: dominioLimpio },
                        type: QueryTypes.SELECT
                    }
                );

                if (!vehiculo) {
                    advertencia = "El vehículo no existe";
                } else {
                    idVehiculo = vehiculo.ID;
                }

                // 2. Parsear Fecha y Hora
                if (!fila.Fecha_Infraccion || !fila.Hora) {
                    if (!advertencia) advertencia = "La fecha o la hora de la infracción están vacías.";
                } else {
                    let rawFecha = fila.Fecha_Infraccion;

                    if (typeof rawFecha === 'number') {
                        const fechaJS = new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
                        const d = String(fechaJS.getUTCDate()).padStart(2, '0');
                        const m = String(fechaJS.getUTCMonth() + 1).padStart(2, '0');
                        const y = fechaJS.getUTCFullYear();
                        fechaString = `${d}/${m}/${y}`;
                    } else if (rawFecha instanceof Date) {
                        const d = String(rawFecha.getUTCDate()).padStart(2, '0');
                        const m = String(rawFecha.getUTCMonth() + 1).padStart(2, '0');
                        const y = rawFecha.getUTCFullYear();
                        fechaString = `${d}/${m}/${y}`;
                    } else {
                        fechaString = rawFecha.toString().trim();
                    }

                    const parts = fechaString.split("/");
                    if (parts.length !== 3) {
                        if (!advertencia) advertencia = `El formato de fecha "${fechaString}" no es válido (debe ser DD/MM/YYYY).`;
                    } else {
                        let [dia, mes, anio] = parts;
                        dia = String(dia).padStart(2, '0');
                        mes = String(mes).padStart(2, '0');
                        if (anio.length === 2) anio = `20${anio}`;
                        fechaString = `${dia}/${mes}/${anio}`;
                        fechaSoloDate = `${anio}-${mes}-${dia}`;

                        let rawHora = fila.Hora;
                        if (typeof rawHora === 'number') {
                            const decimalTime = rawHora % 1;
                            const totalSeconds = Math.round(decimalTime * 86400);
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            horaStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                        } else {
                            horaStr = rawHora.toString().trim();
                            const tParts = horaStr.split(":");
                            if (tParts.length === 2) {
                                horaStr = `${tParts[0].padStart(2, '0')}:${tParts[1].padStart(2, '0')}:00`;
                            } else if (tParts.length === 1) {
                                horaStr = `${tParts[0].padStart(2, '0')}:00:00`;
                            }
                        }

                        fechaSql = `${fechaSoloDate} ${horaStr}`;
                    }
                }

                // 3. Verificar si la multa ya fue procesada previamente (por Acta N° o Dominio + Fecha + Hora)
                const actaNroStr = String(fila.Acta_Nro || '').trim();
                if (actaNroStr || (fila.Dominio && fechaSoloDate)) {
                    const [multaExistente] = await giama_renting.query(
                        `SELECT id, acta_nro, fecha_infraccion, hora, se_proceso, fecha_proceso 
                         FROM multas 
                         WHERE ((acta_nro = :acta AND :acta != '') 
                            OR (dominio = :dominio AND fecha_infraccion = :fecha_solo_date AND hora = :hora))
                           AND se_proceso = 1
                         LIMIT 1`,
                        {
                            type: QueryTypes.SELECT,
                            replacements: {
                                acta: actaNroStr,
                                dominio: fila.Dominio || '',
                                fecha_solo_date: fechaSoloDate,
                                hora: horaStr
                            }
                        }
                    );

                    if (multaExistente) {
                        yaExiste = true;
                        const detalleDuplicado = (actaNroStr && String(multaExistente.acta_nro) === actaNroStr)
                            ? `Esta multa ya fue procesada anteriormente (Acta N° ${actaNroStr})`
                            : `Esta multa ya fue procesada anteriormente (${fechaString} ${horaStr})`;
                        if (!advertencia) {
                            advertencia = detalleDuplicado;
                        }
                    }
                }

                // 4. Buscar contrato activo si existe vehículo y fecha válida
                if (idVehiculo && fechaSql && !advertencia) {
                    const [clienteContrato] = await giama_renting.query(
                        `SELECT c.id, c.nro_documento, c.nombre, c.apellido, c.razon_social 
                         FROM contratos_alquiler ca
                         JOIN clientes c ON ca.id_cliente = c.id
                         WHERE ca.id_vehiculo = :id_vehiculo 
                           AND ca.fecha_desde <= :fecha_infraccion 
                           AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= :fecha_infraccion)
                         LIMIT 1`,
                        {
                            type: QueryTypes.SELECT,
                            replacements: {
                                id_vehiculo: idVehiculo,
                                fecha_infraccion: fechaSql
                            }
                        }
                    );

                    if (clienteContrato) {
                        idCliente = clienteContrato.id;
                        cuitCliente = clienteContrato.nro_documento || '';
                        nombreCliente = clienteContrato.razon_social || `${clienteContrato.nombre || ''} ${clienteContrato.apellido || ''}`.trim();
                    } else {
                        advertencia = "No se encontró un contrato de alquiler activo para este vehículo en la fecha u hora de la infracción.";
                    }
                }

                filasPreprocesadas.push({
                    id_temp: index + 1,
                    numero_fila_excel: numeroFilaExcel,
                    dominio: dominioLimpio || 'S/D',
                    fecha_infraccion: fechaString,
                    hora: horaStr,
                    fecha_sql: fechaSql,
                    fecha_solo_date: fechaSoloDate,
                    motivo_infraccion: fila.Motivo_Infraccion || '',
                    importe: Number(fila.Importe) || 0,
                    acta_nro: String(fila.Acta_Nro || ''),
                    id_vehiculo: idVehiculo,
                    id_cliente: idCliente,
                    cuit_cliente: cuitCliente,
                    nombre_cliente: nombreCliente,
                    advertencia: advertencia,
                    duplicada: yaExiste,
                    incluir: Boolean(idVehiculo) && !advertencia && !yaExiste
                });

            } catch (errorFila) {
                filasPreprocesadas.push({
                    id_temp: index + 1,
                    numero_fila_excel: numeroFilaExcel,
                    dominio: dominioLimpio || 'S/D',
                    fecha_infraccion: fechaString,
                    hora: horaStr,
                    fecha_sql: fechaSql,
                    fecha_solo_date: fechaSoloDate,
                    motivo_infraccion: fila.Motivo_Infraccion || '',
                    importe: Number(fila.Importe) || 0,
                    acta_nro: String(fila.Acta_Nro || ''),
                    id_vehiculo: idVehiculo,
                    id_cliente: null,
                    cuit_cliente: '',
                    nombre_cliente: 'Error inesperado',
                    advertencia: `Error al procesar fila: ${errorFila.message || errorFila}`,
                    incluir: false
                });
            }
        }

        if (filasPreprocesadas.length === 0 && errores.length > 0) {
            return res.send({
                status: false,
                message: "No se pudo procesar ninguna multa del archivo debido a errores en todas las filas.",
                errores
            });
        }

        return res.send({
            status: true,
            message: `Preprocesamiento completado. Se procesaron ${filasPreprocesadas.length} filas.${errores.length > 0 ? ` Se omitieron ${errores.length} por errores.` : ""}`,
            filas: filasPreprocesadas,
            clientes,
            errores
        });

    } catch (error) {
        console.error("Error en preprocesarMultas:", error);
        return res.send({ status: false, message: "Ocurrió un error en el servidor al preprocesar el archivo" });
    }
};

export const confirmarImportacionMultas = async (req, res) => {
    const { multas } = req.body;

    if (!multas || !Array.isArray(multas) || multas.length === 0) {
        return res.send({ status: false, message: "No se enviaron multas para confirmar" });
    }

    try {
        await giama_renting.query(`
          CREATE TABLE IF NOT EXISTS multas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            dominio VARCHAR(20) NOT NULL,
            fecha_infraccion DATE NOT NULL,
            hora TIME NULL,
            motivo_infraccion TEXT NULL,
            importe DECIMAL(12, 2) NOT NULL,
            acta_nro VARCHAR(100) NULL,
            id_vehiculo INT NULL,
            id_cliente INT NOT NULL,
            cuit_cliente VARCHAR(50) NULL,
            usuario VARCHAR(100) NULL,
            usuario_alta VARCHAR(100) NULL,
            fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_dominio (dominio),
            INDEX idx_id_cliente (id_cliente),
            INDEX idx_id_vehiculo (id_vehiculo)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `, { type: QueryTypes.RAW });

        const guardados = [];
        const errores = [];

        for (const [index, item] of multas.entries()) {
            const numeroFila = index + 1;
            const transaction = await giama_renting.transaction();
            const transaction_asientos = await pa7_giama_renting.transaction();

            try {
                if (!item.id_cliente) {
                    errores.push(`Fila ${numeroFila} (Dominio: ${item.dominio}): No se asignó ningún cliente a la multa.`);
                    await transaction.rollback();
                    await transaction_asientos.rollback();
                    continue;
                }

                const usuarioAuditoria = req.user?.user || req.user?.email || req.body?.usuario || "sistema";

                // Guardar en tabla multas marcando se_proceso = 1 y fecha_proceso = NOW()
                await giama_renting.query(
                    `INSERT INTO multas (dominio, fecha_infraccion, hora, motivo_infraccion, importe, acta_nro, id_vehiculo, id_cliente, cuit_cliente, usuario, usuario_alta, fecha_alta, se_proceso, fecha_proceso)
                     VALUES (:dominio, :fecha_infraccion, :hora, :motivo_infraccion, :importe, :acta_nro, :id_vehiculo, :id_cliente, :cuit_cliente, :usuario, :usuario_alta, NOW(), 1, NOW())`,
                    {
                        replacements: {
                            dominio: item.dominio,
                            fecha_infraccion: item.fecha_solo_date || (item.fecha_sql ? item.fecha_sql.split(" ")[0] : getTodayDate()),
                            hora: item.hora || "00:00:00",
                            motivo_infraccion: item.motivo_infraccion || "",
                            importe: item.importe,
                            acta_nro: item.acta_nro || "",
                            id_vehiculo: item.id_vehiculo || null,
                            id_cliente: item.id_cliente,
                            cuit_cliente: item.cuit_cliente || null,
                            usuario: usuarioAuditoria,
                            usuario_alta: usuarioAuditoria
                        },
                        type: QueryTypes.INSERT,
                        transaction
                    }
                );

                const ID_CONCEPTO_MULTAS = 36; // 36 = "Infracción de Tránsito"

                await registrarIngresoIndividual({
                    debe_ingreso: item.importe,
                    id_vehiculo: item.id_vehiculo,
                    fecha_deuda: `${getTodayDate()} 00:00:00`,
                    fecha_pago: null,
                    id_forma_cobro_1: null,
                    total_cobro_1: 0,
                    id_cliente: item.id_cliente,
                    observacion: `Dominio: ${item.dominio} - MULTA - Acta: ${item.acta_nro} - Motivo: ${item.motivo_infraccion}`,
                    observacion_pago: '',
                    usuario: req.user?.user || "sistema",
                    id_concepto: ID_CONCEPTO_MULTAS,
                    importe_neto: item.importe,
                    importe_iva: 0,
                    importe_total: item.importe,
                    transaction_costos_ingresos: transaction,
                    transaction_asientos: transaction_asientos
                });

                await transaction.commit();
                await transaction_asientos.commit();

                guardados.push(item);

            } catch (errFila) {
                await transaction.rollback();
                await transaction_asientos.rollback();
                errores.push(`Fila ${numeroFila} (Dominio: ${item.dominio}): Error al imputar: ${errFila.message || errFila}`);
            }
        }

        if (guardados.length === 0 && errores.length > 0) {
            return res.send({
                status: false,
                message: "No se pudo importar ninguna multa debido a errores.",
                errores
            });
        }

        return res.send({
            status: true,
            message: `Proceso completado. Se guardaron e imputaron ${guardados.length} multas correctamente.${errores.length > 0 ? ` Se omitieron ${errores.length} por errores.` : ""}`,
            guardados,
            errores
        });

    } catch (error) {
        console.error("Error en confirmarImportacionMultas:", error);
        return res.send({ status: false, message: "Ocurrió un error al procesar las multas en el servidor." });
    }
};

export const importacionesMultas = async (req, res) => {
    // Redirige al nuevo flujo de preprocesarMultas si se llama directamente
    return preprocesarMultas(req, res);
};

export const preprocesarTelepases = async (req, res) => {
    const COLUMNAS_REQUERIDAS = ["FECHA", "PATENTE", "CHOFER", "TARIFA"];
    const NOMBRE_PESTANA = "PASADAS";

    try {
        if (!req.file) {
            return res.send({ status: false, message: "No se envió ningún archivo" });
        }

        const validacion = validarArchivo(req.file, ["xls", "xlsx"], [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]);

        if (!validacion.valido) {
            return res.send({ status: false, message: validacion.message });
        }

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

        if (!workbook.SheetNames.includes(NOMBRE_PESTANA)) {
            return res.send({
                status: false,
                message: `El archivo no contiene la pestaña "${NOMBRE_PESTANA}". Pestañas encontradas: ${workbook.SheetNames.join(", ")}`
            });
        }

        const worksheet = workbook.Sheets[NOMBRE_PESTANA];
        let dataRaw = xlsx.utils.sheet_to_json(worksheet);

        if (dataRaw.length === 0) {
            return res.send({ status: false, message: `La pestaña "${NOMBRE_PESTANA}" está vacía` });
        }

        const data = dataRaw.map(row => {
            const normalizedRow = {};
            for (const key in row) {
                normalizedRow[key.trim().toUpperCase()] = row[key];
            }
            return normalizedRow;
        });

        const columnasArchivo = Object.keys(data[0]);
        const columnasFaltantes = COLUMNAS_REQUERIDAS.filter(col => !columnasArchivo.includes(col));

        if (columnasFaltantes.length > 0) {
            return res.send({
                status: false,
                message: `El Excel no tiene el formato correcto. Faltan las siguientes columnas en la pestaña ${NOMBRE_PESTANA}: ${columnasFaltantes.join(", ")}`
            });
        }

        // Asegurar existencia de la tabla telepases
        await giama_renting.query(`
          CREATE TABLE IF NOT EXISTS telepases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            dominio VARCHAR(20) NOT NULL,
            chofer VARCHAR(150) NULL,
            cantidad_pasadas INT DEFAULT 1,
            total_tarifa DECIMAL(12, 2) DEFAULT 0.00,
            total_bonificacion DECIMAL(12, 2) DEFAULT 0.00,
            importe DECIMAL(12, 2) NOT NULL,
            rango_fechas VARCHAR(100) NULL,
            autopistas TEXT NULL,
            id_vehiculo INT NULL,
            id_cliente INT NOT NULL,
            cuit_cliente VARCHAR(50) NULL,
            usuario VARCHAR(100) NULL,
            usuario_alta VARCHAR(100) NULL,
            fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
            se_proceso TINYINT(1) DEFAULT 0,
            fecha_proceso DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_dominio (dominio),
            INDEX idx_id_cliente (id_cliente),
            INDEX idx_id_vehiculo (id_vehiculo)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `, { type: QueryTypes.RAW });

        // Obtener lista completa de clientes para el selector en frontend
        const clientes = await giama_renting.query(
            `SELECT id, nro_documento, nombre, apellido, razon_social FROM clientes ORDER BY razon_social ASC, apellido ASC`,
            { type: QueryTypes.SELECT }
        );

        const pasadasValidas = [];
        const erroresLectura = [];
        const patentesSet = new Set();

        for (const [index, fila] of data.entries()) {
            const numeroFilaExcel = index + 2;
            const patente = fila.PATENTE ? String(fila.PATENTE).trim().toUpperCase() : null;

            if (!patente) {
                erroresLectura.push(`Fila ${numeroFilaExcel}: La patente está vacía.`);
                continue;
            }

            const tarifa = parseMonto(fila.TARIFA);
            const bonificacion = parseMonto(fila.BONIFICACION);
            const montoNeto = tarifa;

            if (montoNeto <= 0) {
                continue;
            }

            const dateObj = parseFechaTelepase(fila.FECHA);
            const chofer = fila.CHOFER ? String(fila.CHOFER).trim() : "S/D";
            const autopista = fila.AUTOPISTA ? String(fila.AUTOPISTA).trim() : null;

            patentesSet.add(patente);
            pasadasValidas.push({
                numeroFilaExcel,
                patente,
                tarifa,
                bonificacion,
                montoNeto,
                dateObj,
                chofer,
                autopista
            });
        }

        const patentesArray = Array.from(patentesSet);
        if (pasadasValidas.length === 0 || patentesArray.length === 0) {
            return res.send({
                status: false,
                message: "No se encontraron pasadas válidas para procesar en el archivo.",
                errores: erroresLectura
            });
        }

        // 1. Bulk query: Obtener todos los vehículos involucrados
        const vehiculos = await giama_renting.query(
            `SELECT ID, UPPER(TRIM(Dominio)) AS dominio FROM vehiculos WHERE UPPER(TRIM(Dominio)) IN (:patentes)`,
            {
                replacements: { patentes: patentesArray },
                type: QueryTypes.SELECT
            }
        );

        const vehiculosMap = new Map();
        const idsVehiculos = [];
        for (const v of vehiculos) {
            vehiculosMap.set(v.dominio, v.ID);
            idsVehiculos.push(v.ID);
        }

        // 2. Bulk query: Obtener todos los contratos de esos vehículos con fechas formateadas directamente desde MySQL
        const contratosPorVehiculo = new Map();
        if (idsVehiculos.length > 0) {
            const contratos = await giama_renting.query(
                `SELECT ca.id, ca.id_vehiculo, ca.id_cliente, 
                        DATE_FORMAT(ca.fecha_desde, '%Y-%m-%d') AS fecha_desde, 
                        DATE_FORMAT(ca.fecha_hasta, '%Y-%m-%d') AS fecha_hasta,
                        c.nro_documento, c.nombre, c.apellido, c.razon_social
                 FROM contratos_alquiler ca
                 JOIN clientes c ON ca.id_cliente = c.id
                 WHERE ca.id_vehiculo IN (:idsVehiculos)
                 ORDER BY ca.fecha_desde ASC`,
                {
                    replacements: { idsVehiculos },
                    type: QueryTypes.SELECT
                }
            );

            for (const c of contratos) {
                if (!contratosPorVehiculo.has(c.id_vehiculo)) {
                    contratosPorVehiculo.set(c.id_vehiculo, []);
                }
                contratosPorVehiculo.get(c.id_vehiculo).push(c);
            }
        }

        // 3. Bulk query: Chequeo de duplicados históricos en una sola consulta
        const telepasesExistentes = patentesArray.length > 0 ? await giama_renting.query(
            `SELECT dominio, id_cliente, rango_fechas 
             FROM telepases 
             WHERE dominio IN (:patentes) AND se_proceso = 1`,
            {
                replacements: { patentes: patentesArray },
                type: QueryTypes.SELECT
            }
        ) : [];

        // 4. Agrupación por (Patente + Cliente/Contrato según fecha de cada pasada) usando helper de dominio
        const gruposList = agruparPasadasTelepases({
            pasadasValidas,
            vehiculosMap,
            contratosPorVehiculo
        });

        const filasPreprocesadas = [];

        for (const [index, grupo] of gruposList.entries()) {
            let advertencia = grupo.advertencia;
            let yaExiste = false;

            // Verificar si este consumo ya fue procesado en la tabla telepases
            if (grupo.patente && grupo.rangoFechas && grupo.rangoFechas !== "S/D") {
                const rangoInvertido = grupo.fechas.length > 0
                    ? `${formatFechaDDMMAAAA(grupo.fechas[grupo.fechas.length - 1])} al ${formatFechaDDMMAAAA(grupo.fechas[0])}`
                    : grupo.rangoFechas;

                const existe = telepasesExistentes.find(t =>
                    t.dominio === grupo.patente &&
                    (!grupo.idCliente || t.id_cliente === grupo.idCliente) &&
                    (t.rango_fechas === grupo.rangoFechas || t.rango_fechas === rangoInvertido)
                );

                if (existe) {
                    yaExiste = true;
                    if (!advertencia) {
                        advertencia = `Este consumo de telepase ya fue procesado anteriormente para el período ${grupo.rangoFechas}.`;
                    }
                }
            }

            filasPreprocesadas.push({
                id_temp: index + 1,
                dominio: grupo.patente,
                chofer: grupo.chofer,
                cantidad_pasadas: grupo.cantidadPasadas,
                total_tarifa: parseFloat(grupo.totalTarifa.toFixed(2)),
                total_bonificacion: parseFloat(grupo.totalBonificacion.toFixed(2)),
                importe: parseFloat(grupo.totalNeto.toFixed(2)),
                rango_fechas: grupo.rangoFechas,
                autopistas: Array.from(grupo.autopistas).join(", "),
                id_vehiculo: grupo.idVehiculo,
                id_cliente: grupo.idCliente,
                cuit_cliente: grupo.cuitCliente,
                nombre_cliente: grupo.nombreCliente,
                es_empresa: grupo.esEmpresa,
                advertencia: advertencia,
                duplicada: yaExiste,
                incluir: Boolean(grupo.idVehiculo) && !advertencia && !yaExiste
            });
        }

        return res.send({
            status: true,
            message: `Preprocesamiento de telepases completado. Se procesaron ${filasPreprocesadas.length} grupos de consumos.`,
            filas: filasPreprocesadas,
            clientes,
            errores: erroresLectura
        });

    } catch (error) {
        console.error("Error en preprocesarTelepases:", error);
        return res.send({ status: false, message: `Ocurrió un error en el servidor al preprocesar los telepases: ${error.message || error}` });
    }
};

export const confirmarImportacionTelepases = async (req, res) => {
    const { telepases } = req.body;

    if (!telepases || !Array.isArray(telepases) || telepases.length === 0) {
        return res.send({ status: false, message: "No se enviaron telepases para confirmar" });
    }

    try {
        await giama_renting.query(`
          CREATE TABLE IF NOT EXISTS telepases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            dominio VARCHAR(20) NOT NULL,
            chofer VARCHAR(150) NULL,
            cantidad_pasadas INT DEFAULT 1,
            total_tarifa DECIMAL(12, 2) DEFAULT 0.00,
            total_bonificacion DECIMAL(12, 2) DEFAULT 0.00,
            importe DECIMAL(12, 2) NOT NULL,
            rango_fechas VARCHAR(100) NULL,
            autopistas TEXT NULL,
            id_vehiculo INT NULL,
            id_cliente INT NOT NULL,
            cuit_cliente VARCHAR(50) NULL,
            usuario VARCHAR(100) NULL,
            usuario_alta VARCHAR(100) NULL,
            fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
            se_proceso TINYINT(1) DEFAULT 0,
            fecha_proceso DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_dominio (dominio),
            INDEX idx_id_cliente (id_cliente),
            INDEX idx_id_vehiculo (id_vehiculo)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `, { type: QueryTypes.RAW });

        const guardados = [];
        const errores = [];
        const usuarioAuditoria = req.user?.user || req.user?.email || req.body?.usuario || "sistema";

        for (const [index, item] of telepases.entries()) {
            const numeroFila = index + 1;
            const transaction = await giama_renting.transaction();
            const transaction_asientos = await pa7_giama_renting.transaction();

            try {
                if (!item.id_cliente) {
                    errores.push(`Item ${numeroFila} (Dominio: ${item.dominio}): No se asignó ningún cliente.`);
                    await transaction.rollback();
                    await transaction_asientos.rollback();
                    continue;
                }

                // 1. Guardar en la tabla telepases marcando se_proceso = 1 y fecha_proceso = NOW()
                await giama_renting.query(
                    `INSERT INTO telepases (dominio, chofer, cantidad_pasadas, total_tarifa, total_bonificacion, importe, rango_fechas, autopistas, id_vehiculo, id_cliente, cuit_cliente, usuario, usuario_alta, fecha_alta, se_proceso, fecha_proceso)
                     VALUES (:dominio, :chofer, :cantidad_pasadas, :total_tarifa, :total_bonificacion, :importe, :rango_fechas, :autopistas, :id_vehiculo, :id_cliente, :cuit_cliente, :usuario, :usuario_alta, NOW(), 1, NOW())`,
                    {
                        replacements: {
                            dominio: item.dominio,
                            chofer: item.chofer || "S/D",
                            cantidad_pasadas: item.cantidad_pasadas || 1,
                            total_tarifa: item.total_tarifa || item.importe,
                            total_bonificacion: item.total_bonificacion || 0,
                            importe: item.importe,
                            rango_fechas: item.rango_fechas || "S/D",
                            autopistas: item.autopistas || "",
                            id_vehiculo: item.id_vehiculo || null,
                            id_cliente: item.id_cliente,
                            cuit_cliente: item.cuit_cliente || null,
                            usuario: usuarioAuditoria,
                            usuario_alta: usuarioAuditoria
                        },
                        type: QueryTypes.INSERT,
                        transaction
                    }
                );

                // 2. Registrar cargo consolidado en cuenta corriente y asientos contables
                const detallesMasivos = [{
                    patente: item.dominio,
                    id_vehiculo: item.id_vehiculo,
                    importe: parseFloat(Number(item.importe).toFixed(2)),
                    observacion: `Telepase - Dominio: ${item.dominio} - Período: ${item.rango_fechas || "S/D"}`
                }];

                await registrarIngresoMasivoConsolidado({
                    id_cliente: item.id_cliente,
                    es_empresa: Boolean(item.es_empresa),
                    detalles: detallesMasivos,
                    fecha_deuda: `${getTodayDate()} 00:00:00`,
                    usuario: usuarioAuditoria,
                    transaction_costos_ingresos: transaction,
                    transaction_asientos: transaction_asientos,
                });

                await transaction.commit();
                await transaction_asientos.commit();

                guardados.push(item);

            } catch (errFila) {
                if (!transaction.finished) await transaction.rollback();
                if (!transaction_asientos.finished) await transaction_asientos.rollback();
                errores.push(`Item ${numeroFila} (Dominio: ${item.dominio}): Error al imputar: ${errFila.message || errFila}`);
            }
        }

        if (guardados.length === 0 && errores.length > 0) {
            return res.send({
                status: false,
                message: "No se pudo importar ningún consumo de telepase debido a errores.",
                errores
            });
        }

        const montoTotalImportado = guardados.reduce((acc, g) => acc + (Number(g.importe) || 0), 0);

        return res.send({
            status: true,
            message: `Proceso completado. Se guardaron e imputaron ${guardados.length} consumos de telepase correctamente por $${montoTotalImportado.toFixed(2)}.${errores.length > 0 ? ` Se omitieron ${errores.length} por errores.` : ""}`,
            guardados,
            errores
        });

    } catch (error) {
        console.error("Error en confirmarImportacionTelepases:", error);
        return res.send({ status: false, message: "Ocurrió un error al confirmar la importación de telepases." });
    }
};

export const importacionesTelepases = async (req, res) => {
    return preprocesarTelepases(req, res);
};



function obtenerFechaMasReciente(fechas) {
    if (!fechas || fechas.length === 0) return getTodayDate();
    const fechasValidas = fechas
        .map(f => (f instanceof Date ? f : parseFechaTelepase(f)))
        .filter(d => d !== null)
        .sort((a, b) => a.getTime() - b.getTime());
    if (fechasValidas.length === 0) return getTodayDate();
    return formatFechaYYYYMMDD(fechasValidas[fechasValidas.length - 1]);
}

export const preprocesarCabify = async (req, res) => {
    try {
        if (!req.file) {
            return res.send({ status: false, message: "No se envió ningún archivo" });
        }

        const validacion = validarArchivo(req.file, ["xls", "xlsx"], [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]);

        if (!validacion.valido) {
            return res.send({ status: false, message: validacion.message });
        }

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

        if (data.length === 0) {
            return res.send({ status: false, message: "El archivo está vacío" });
        }

        // Obtener clientes para mapeo por CUIT y selector
        const clientes = await giama_renting.query(
            `SELECT id, nro_documento, nombre, apellido, razon_social FROM clientes ORDER BY razon_social ASC, apellido ASC`,
            { type: QueryTypes.SELECT }
        );
        const clientesMap = new Map();
        for (const c of clientes) {
            if (c.nro_documento) {
                const cleanDoc = String(c.nro_documento).replace(/\D/g, "");
                clientesMap.set(cleanDoc, c);
            }
        }

        // Obtener vehículos con modelos para mapeo por Patente
        const vehiculos = await giama_renting.query(
            `SELECT v.id, UPPER(TRIM(v.dominio)) AS dominio, UPPER(TRIM(v.dominio_provisorio)) AS dominio_provisorio,
                    m.nombre AS nombre_modelo
             FROM vehiculos v
             LEFT JOIN modelos m ON v.modelo = m.id`,
            { type: QueryTypes.SELECT }
        );
        const vehiculosMap = new Map();
        for (const v of vehiculos) {
            if (v.dominio) vehiculosMap.set(v.dominio, v);
            if (v.dominio_provisorio) vehiculosMap.set(v.dominio_provisorio, v);
        }

        const filasPreprocesadas = [];
        const errores = [];

        for (const [index, row] of data.entries()) {
            const numeroFilaExcel = index + 2;

            let rawConductor = "";
            let rawPatente = "";
            let rawCuit = "";
            let rawImporte = 0;

            for (const key of Object.keys(row)) {
                const kLower = key.trim().toLowerCase();
                if (kLower.includes("conductor") || kLower.includes("chofer") || kLower.includes("nombre")) {
                    rawConductor = row[key];
                } else if (kLower.includes("patente") || kLower.includes("dominio")) {
                    rawPatente = row[key];
                } else if (kLower.includes("cuit") || kLower.includes("cuil") || kLower.includes("documento")) {
                    rawCuit = row[key];
                } else if (kLower.includes("importe") || kLower.includes("descontado") || kLower.includes("total a pagar") || kLower.includes("a pagar")) {
                    rawImporte = row[key];
                }
            }

            const conductor = String(rawConductor || "").trim();
            const patenteLimpia = String(rawPatente || "").trim().toUpperCase();
            const cuitLimpio = String(rawCuit || "").replace(/\D/g, "");
            const importe = parseMonto(rawImporte);

            let errorCuit = null;
            let errorPatente = null;
            let advertencia = null;

            if (!cuitLimpio) {
                errorCuit = "El CUIT está vacío.";
            } else if (!clientesMap.has(cuitLimpio)) {
                errorCuit = `No existe chofer registrado con CUIT ${cuitLimpio}.`;
            }

            if (!patenteLimpia) {
                errorPatente = "La patente está vacía.";
            } else if (patenteLimpia.includes("DEUDA")) {
                errorPatente = `Patente con deuda en el archivo (${patenteLimpia}).`;
            } else if (!vehiculosMap.has(patenteLimpia)) {
                errorPatente = `El vehículo con patente ${patenteLimpia} no existe en el sistema.`;
            }

            const clienteEncontrado = clientesMap.get(cuitLimpio);
            const vehiculoEncontrado = vehiculosMap.get(patenteLimpia);

            const esValido = !errorCuit && !errorPatente;

            if (!esValido) {
                advertencia = [errorCuit, errorPatente].filter(Boolean).join(" | ");
                errores.push(`Fila ${numeroFilaExcel} (Conductor: ${conductor || 'S/D'}, CUIT: ${cuitLimpio || 'S/D'}, Patente: ${patenteLimpia || 'S/D'}): ${advertencia}`);
            } else if (importe <= 0) {
                advertencia = "Importe en $0,00 (sin cobro a realizar).";
            }

            filasPreprocesadas.push({
                id_temp: index + 1,
                numero_fila_excel: numeroFilaExcel,
                conductor: conductor || (clienteEncontrado ? (clienteEncontrado.razon_social || `${clienteEncontrado.nombre || ''} ${clienteEncontrado.apellido || ''}`.trim()) : "S/D"),
                cuit: cuitLimpio,
                patente: patenteLimpia,
                modelo: vehiculoEncontrado ? (vehiculoEncontrado.nombre_modelo || "S/D") : "-",
                importe: importe,
                id_cliente: clienteEncontrado ? clienteEncontrado.id : null,
                id_vehiculo: vehiculoEncontrado ? vehiculoEncontrado.id : null,
                valido: esValido,
                advertencia: advertencia,
                incluir: esValido && importe > 0
            });
        }

        return res.send({
            status: true,
            filas: filasPreprocesadas,
            clientes: clientes,
            errores: errores
        });

    } catch (error) {
        console.error("Error en preprocesarCabify:", error);
        return res.send({ status: false, message: error?.message || "Ocurrió un error al preprocesar el archivo de Cabify." });
    }
};

export const confirmarImportacionCabify = async (req, res) => {
    const { pagos, usuario } = req.body;
    const usuarioAuditoria = req.user?.user || req.user?.email || usuario || "sistema";

    if (!pagos || !Array.isArray(pagos) || pagos.length === 0) {
        return res.send({ status: false, message: "No se recibieron pagos para procesar." });
    }

    try {
        let [formaCobroCabify] = await giama_renting.query(
            `SELECT id, cuenta_contable, cuenta_secundaria FROM formas_cobro WHERE cuenta_contable = 110409 OR LOWER(nombre) LIKE '%cabify%' LIMIT 1`,
            { type: QueryTypes.SELECT }
        );

        if (!formaCobroCabify) {
            const [insertedId] = await giama_renting.query(
                `INSERT INTO formas_cobro (nombre, cuenta_contable, cuenta_secundaria) VALUES ('Cabify', 110409, 110409)`,
                { type: QueryTypes.INSERT }
            );
            formaCobroCabify = {
                id: insertedId,
                cuenta_contable: 110409,
                cuenta_secundaria: 110409
            };
        }

        const idFormaCobro = formaCobroCabify.id;
        const cuentaContableDebe = formaCobroCabify.cuenta_contable || 110409;
        const cuentaContableHaber = 110310;
        const cuentaSecundariaDebe = formaCobroCabify.cuenta_secundaria || cuentaContableDebe;
        const cuentaSecundariaHaber = 110310;

        const validPagos = [];
        const errores = [];

        for (const item of pagos) {
            const numeroFila = item.numero_fila_excel || item.id_temp;
            const importeNumber = parseFloat(Number(item.importe).toFixed(2));

            if (!item.id_cliente) {
                errores.push(`Fila ${numeroFila} (Patente: ${item.patente}, CUIT: ${item.cuit}): No tiene cliente asignado.`);
            } else if (isNaN(importeNumber) || importeNumber <= 0) {
                errores.push(`Fila ${numeroFila} (Patente: ${item.patente}, CUIT: ${item.cuit}): El importe a cobrar debe ser mayor a 0.`);
            } else {
                validPagos.push(item);
            }
        }

        if (validPagos.length === 0) {
            return res.send({
                status: false,
                message: "No se encontró ningún pago válido con cliente e importe mayor a 0 para imputar.",
                errores
            });
        }

        const count = validPagos.length;
        const fechaHoy = getTodayDate();
        const transaction = await giama_renting.transaction();
        const transaction_asientos = await pa7_giama_renting.transaction();

        try {
            // 1. Reservar bloque de asientos en pa7_giama_renting en una sola operación atómica
            const [rowA] = await pa7_giama_renting.query(
                "SELECT Valor FROM parametros WHERE Codigo = 'NUMA' FOR UPDATE",
                { type: QueryTypes.SELECT, transaction: transaction_asientos }
            );
            const [rowB] = await pa7_giama_renting.query(
                "SELECT Valor FROM parametros WHERE Codigo = 'NUMB' FOR UPDATE",
                { type: QueryTypes.SELECT, transaction: transaction_asientos }
            );

            const baseAsiento = parseInt(rowA.Valor, 10);
            const baseAsientoSecundario = parseInt(rowB.Valor, 10);

            await pa7_giama_renting.query(
                "UPDATE parametros SET Valor = Valor + :count WHERE Codigo = 'NUMA'",
                { replacements: { count }, type: QueryTypes.UPDATE, transaction: transaction_asientos }
            );
            await pa7_giama_renting.query(
                "UPDATE parametros SET Valor = Valor + :count WHERE Codigo = 'NUMB'",
                { replacements: { count }, type: QueryTypes.UPDATE, transaction: transaction_asientos }
            );

            // 2. Inserción masiva en tabla recibos (obteniendo el id del primer recibo de forma contigua)
            const recibosValues = [];
            const recibosReplacements = [];

            for (let i = 0; i < count; i++) {
                const item = validPagos[i];
                const importeNumber = parseFloat(Number(item.importe).toFixed(2));
                recibosValues.push("(?, ?, ?, ?, ?, ?, ?, ?)");
                recibosReplacements.push(
                    fechaHoy,
                    `Cobro semanal Cabify - Chofer: ${item.conductor || ''} - CUIT: ${item.cuit || ''} - Patente: ${item.patente || ''}`,
                    importeNumber,
                    item.id_cliente,
                    item.id_vehiculo || null,
                    idFormaCobro,
                    usuarioAuditoria,
                    importeNumber
                );
            }

            const [firstReciboId] = await giama_renting.query(
                `INSERT INTO recibos (fecha, detalle, importe_total, id_cliente, id_vehiculo, id_forma_cobro, usuario_alta, importe_total_1)
                 VALUES ${recibosValues.join(", ")}`,
                { replacements: recibosReplacements, type: QueryTypes.INSERT, transaction }
            );

            // 3. Inserción masiva en pagos_clientes (cuenta corriente de clientes)
            const pagosClientesValues = [];
            const pagosClientesReplacements = [];

            for (let i = 0; i < count; i++) {
                const item = validPagos[i];
                const importeNumber = parseFloat(Number(item.importe).toFixed(2));
                const nro_recibo = firstReciboId + i;
                const nro_asiento = baseAsiento + i + 1;
                const observacion = `Forma de cobro: Cabify - Observación: Cobro semanal Cabify - Patente: ${item.patente || ''}`;

                pagosClientesValues.push("(?, ?, ?, ?, ?, ?, ?, ?)");
                pagosClientesReplacements.push(
                    item.id_cliente,
                    fechaHoy,
                    usuarioAuditoria,
                    idFormaCobro,
                    importeNumber,
                    nro_recibo,
                    observacion,
                    nro_asiento
                );
            }

            await giama_renting.query(
                `INSERT INTO pagos_clientes (id_cliente, fecha, usuario_alta_registro, id_forma_cobro, importe_cobro, nro_recibo, observacion, nro_asiento)
                 VALUES ${pagosClientesValues.join(", ")}`,
                { replacements: pagosClientesReplacements, type: QueryTypes.INSERT, transaction }
            );

            // 4. Inserción masiva en tabla pagos_cabify (historial / auditoría)
            const pagosCabifyValues = [];
            const pagosCabifyReplacements = [];
            const guardados = [];

            for (let i = 0; i < count; i++) {
                const item = validPagos[i];
                const importeNumber = parseFloat(Number(item.importe).toFixed(2));
                const nro_recibo = firstReciboId + i;
                const nro_asiento = baseAsiento + i + 1;
                const nro_asiento_secundario = baseAsientoSecundario + i + 1;

                pagosCabifyValues.push("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
                pagosCabifyReplacements.push(
                    item.conductor || null,
                    item.cuit,
                    item.patente,
                    importeNumber,
                    item.id_cliente,
                    item.id_vehiculo || null,
                    nro_recibo,
                    nro_asiento,
                    nro_asiento_secundario,
                    usuarioAuditoria
                );

                guardados.push({
                    ...item,
                    nro_recibo,
                    nro_asiento,
                    nro_asiento_secundario
                });
            }

            await giama_renting.query(
                `INSERT INTO pagos_cabify (conductor, cuit, patente, importe, id_cliente, id_vehiculo, nro_recibo, nro_asiento, nro_asiento_secundario, usuario, fecha_proceso)
                 VALUES ${pagosCabifyValues.join(", ")}`,
                { replacements: pagosCabifyReplacements, type: QueryTypes.INSERT, transaction }
            );

            // 5. Inserción masiva en c_movimientos (Asientos contables principales)
            const cMovValues = [];
            const cMovReplacements = [];

            for (let i = 0; i < count; i++) {
                const item = validPagos[i];
                const importeNumber = parseFloat(Number(item.importe).toFixed(2));
                const nro_recibo = firstReciboId + i;
                const nro_asiento = baseAsiento + i + 1;
                const nro_asiento_secundario = baseAsientoSecundario + i + 1;
                const concepto = `RECIBO: ${nro_recibo} Chofer: ${item.conductor || ''} CUIT: ${item.cuit || ''} Patente: ${item.patente || ''} - Cobro Cabify`.slice(0, 200);

                // Asiento Debe: Cobros Cabify c/o choferes 110409
                cMovValues.push("(?, ?, ?, 'D', ?, ?, ?, ?)");
                cMovReplacements.push(
                    fechaHoy,
                    nro_asiento,
                    cuentaContableDebe,
                    importeNumber,
                    concepto,
                    nro_recibo,
                    nro_asiento_secundario
                );

                // Asiento Haber: Cta Cte Clientes 110310
                cMovValues.push("(?, ?, ?, 'H', ?, ?, ?, ?)");
                cMovReplacements.push(
                    fechaHoy,
                    nro_asiento,
                    cuentaContableHaber,
                    importeNumber,
                    concepto,
                    nro_recibo,
                    nro_asiento_secundario
                );
            }

            await pa7_giama_renting.query(
                `INSERT INTO c_movimientos (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, AsientoSecundario)
                 VALUES ${cMovValues.join(", ")}`,
                { replacements: cMovReplacements, type: QueryTypes.INSERT, transaction: transaction_asientos }
            );

            // 6. Inserción masiva en c2_movimientos (Asientos contables secundarios)
            const c2MovValues = [];
            const c2MovReplacements = [];

            for (let i = 0; i < count; i++) {
                const item = validPagos[i];
                const importeNumber = parseFloat(Number(item.importe).toFixed(2));
                const nro_recibo = firstReciboId + i;
                const nro_asiento_secundario = baseAsientoSecundario + i + 1;
                const concepto = `RECIBO: ${nro_recibo} Chofer: ${item.conductor || ''} CUIT: ${item.cuit || ''} Patente: ${item.patente || ''} - Cobro Cabify`.slice(0, 200);

                // Debe
                c2MovValues.push("(?, ?, ?, 'D', ?, ?, ?)");
                c2MovReplacements.push(
                    fechaHoy,
                    nro_asiento_secundario,
                    cuentaSecundariaDebe,
                    importeNumber,
                    concepto,
                    nro_recibo
                );

                // Haber
                c2MovValues.push("(?, ?, ?, 'H', ?, ?, ?)");
                c2MovReplacements.push(
                    fechaHoy,
                    nro_asiento_secundario,
                    cuentaSecundariaHaber,
                    importeNumber,
                    concepto,
                    nro_recibo
                );
            }

            await pa7_giama_renting.query(
                `INSERT INTO c2_movimientos (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante)
                 VALUES ${c2MovValues.join(", ")}`,
                { replacements: c2MovReplacements, type: QueryTypes.INSERT, transaction: transaction_asientos }
            );

            // Commit unificado de ambas transacciones
            await transaction.commit();
            await transaction_asientos.commit();

            const montoTotalImportado = guardados.reduce((acc, g) => acc + (Number(g.importe) || 0), 0);

            return res.send({
                status: true,
                message: `Proceso completado. Se imputaron ${guardados.length} pagos de Cabify correctamente por $${montoTotalImportado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}.${errores.length > 0 ? ` Se omitieron ${errores.length} por errores.` : ""}`,
                guardados,
                errores
            });

        } catch (errBatch) {
            if (!transaction.finished) await transaction.rollback();
            if (!transaction_asientos.finished) await transaction_asientos.rollback();
            console.error("Error al procesar lote de pagos Cabify:", errBatch);
            return res.send({
                status: false,
                message: `Error al procesar los pagos en la base de datos: ${errBatch.message || errBatch}`,
                errores
            });
        }

    } catch (error) {
        console.error("Error general en confirmarImportacionCabify:", error);
        return res.send({ status: false, message: "Ocurrió un error general al confirmar la importación de Cabify." });
    }
};

export const getPagosCabify = async (req, res) => {
    try {
        const pagos = await giama_renting.query(
            `SELECT pc.id, 
                    COALESCE(pc.conductor, c.razon_social, CONCAT(COALESCE(c.nombre, ''), ' ', COALESCE(c.apellido, ''))) AS conductor,
                    pc.cuit, 
                    pc.patente, 
                    pc.importe, 
                    pc.id_cliente, 
                    pc.id_vehiculo, 
                    pc.nro_recibo, 
                    pc.nro_asiento, 
                    pc.nro_asiento_secundario, 
                    pc.usuario, 
                    DATE_FORMAT(pc.fecha_proceso, '%Y-%m-%d %H:%i:%s') AS fecha_proceso,
                    c.razon_social, 
                    c.nombre, 
                    c.apellido
             FROM pagos_cabify pc
             LEFT JOIN clientes c ON pc.id_cliente = c.id
             ORDER BY pc.id DESC
             LIMIT 1000`,
            { type: QueryTypes.SELECT }
        );

        return res.send(pagos);
    } catch (error) {
        console.error("Error al obtener pagos Cabify:", error);
        return res.status(500).send({ message: "Error al obtener historial de pagos Cabify." });
    }
};



