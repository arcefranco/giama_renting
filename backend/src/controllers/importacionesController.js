import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";
import xlsx from "xlsx";
import { validarArchivo } from "../../helpers/validarArchivo.js";
import { registrarIngresoIndividual } from "./costosController.js";

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

                const parts = fila.Fecha_Infraccion.toString().split("/");
                if (parts.length !== 3) {
                    errores.push(`Fila ${numeroFilaExcel} (Dominio: ${fila.Dominio || "S/D"}, Acta: ${fila.Acta_Nro || "S/D"}): El formato de fecha "${fila.Fecha_Infraccion}" no es válido. Debe ser DD/MM/YYYY.`);
                    await transaction.rollback();
                    await transaction_asientos.rollback();
                    continue;
                }
                const [dia, mes, anio] = parts;
                const fechaSql = `${anio}-${mes}-${dia} ${fila.Hora}:00`;

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
                    fecha_deuda: fechaSql,
                    fecha_pago: null,
                    id_forma_cobro_1: null,
                    total_cobro_1: 0,
                    id_cliente: cliente.id_cliente,
                    observacion: `MULTA - Acta: ${fila.Acta_Nro} - Motivo: ${fila.Motivo_Infraccion}`,
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
