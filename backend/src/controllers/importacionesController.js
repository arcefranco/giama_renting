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


