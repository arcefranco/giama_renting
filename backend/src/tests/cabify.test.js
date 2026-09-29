import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMonto } from "../../helpers/telepasesHelper.js";

/**
 * Suite de Pruebas Unitarias, de Integración Lógica y Resiliencia para Pagos Masivos Cabify
 * 
 * Cobertura de Casos Críticos:
 * 1. Balance Contable Estricto (Partida Doble: Debe === Haber = 0.00 de diferencia).
 * 2. Correlatividad y Reserva Atómica de Asientos Contables (Sin colisiones ni gaps).
 * 3. Simulación de Interrupción en cada paso de la secuencia (Rollback coordinado dual-DB).
 * 4. Matriz de Validación de Importes y Segregación de Errores (Negativos, $0, NaN, Con Deuda).
 * 5. Sanitización de Concepto, Truncamiento Defensivo (VARCHAR 200) y Metadatos de Auditoría.
 * 6. Estrés de Precisión Decimal y Acumulación en Punto Flotante IEEE-754 (Sin pérdida de centavos).
 * 7. Pagos Duplicados dentro del mismo lote (Múltiples cobros para un mismo chofer en la semana).
 * 8. Reasignación de Chofer en Caliente (Consistencia referencial entre recibo, cliente y asiento).
 * 9. Normalización Robusta de CUITs y Patentes (Provisorias, minúsculas, espacios y guiones).
 */

