import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";
import xlsx from "xlsx";
import { validarArchivo } from "../../helpers/validarArchivo.js";
import { registrarIngresoIndividual } from "./costosController.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";

export const importacionesMultas = async (req, res) => {
    const COLUMNAS_REQUERIDAS = ["Dominio", "Fecha_Infraccion", "Hora", "Motivo_Infraccion", "Importe", "Acta_Nro"];

    try {
        if (!req.file) {
            return res.send({ status: false, message: "No se envío ningún archivo" });
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

        const errores = [];
        const guardados = [];

        for (const [index, fila] of data.entries()) {
            const numeroFilaExcel = index + 2;
            const transaction = await giama_renting.transaction();
            const transaction_asientos = await pa7_giama_renting.transaction();

            try {
                const [vehiculo] = await giama_renting.query(
                    `SELECT ID FROM vehiculos WHERE Dominio = :dominio LIMIT 1`,
                    {
                        replacements: { dominio: fila.Dominio },
                        type: QueryTypes.SELECT,
                        transaction
                    }
                );

                if (!vehiculo) {
                    errores.push(`Fila ${numeroFilaExcel} (Dominio: ${fila.Dominio || "S/D"}, Acta: ${fila.Acta_Nro || "S/D"}): El dominio "${fila.Dominio}" no existe en el sistema.`);
                    await transaction.rollback();
                    await transaction_asientos.rollback();
                    continue;
                }

                if (!fila.Fecha_Infraccion || !fila.Hora) {
                    errores.push(`Fila ${numeroFilaExcel} (Dominio: ${fila.Dominio || "S/D"}, Acta: ${fila.Acta_Nro || "S/D"}): La fecha o la hora de la infracción están vacías.`);
                    await transaction.rollback();
                    await transaction_asientos.rollback();
                    continue;
                }

                let rawFecha = fila.Fecha_Infraccion;
                let fechaString = "";

                // Si Excel mandó la fecha como número de serie (ej: 46194 para 21/06/2026)
                if (typeof rawFecha === 'number') {
                    // 25569 es la diferencia en días entre 01/01/1900 (Excel) y 01/01/1970 (Unix)
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
                    errores.push(`Fila ${numeroFilaExcel} (Dominio: ${fila.Dominio || "S/D"}, Acta: ${fila.Acta_Nro || "S/D"}): El formato de fecha "${rawFecha}" no es válido. Debe ser DD/MM/YYYY.`);
                    await transaction.rollback();
                    await transaction_asientos.rollback();
                    continue;
                }
                const [dia, mes, anio] = parts;

                let rawHora = fila.Hora;
                let horaStr = "00:00:00";
                if (typeof rawHora === 'number') {
                    // Excel time (fracción de un día)
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

                const fechaSql = `${anio}-${mes}-${dia} ${horaStr}`;

                const [cliente] = await giama_renting.query(
                    `SELECT id_cliente 
                     FROM contratos_alquiler 
                     WHERE id_vehiculo = :id_vehiculo 
                       AND fecha_desde <= :fecha_infraccion 
                       AND (fecha_hasta IS NULL OR fecha_hasta >= :fecha_infraccion)`,
                    {
                        type: QueryTypes.SELECT,
                        replacements: {
                            id_vehiculo: vehiculo.ID,
                            fecha_infraccion: fechaSql
                        },
                        transaction
                    }
                );

                if (!cliente) {
                    errores.push(`Fila ${numeroFilaExcel} (Dominio: ${fila.Dominio || "S/D"}, Acta: ${fila.Acta_Nro || "S/D"}): El vehículo no estaba alquilado en la fecha y hora indicadas (${fila.Fecha_Infraccion} ${fila.Hora}).`);
                    await transaction.rollback();
                    await transaction_asientos.rollback();
                    continue;
                }

                const ID_CONCEPTO_MULTAS = 36; // 36 = "Infracción de Tránsito"

                await registrarIngresoIndividual({
                    debe_ingreso: fila.Importe,
                    id_vehiculo: vehiculo.ID,
                    fecha_deuda: `${getTodayDate()} 00:00:00`,
                    fecha_pago: null,
                    id_forma_cobro_1: null,
                    total_cobro_1: 0,
                    id_cliente: cliente.id_cliente,
                    observacion: `Dominio: ${fila.Dominio} - MULTA - Acta: ${fila.Acta_Nro} - Motivo: ${fila.Motivo_Infraccion}`,
                    observacion_pago: '',
                    usuario: req.user ? req.user.email : 'sistema',
                    id_concepto: ID_CONCEPTO_MULTAS,
                    importe_neto: fila.Importe,
                    importe_iva: 0,
                    importe_total: fila.Importe,
                    transaction_costos_ingresos: transaction,
                    transaction_asientos: transaction_asientos
                });

                await transaction.commit();
                await transaction_asientos.commit();

                guardados.push({
                    fila: numeroFilaExcel,
                    dominio: fila.Dominio,
                    acta: fila.Acta_Nro,
                    importe: fila.Importe,
                    id_vehiculo: vehiculo.ID,
                    id_cliente: cliente.id_cliente
                });

            } catch (errorFila) {
                await transaction.rollback();
                await transaction_asientos.rollback();
                errores.push(`Fila ${numeroFilaExcel} (Dominio: ${fila.Dominio || "S/D"}, Acta: ${fila.Acta_Nro || "S/D"}): Error inesperado: ${errorFila.message || errorFila}`);
            }
        }

        if (guardados.length === 0 && errores.length > 0) {
            return res.send({
                status: false,
                message: "No se pudo importar ninguna multa del archivo debido a errores en todas las filas.",
                errores
            });
        }

        return res.send({
            status: true,
            message: `Proceso completado. Se importaron ${guardados.length} multas correctamente.${errores.length > 0 ? ` Se omitieron ${errores.length} filas por presentar errores.` : ""}`,
            guardados,
            errores
        });

    } catch (error) {
        console.error("Error en importacionMultas:", error);
        return res.send({ status: false, message: "Ocurrió un error en el servidor al procesar el archivo" });
    }
};

export const importacionesTelepases = async (req, res) => {
    const COLUMNAS_REQUERIDAS = ["FECHA", "PATENTE", "CHOFER", "TARIFA"];
    const NOMBRE_PESTANA = "PASADAS";

    try {
        if (!req.file) {
            return res.send({ status: false, message: "No se envío ningún archivo" });
        }

        const validacion = validarArchivo(req.file, ["xls", "xlsx"], [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ]);

        if (!validacion.valido) {
            return res.send({ status: false, message: validacion.message });
        }

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

        // Buscar la pestaña PASADAS por nombre
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

        // Normalizar los nombres de las columnas (sacar espacios extra y mayúsculas)
        const data = dataRaw.map(row => {
            const normalizedRow = {};
            for (const key in row) {
                normalizedRow[key.trim().toUpperCase()] = row[key];
            }
            return normalizedRow;
        });

        // Validar columnas requeridas
        const columnasArchivo = Object.keys(data[0]);
        const columnasFaltantes = COLUMNAS_REQUERIDAS.filter(col => !columnasArchivo.includes(col));

        if (columnasFaltantes.length > 0) {
            return res.send({
                status: false,
                message: `El Excel no tiene el formato correcto. Faltan las siguientes columnas en la pestaña ${NOMBRE_PESTANA}: ${columnasFaltantes.join(", ")}`
            });
        }

        // ──────────────────────────────────────────────────────────────
        // PASO 1: Agrupar por PATENTE → acumular TARIFA - BONIFICACION
        // ──────────────────────────────────────────────────────────────
        const gruposPorPatente = {};
        const erroresLectura = [];

        const parseMonto = (valor) => {
            if (typeof valor === "number") return valor;
            if (!valor) return 0;
            let str = String(valor).replace(/[^0-9,\.-]/g, '');
            // Asumimos formato argentino: punto para miles, coma para decimales.
            if (str.includes(',')) {
                str = str.replace(/\./g, '').replace(',', '.');
            }
            return parseFloat(str) || 0;
        };

        for (const [index, fila] of data.entries()) {
            const numeroFilaExcel = index + 2;
            const patente = fila.PATENTE ? String(fila.PATENTE).trim().toUpperCase() : null;

            if (!patente) {
                erroresLectura.push(`Fila ${numeroFilaExcel}: La patente está vacía.`);
                continue;
            }

            const tarifa = parseMonto(fila.TARIFA);
            const bonificacion = parseMonto(fila.BONIFICACION);
            // Tomamos la tarifa bruta sin descontar la bonificación según lo solicitado
            const montoNeto = tarifa;

            if (montoNeto <= 0) {
                continue; // Pasada sin costo neto, la ignoramos
            }

            // Convertir fecha serial de Excel a string legible
            let fechaStr = "";
            const rawFecha = fila.FECHA;
            if (typeof rawFecha === "number") {
                const fechaJS = new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
                const d = String(fechaJS.getUTCDate()).padStart(2, "0");
                const m = String(fechaJS.getUTCMonth() + 1).padStart(2, "0");
                const y = fechaJS.getUTCFullYear();
                fechaStr = `${d}/${m}/${y}`;
            } else if (rawFecha instanceof Date) {
                const d = String(rawFecha.getUTCDate()).padStart(2, "0");
                const m = String(rawFecha.getUTCMonth() + 1).padStart(2, "0");
                const y = rawFecha.getUTCFullYear();
                fechaStr = `${d}/${m}/${y}`;
            } else if (rawFecha) {
                fechaStr = String(rawFecha).trim();
            }

            if (!gruposPorPatente[patente]) {
                gruposPorPatente[patente] = {
                    totalTarifa: 0,
                    totalBonificacion: 0,
                    totalNeto: 0,
                    cantidadPasadas: 0,
                    chofer: fila.CHOFER ? String(fila.CHOFER).trim() : "S/D",
                    autopistas: new Set(),
                    fechas: [],
                };
            }

            gruposPorPatente[patente].totalTarifa += tarifa;
            gruposPorPatente[patente].totalBonificacion += bonificacion;
            gruposPorPatente[patente].totalNeto += montoNeto;
            gruposPorPatente[patente].cantidadPasadas += 1;
            if (fila.AUTOPISTA) gruposPorPatente[patente].autopistas.add(String(fila.AUTOPISTA).trim());
            if (fechaStr) gruposPorPatente[patente].fechas.push(fechaStr);
        }

        const patentes = Object.keys(gruposPorPatente);
        if (patentes.length === 0) {
            return res.send({
                status: false,
                message: "No se encontraron pasadas válidas para procesar en el archivo.",
                errores: erroresLectura
            });
        }

        // ──────────────────────────────────────────────────────────────
        // PASO 2: Resolver PATENTE → Vehículo → Contrato → Cliente
        //         y consolidar por id_cliente
        // ──────────────────────────────────────────────────────────────
        const consolidadoPorCliente = {};
        const erroresResolucion = [];

        for (const patente of patentes) {
            const grupo = gruposPorPatente[patente];

            // Buscar vehículo por dominio
            const [vehiculo] = await giama_renting.query(
                `SELECT ID FROM vehiculos WHERE Dominio = :dominio LIMIT 1`,
                {
                    replacements: { dominio: patente },
                    type: QueryTypes.SELECT,
                }
            );

            if (!vehiculo) {
                erroresResolucion.push(`Patente ${patente} (${grupo.cantidadPasadas} pasadas, $${grupo.totalNeto.toFixed(2)}): El dominio no existe en el sistema.`);
                continue;
            }

            // Buscar contrato vigente - usamos la fecha más reciente de las pasadas
            const fechaMasReciente = grupo.fechas.length > 0
                ? obtenerFechaMasReciente(grupo.fechas)
                : getTodayDate();

            const [cliente] = await giama_renting.query(
                `SELECT id_cliente 
                 FROM contratos_alquiler 
                 WHERE id_vehiculo = :id_vehiculo 
                   AND fecha_desde <= :fecha_referencia 
                   AND (fecha_hasta IS NULL OR fecha_hasta >= :fecha_referencia)`,
                {
                    type: QueryTypes.SELECT,
                    replacements: {
                        id_vehiculo: vehiculo.ID,
                        fecha_referencia: fechaMasReciente,
                    },
                }
            );

            if (!cliente) {
                erroresResolucion.push(`Patente ${patente} (${grupo.cantidadPasadas} pasadas, $${grupo.totalNeto.toFixed(2)}): No se encontró contrato vigente para este vehículo.`);
                continue;
            }

            const idCliente = cliente.id_cliente;

            if (!consolidadoPorCliente[idCliente]) {
                consolidadoPorCliente[idCliente] = {
                    id_cliente: idCliente,
                    totalNeto: 0,
                    cantidadPasadas: 0,
                    patentes: [],
                    autopistas: new Set(),
                    fechaMin: null,
                    fechaMax: null,
                    chofer: grupo.chofer,
                    detallePatentes: [],
                };
            }

            consolidadoPorCliente[idCliente].totalNeto += grupo.totalNeto;
            consolidadoPorCliente[idCliente].cantidadPasadas += grupo.cantidadPasadas;
            consolidadoPorCliente[idCliente].patentes.push(patente);
            grupo.autopistas.forEach(a => consolidadoPorCliente[idCliente].autopistas.add(a));

            // Rango de fechas
            const fechasOrdenadas = grupo.fechas.sort();
            if (fechasOrdenadas.length > 0) {
                const min = fechasOrdenadas[0];
                const max = fechasOrdenadas[fechasOrdenadas.length - 1];
                if (!consolidadoPorCliente[idCliente].fechaMin || min < consolidadoPorCliente[idCliente].fechaMin) {
                    consolidadoPorCliente[idCliente].fechaMin = min;
                }
                if (!consolidadoPorCliente[idCliente].fechaMax || max > consolidadoPorCliente[idCliente].fechaMax) {
                    consolidadoPorCliente[idCliente].fechaMax = max;
                }
            }

            consolidadoPorCliente[idCliente].detallePatentes.push({
                patente,
                id_vehiculo: vehiculo.ID,
                totalNeto: grupo.totalNeto,
                cantidadPasadas: grupo.cantidadPasadas,
            });
        }

        const clientes = Object.values(consolidadoPorCliente);
        if (clientes.length === 0) {
            return res.send({
                status: false,
                message: "No se pudo vincular ninguna patente a un cliente con contrato vigente.",
                errores: [...erroresLectura, ...erroresResolucion],
            });
        }

        // ──────────────────────────────────────────────────────────────
        // PASO 3: Registrar un solo ingreso consolidado por cliente
        // ──────────────────────────────────────────────────────────────
        const ID_CONCEPTO_TELEPASES = 35; // 35 = "Telepase"
        const guardados = [];
        const erroresRegistro = [];

        for (const clienteConsolidado of clientes) {
            const transaction = await giama_renting.transaction();
            const transaction_asientos = await pa7_giama_renting.transaction();

            try {
                const autopistasStr = Array.from(clienteConsolidado.autopistas).join(", ");
                const patentesStr = clienteConsolidado.patentes.join(", ");
                const rangoFechas = clienteConsolidado.fechaMin && clienteConsolidado.fechaMax
                    ? `${clienteConsolidado.fechaMin} al ${clienteConsolidado.fechaMax}`
                    : "S/D";

                // Usamos el primer vehículo del cliente para el registro base
                const primerDetalle = clienteConsolidado.detallePatentes[0];
                const importeTotal = parseFloat(clienteConsolidado.totalNeto.toFixed(2));

                const lineasObservacion = clienteConsolidado.detallePatentes.map((d, index) => {
                    if (index === 0) {
                        return `Dominio(s): ${patentesStr} - Período: ${rangoFechas} ($${d.totalNeto.toFixed(2)})`;
                    }
                    return `Telepase - Dominio: ${d.patente} - OBS: Período: ${rangoFechas} ($${d.totalNeto.toFixed(2)})`;
                });
                const observacion = lineasObservacion.join('\n');

                await registrarIngresoIndividual({
                    debe_ingreso: importeTotal,
                    id_vehiculo: primerDetalle.id_vehiculo,
                    fecha_deuda: `${getTodayDate()} 00:00:00`,
                    fecha_pago: null,
                    id_forma_cobro_1: null,
                    total_cobro_1: 0,
                    id_cliente: clienteConsolidado.id_cliente,
                    observacion: observacion,
                    observacion_pago: "",
                    usuario: req.user ? req.user.email : "sistema",
                    id_concepto: ID_CONCEPTO_TELEPASES,
                    importe_neto: importeTotal,
                    importe_iva: 0,
                    importe_total: importeTotal,
                    transaction_costos_ingresos: transaction,
                    transaction_asientos: transaction_asientos,
                });

                await transaction.commit();
                await transaction_asientos.commit();

                guardados.push({
                    id_cliente: clienteConsolidado.id_cliente,
                    chofer: clienteConsolidado.chofer,
                    patentes: clienteConsolidado.patentes,
                    cantidadPasadas: clienteConsolidado.cantidadPasadas,
                    importeTotal,
                    rangoFechas,
                });

            } catch (errorCliente) {
                if (!transaction.finished) await transaction.rollback();
                if (!transaction_asientos.finished) await transaction_asientos.rollback();
                erroresRegistro.push(`Cliente ID ${clienteConsolidado.id_cliente} (${clienteConsolidado.chofer}): Error al registrar: ${errorCliente.message || errorCliente}`);
            }
        }

        const todosErrores = [...erroresLectura, ...erroresResolucion, ...erroresRegistro];

        if (guardados.length === 0 && todosErrores.length > 0) {
            return res.send({
                status: false,
                message: "No se pudo importar ningún consumo de telepase debido a errores.",
                errores: todosErrores,
            });
        }

        const montoTotalImportado = guardados.reduce((acc, g) => acc + g.importeTotal, 0);

        return res.send({
            status: true,
            message: `Proceso completado. Se generaron ${guardados.length} cargos consolidados por un total de $${montoTotalImportado.toFixed(2)}.${todosErrores.length > 0 ? ` Se encontraron ${todosErrores.length} observaciones.` : ""}`,
            guardados,
            errores: todosErrores,
        });

    } catch (error) {
        console.error("Error en importacionesTelepases:", error);
        return res.send({ status: false, message: "Ocurrió un error en el servidor al procesar el archivo" });
    }
};

/**
 * Convierte un array de fechas en formato DD/MM/YYYY y devuelve
 * la más reciente en formato SQL (YYYY-MM-DD).
 */
function obtenerFechaMasReciente(fechas) {
    let max = null;

    for (const f of fechas) {
        const parts = f.split("/");
        if (parts.length !== 3) continue;
        const [dia, mes, anio] = parts;
        const dateObj = new Date(`${anio}-${mes}-${dia}`);
        if (!max || dateObj > max) {
            max = dateObj;
        }
    }

    if (!max) return getTodayDate();

    const y = max.getFullYear();
    const m = String(max.getMonth() + 1).padStart(2, "0");
    const d = String(max.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