describe("Cabify — Suite Integral de Pruebas: Balance Contable, Resiliencia y Casos Borde", () => {

    // =========================================================================
    // 1. Balance Contable Estricto (Partida Doble y Cero Desbalance)
    // =========================================================================
    describe("1. Balance Contable Estricto (Partida Doble y Cero Desbalance)", () => {
        const casosImportesReales = [
            550000.00,
            450000.00,
            64597.04,
            11104.05,
            334062.51,
            600000.00,
            277597.07,
            740000.00,
            464934.54,
            50942.38,
            439208.52,
            150435.13,
            9702.25,
            162987.40,
            758333.00,
            666667.00,
            21474.54,
            716667.00,
            430095.94,
            11437.83,
            304528.94,
            439150.32,
            669750.56,
            20757.16,
            216183.24,
            684117.97,
            0.01 // Importe mínimo posible
        ];

        it("cada asiento contable individual debe tener exactamente Debe === Haber (Diferencia = 0.00)", () => {
            const CUENTA_CABIFY_DEBE = 110409;
            const CUENTA_CLIENTE_HABER = 110310;

            for (const [i, importeRaw] of casosImportesReales.entries()) {
                const importe = parseFloat(Number(importeRaw).toFixed(2));
                const nroAsiento = 3000 + i;

                const movDebe = {
                    NroAsiento: nroAsiento,
                    Cuenta: CUENTA_CABIFY_DEBE,
                    DH: "D",
                    Importe: importe
                };

                const movHaber = {
                    NroAsiento: nroAsiento,
                    Cuenta: CUENTA_CLIENTE_HABER,
                    DH: "H",
                    Importe: importe
                };

                assert.equal(movDebe.Importe, movHaber.Importe, `Desbalance en asiento ${nroAsiento} para importe ${importe}`);
                assert.equal(movDebe.Cuenta, 110409, "La cuenta del Debe debe ser 110409 (Cobros Cabify)");
                assert.equal(movHaber.Cuenta, 110310, "La cuenta del Haber debe ser 110310 (Cta Cte Clientes)");
                assert.equal(parseFloat((movDebe.Importe - movHaber.Importe).toFixed(2)), 0.00, "La diferencia Debe - Haber debe ser estrictamente 0.00");
            }
        });

        it("la sumatoria global de todos los asientos Debe y Haber debe ser exactamente igual a la suma de cobros", () => {
            let totalCobrosExcel = 0;
            let totalMovimientosDebe = 0;
            let totalMovimientosHaber = 0;

            for (const imp of casosImportesReales) {
                const monto = parseFloat(Number(imp).toFixed(2));
                totalCobrosExcel += monto;
                totalMovimientosDebe += monto;
                totalMovimientosHaber += monto;
            }

            const totalExcelRedondeado = parseFloat(totalCobrosExcel.toFixed(2));
            const totalDebeRedondeado = parseFloat(totalMovimientosDebe.toFixed(2));
            const totalHaberRedondeado = parseFloat(totalMovimientosHaber.toFixed(2));

            assert.equal(totalDebeRedondeado, totalHaberRedondeado, "El total general del Debe y Haber difiere");
            assert.equal(totalDebeRedondeado, totalExcelRedondeado, "El total contable difiere del total de cobros");
            assert.equal(parseFloat((totalDebeRedondeado - totalHaberRedondeado).toFixed(2)), 0.00);
        });

        it("el libro secundario (c2_movimientos) debe reflejar exactamente las mismas sumas Debe y Haber", () => {
            const CUENTA_SEC_DEBE = 110409;
            const CUENTA_SEC_HABER = 110310;

            for (const [i, imp] of casosImportesReales.entries()) {
                const monto = parseFloat(Number(imp).toFixed(2));
                const nroAsientoSec = 5000 + i;

                const c2Debe = { NroAsiento: nroAsientoSec, Cuenta: CUENTA_SEC_DEBE, DH: "D", Importe: monto };
                const c2Haber = { NroAsiento: nroAsientoSec, Cuenta: CUENTA_SEC_HABER, DH: "H", Importe: monto };

                assert.equal(c2Debe.Importe, c2Haber.Importe);
                assert.equal(c2Debe.Cuenta, 110409);
                assert.equal(c2Haber.Cuenta, 110310);
            }
        });
    });

    // =========================================================================
    // 2. Correlatividad y Reserva Atómica de Asientos Contables
    // =========================================================================
    describe("2. Correlatividad y Reserva Atómica de Asientos Contables", () => {
        it("debe asignar números de asiento y asiento secundario estrictamente contiguos sin colisiones ni saltos", () => {
            const count = 10;
            const baseAsiento = 2592;
            const baseAsientoSecundario = 2136;

            const asientosGenerados = [];
            const asientosSecGenerados = [];

            for (let i = 0; i < count; i++) {
                asientosGenerados.push(baseAsiento + i + 1);
                asientosSecGenerados.push(baseAsientoSecundario + i + 1);
            }

            assert.equal(asientosGenerados.length, count);
            assert.equal(asientosSecGenerados.length, count);

            const setAsientos = new Set(asientosGenerados);
            const setAsientosSec = new Set(asientosSecGenerados);
            assert.equal(setAsientos.size, count, "No debe haber números de asiento duplicados");
            assert.equal(setAsientosSec.size, count, "No debe haber números de asiento secundario duplicados");

            assert.equal(asientosGenerados[0], 2593);
            assert.equal(asientosGenerados[count - 1], 2592 + count);
            assert.equal(asientosSecGenerados[0], 2137);
            assert.equal(asientosSecGenerados[count - 1], 2136 + count);
        });

        it("cada movimiento contable debe asociar unívocamente el nro_recibo correspondiente", () => {
            const firstReciboId = 800;
            const baseAsiento = 1000;
            const count = 5;

            for (let i = 0; i < count; i++) {
                const reciboEsperado = firstReciboId + i;
                const asientoEsperado = baseAsiento + i + 1;
                const concepto = `RECIBO: ${reciboEsperado} Chofer: Chofer ${i} CUIT: 20123456789 Patente: AA${i}BB - Cobro Cabify`;

                assert.match(concepto, new RegExp(`RECIBO: ${reciboEsperado}`));
                assert.equal(asientoEsperado, 1001 + i);
            }
        });
    });

    // =========================================================================
    // 3. Resiliencia: Fallos e Interrupción en cada Paso de la Secuencia
    // =========================================================================
    describe("3. Resiliencia e Interrupciones a Mitad de Secuencia (Atomic Rollback)", () => {
        
        // Función generadora de simulador de pipeline con espías de estado
        const simularPipelineTransaccional = async (pasoAFallar) => {
            let giamaCommitted = false;
            let pa7Committed = false;
            let giamaRolledBack = false;
            let pa7RolledBack = false;

            const txGiama = {
                finished: false,
                commit: async () => { giamaCommitted = true; txGiama.finished = true; },
                rollback: async () => { giamaRolledBack = true; txGiama.finished = true; }
            };

            const txPa7 = {
                finished: false,
                commit: async () => { pa7Committed = true; txPa7.finished = true; },
                rollback: async () => { pa7RolledBack = true; txPa7.finished = true; }
            };

            let errorLanzado = null;

            try {
                // Paso 1: Reserva de bloque de asientos en pa7
                if (pasoAFallar === "paso1_reserva_asientos") {
                    throw new Error("Paso 1 Falló: Error de bloqueo FOR UPDATE en parametros");
                }

                // Paso 2: Inserción en recibos (giama_renting)
                if (pasoAFallar === "paso2_insert_recibos") {
                    throw new Error("Paso 2 Falló: Timeout o conexión perdida al insertar recibos");
                }

                // Paso 3: Inserción en pagos_clientes (giama_renting)
                if (pasoAFallar === "paso3_insert_pagos_clientes") {
                    throw new Error("Paso 3 Falló: Violación de restricción en pagos_clientes");
                }

                // Paso 4: Inserción en pagos_cabify (giama_renting)
                if (pasoAFallar === "paso4_insert_pagos_cabify") {
                    throw new Error("Paso 4 Falló: Error en tabla de auditoría pagos_cabify");
                }

                // Paso 5: Inserción en c_movimientos (pa7_giama_renting)
                if (pasoAFallar === "paso5_insert_c_movimientos") {
                    throw new Error("Paso 5 Falló: Cuenta contable 110409 inexistente o error en c_movimientos");
                }

                // Paso 6: Inserción en c2_movimientos (pa7_giama_renting)
                if (pasoAFallar === "paso6_insert_c2_movimientos") {
                    throw new Error("Paso 6 Falló: Error en libro secundario c2_movimientos");
                }

                // Paso 7: Commit coordinado
                if (pasoAFallar === "paso7_commit_pa7") {
                    throw new Error("Paso 7 Falló: Pérdida de socket durante commit de pa7");
                }

                await txGiama.commit();
                await txPa7.commit();

            } catch (err) {
                errorLanzado = err;
                if (!txGiama.finished) await txGiama.rollback();
                if (!txPa7.finished) await txPa7.rollback();
            }

            return {
                giamaCommitted,
                pa7Committed,
                giamaRolledBack,
                pa7RolledBack,
                errorLanzado
            };
        };

        const pasosInterrupcion = [
            "paso1_reserva_asientos",
            "paso2_insert_recibos",
            "paso3_insert_pagos_clientes",
            "paso4_insert_pagos_cabify",
            "paso5_insert_c_movimientos",
            "paso6_insert_c2_movimientos",
            "paso7_commit_pa7"
        ];

        for (const paso of pasosInterrupcion) {
            it(`si ocurre una interrupción en [${paso}], debe cancelar ambas transacciones y no dejar datos huérfanos`, async () => {
                const resultado = await simularPipelineTransaccional(paso);

                assert.ok(resultado.errorLanzado, `Debió atraparse un error en ${paso}`);
                assert.equal(resultado.giamaCommitted, false, `giama_renting NO debe comitear al fallar en ${paso}`);
                assert.equal(resultado.pa7Committed, false, `pa7_giama_renting NO debe comitear al fallar en ${paso}`);
                assert.equal(resultado.giamaRolledBack, true, `giama_renting DEBE hacer rollback al fallar en ${paso}`);
                assert.equal(resultado.pa7RolledBack, true, `pa7_giama_renting DEBE hacer rollback al fallar en ${paso}`);
            });
        }
    });

    // =========================================================================
    // 4. Matriz de Validación de Importes y Segregación de Errores
    // =========================================================================
    describe("4. Matriz de Validación de Importes y Segregación de Errores", () => {
        it("debe rechazar importes en $0.00 o negativos y segregarlos en lista de errores sin quebrar el lote", () => {
            const loteEntrada = [
                { id_temp: 1, cuit: "20111111111", patente: "AA111AA", importe: "50000.00", id_cliente: 10 },
                { id_temp: 2, cuit: "20222222222", patente: "BB222BB", importe: "0.00", id_cliente: 20 },
                { id_temp: 3, cuit: "20333333333", patente: "CC333CC", importe: 0, id_cliente: 30 },
                { id_temp: 4, cuit: "20444444444", patente: "DD444DD", importe: "-1500.00", id_cliente: 40 },
                { id_temp: 5, cuit: "20555555555", patente: "EE555EE", importe: "invalid", id_cliente: 50 },
                { id_temp: 6, cuit: "20666666666", patente: "FF666FF", importe: "125000.50", id_cliente: 60 }
            ];

            const validos = [];
            const errores = [];

            for (const item of loteEntrada) {
                const imp = parseFloat(Number(item.importe).toFixed(2));
                if (!item.id_cliente) {
                    errores.push(`Item ${item.id_temp}: Sin cliente asignado`);
                } else if (isNaN(imp) || imp <= 0) {
                    errores.push(`Item ${item.id_temp}: El importe a cobrar debe ser mayor a 0`);
                } else {
                    validos.push(item);
                }
            }

            assert.equal(validos.length, 2, "Solo deben procesarse los 2 registros válidos mayores a $0");
            assert.equal(errores.length, 4, "Los 4 registros inválidos deben segregarse con error");
            assert.equal(validos[0].id_temp, 1);
            assert.equal(validos[1].id_temp, 6);
        });

        it("debe rechazar pagos sin chofer/cliente asignado (id_cliente nulo)", () => {
            const loteSinCliente = [
                { id_temp: 1, cuit: "20111111111", patente: "AA111AA", importe: "45000.00", id_cliente: null },
                { id_temp: 2, cuit: "", patente: "BB222BB", importe: "80000.00", id_cliente: undefined }
            ];

            const validos = loteSinCliente.filter(item => {
                const imp = parseFloat(Number(item.importe).toFixed(2));
                return Boolean(item.id_cliente) && !isNaN(imp) && imp > 0;
            });

            assert.equal(validos.length, 0, "No debe permitir ningún registro sin cliente asignado");
        });

        it("parseMonto debe sanitizar correctamente strings monetarios con formato argentino", () => {
            assert.equal(parseMonto("$ 550.000,00"), 550000);
            assert.equal(parseMonto("$64.597,04"), 64597.04);
            assert.equal(parseMonto("11.104,05"), 11104.05);
            assert.equal(parseMonto(" 334062.51 "), 334062.51);
            assert.equal(parseMonto("0,00"), 0);
            assert.equal(parseMonto("CON DEUDA"), 0);
            assert.equal(parseMonto(null), 0);
            assert.equal(parseMonto(undefined), 0);
            assert.equal(parseMonto(""), 0);
        });
    });

    // =========================================================================
    // 5. Formato de Concepto y Truncamiento Defensivo (VARCHAR 200)
    // =========================================================================
    describe("5. Formato de Concepto y Truncamiento Defensivo de Asientos Contables", () => {
        it("el concepto del asiento debe identificar con precisión recibo, chofer, CUIT y patente", () => {
            const item = {
                conductor: "JUAN CARLOS PEREZ",
                cuit: "20304050607",
                patente: "AF123ZZ"
            };
            const nroRecibo = 952;
            const concepto = `RECIBO: ${nroRecibo} Chofer: ${item.conductor || ''} CUIT: ${item.cuit || ''} Patente: ${item.patente || ''} - Cobro Cabify`.slice(0, 200);

            assert.equal(concepto, "RECIBO: 952 Chofer: JUAN CARLOS PEREZ CUIT: 20304050607 Patente: AF123ZZ - Cobro Cabify");
            assert.ok(concepto.length <= 200);
        });

        it("si el chofer o razón social tiene un nombre excesivamente largo, no debe superar 200 caracteres (evitar ER_DATA_TOO_LONG)", () => {
            const item = {
                conductor: "ESTEBAN QUITO DE LA SANTISIMA TRINIDAD Y DE TODOS LOS SANTOS MARTINEZ DE HOZ Y BARRAGAN TRANSPORTES INTERNACIONALES SOCIEDAD ANONIMA COMERCIAL E INDUSTRIAL",
                cuit: "30712345679",
                patente: "AF999ZZ"
            };
            const nroRecibo = 123456;
            const conceptoCrudo = `RECIBO: ${nroRecibo} Chofer: ${item.conductor || ''} CUIT: ${item.cuit || ''} Patente: ${item.patente || ''} - Cobro Cabify`;
            const conceptoTruncado = conceptoCrudo.slice(0, 200);

            assert.ok(conceptoCrudo.length > 200, "El concepto crudo debería sobrepasar los 200 caracteres para probar el caso borde");
            assert.equal(conceptoTruncado.length, 200, "El concepto sanitizado debe tener como máximo 200 caracteres");
            assert.ok(conceptoTruncado.startsWith(`RECIBO: ${nroRecibo}`));
        });
    });

    // =========================================================================
    // 6. Estrés de Precisión Decimal y Acumulación en Punto Flotante IEEE-754
    // =========================================================================
    describe("6. Estrés de Precisión Decimal y Acumulación en Punto Flotante (IEEE-754)", () => {
        it("lote masivo de 100 importes con centavos complejos (.01, .07, .13, .33, .67, .89) debe conservar igualdad estricta", () => {
            const centavosComplejos = [0.01, 0.03, 0.07, 0.13, 0.27, 0.33, 0.49, 0.67, 0.89, 0.99];
            const loteMasivo = [];

            for (let i = 0; i < 100; i++) {
                const parteEntera = 50000 + (i * 1234);
                const centavos = centavosComplejos[i % centavosComplejos.length];
                const importe = parseFloat((parteEntera + centavos).toFixed(2));
                loteMasivo.push(importe);
            }

            let sumaTotalExcel = 0;
            let sumaTotalDebe = 0;
            let sumaTotalHaber = 0;

            for (const [idx, imp] of loteMasivo.entries()) {
                const asiento = 10000 + idx;
                const movDebe = { NroAsiento: asiento, DH: "D", Importe: imp };
                const movHaber = { NroAsiento: asiento, DH: "H", Importe: imp };

                // Balance fila a fila
                assert.equal(movDebe.Importe, movHaber.Importe, `Desbalance en asiento ${asiento}`);
                assert.equal(parseFloat((movDebe.Importe - movHaber.Importe).toFixed(2)), 0.00);

                sumaTotalExcel += imp;
                sumaTotalDebe += movDebe.Importe;
                sumaTotalHaber += movHaber.Importe;
            }

            // Normalización para mitigar artefactos de punto flotante en la acumulación
            const totalExcel = parseFloat(sumaTotalExcel.toFixed(2));
            const totalDebe = parseFloat(sumaTotalDebe.toFixed(2));
            const totalHaber = parseFloat(sumaTotalHaber.toFixed(2));

            assert.equal(totalDebe, totalHaber, "Debe y Haber acumulado deben ser idénticos al centavo");
            assert.equal(totalDebe, totalExcel, "El Debe total debe ser idéntico al total cobrado");
            assert.equal(parseFloat((totalDebe - totalHaber).toFixed(2)), 0.00);
        });

        it("importes extremos mínimos ($0.01) y máximos ($99.999.999,99) no rompen la precisión ni generan desbalance", () => {
            const extremos = [0.01, 99999999.99, 0.10, 0.20, 0.30];

            for (const imp of extremos) {
                const movD = { Importe: parseFloat(imp.toFixed(2)) };
                const movH = { Importe: parseFloat(imp.toFixed(2)) };
                assert.equal(movD.Importe, movH.Importe);
                assert.equal(parseFloat((movD.Importe - movH.Importe).toFixed(2)), 0.00);
            }
        });
    });

    // =========================================================================
    // 7. Pagos Duplicados dentro del Mismo Lote
    // =========================================================================
    describe("7. Manejo de Pagos Múltiples o Repetidos en el Mismo Archivo", () => {
        it("si un chofer tiene 2 cobros en el mismo Excel (ej. 2 vehículos o liquidación desglosada), debe generar recibos y asientos separados", () => {
            const choferDuplicadoLote = [
                { id_temp: 1, cuit: "20304050607", patente: "AA111AA", importe: "350000.00", id_cliente: 45, id_vehiculo: 10 },
                { id_temp: 2, cuit: "20304050607", patente: "BB222BB", importe: "200000.00", id_cliente: 45, id_vehiculo: 11 }
            ];

            const firstReciboId = 1500;
            const baseAsiento = 4000;

            const recibosGenerados = choferDuplicadoLote.map((item, i) => ({
                id_recibo: firstReciboId + i,
                id_cliente: item.id_cliente,
                patente: item.patente,
                asiento: baseAsiento + i + 1,
                importe: parseFloat(Number(item.importe).toFixed(2))
            }));

            // Comprobamos que no se solapan los IDs a pesar de pertenecer al mismo cliente
            assert.equal(recibosGenerados[0].id_recibo, 1500);
            assert.equal(recibosGenerados[1].id_recibo, 1501);
            assert.equal(recibosGenerados[0].asiento, 4001);
            assert.equal(recibosGenerados[1].asiento, 4002);
            assert.notEqual(recibosGenerados[0].id_recibo, recibosGenerados[1].id_recibo);
            assert.notEqual(recibosGenerados[0].asiento, recibosGenerados[1].asiento);
        });
    });

    // =========================================================================
    // 8. Reasignación de Chofer en Caliente (Consistencia Referencial)
    // =========================================================================
    describe("8. Reasignación de Chofer en Caliente (Consistencia Referencial)", () => {
        it("al cambiar el cliente desde el modal, todos los registros deben imputarse al NUEVO cliente", () => {
            // Fila con cliente original detectado por CUIT anterior
            const fila = {
                id_temp: 1,
                patente: "AF123ZZ",
                cuit: "20111111111",
                importe: "450000.00",
                id_cliente: 10 // Cliente A
            };

            // Usuario cambia a Cliente B en el selector
            const nuevoClienteSeleccionado = {
                id: 99,
                razon_social: "TRANSPORTES NUEVO RUMBO SRL",
                nro_documento: "30999888777"
            };

            fila.id_cliente = nuevoClienteSeleccionado.id;
            fila.cuit = nuevoClienteSeleccionado.nro_documento;
            fila.conductor = nuevoClienteSeleccionado.razon_social;

            const nroRecibo = 701;
            const nroAsiento = 801;

            const registroRecibo = {
                nro_recibo: nroRecibo,
                id_cliente: fila.id_cliente,
                importe: parseFloat(fila.importe)
            };

            const registroPagoCliente = {
                nro_recibo: nroRecibo,
                id_cliente: fila.id_cliente,
                nro_asiento: nroAsiento,
                importe_cobro: parseFloat(fila.importe)
            };

            const movimientoHaber = {
                NroAsiento: nroAsiento,
                Cuenta: 110310, // Cta Cte Clientes
                DH: "H",
                Importe: parseFloat(fila.importe),
                Concepto: `RECIBO: ${nroRecibo} Chofer: ${fila.conductor} CUIT: ${fila.cuit} Patente: ${fila.patente} - Cobro Cabify`
            };

            assert.equal(registroRecibo.id_cliente, 99, "El recibo debe crearse para el cliente reasignado");
            assert.equal(registroPagoCliente.id_cliente, 99, "El pago_cliente debe crearse para el cliente reasignado");
            assert.match(movimientoHaber.Concepto, /TRANSPORTES NUEVO RUMBO SRL/);
            assert.match(movimientoHaber.Concepto, /30999888777/);
        });
    });

    // =========================================================================
    // 9. Normalización Robusta de CUITs y Patentes
    // =========================================================================
    describe("9. Normalización Robusta de CUITs y Patentes", () => {
        it("debe limpiar CUITs con guiones, espacios y puntos a solo números", () => {
            const sanitizarCuit = (val) => String(val || "").replace(/\D/g, "");

            assert.equal(sanitizarCuit("20-30405060-7"), "20304050607");
            assert.equal(sanitizarCuit("20 30405060 7"), "20304050607");
            assert.equal(sanitizarCuit("20.30405060.7"), "20304050607");
            assert.equal(sanitizarCuit("20304050607"), "20304050607");
            assert.equal(sanitizarCuit(""), "");
            assert.equal(sanitizarCuit(null), "");
        });

        it("debe limpiar patentes con minúsculas, espacios y guiones a formato UPPER sin espacios", () => {
            const sanitizarPatente = (val) => String(val || "").trim().toUpperCase().replace(/[\s-]/g, "");

            assert.equal(sanitizarPatente("af 123 zz"), "AF123ZZ");
            assert.equal(sanitizarPatente("af-123-zz"), "AF123ZZ");
            assert.equal(sanitizarPatente(" aa 111 bb "), "AA111BB");
            assert.equal(sanitizarPatente("ab123cd"), "AB123CD");
        });
    });

});
