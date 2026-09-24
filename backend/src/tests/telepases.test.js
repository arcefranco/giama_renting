import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    agruparPasadasTelepases,
    findContratoParaFecha,
    parseFechaTelepase,
    parseMonto,
    formatFechaDDMMAAAA,
    formatFechaYYYYMMDD
} from "../../helpers/telepasesHelper.js";

describe("Telepases — Suite de Pruebas Unitarias de Imputación y Dominio", () => {

    describe("1. Límites exactos de contrato (Boundary Testing)", () => {
        const idVehiculo = 10;
        const vehiculosMap = new Map([["AA111AA", idVehiculo]]);
        const contratosPorVehiculo = new Map([
            [idVehiculo, [
                {
                    id: 1,
                    id_cliente: 100,
                    nombre: "Carlos",
                    apellido: "Pérez",
                    razon_social: null,
                    nro_documento: "20300400",
                    fecha_desde: "2026-09-01",
                    fecha_hasta: "2026-09-15"
                }
            ]]
        ]);

        it("debe imputar al contrato si la pasada ocurre exactamente en fecha_desde (primer día)", () => {
            const pasadasValidas = [
                {
                    patente: "AA111AA",
                    dateObj: new Date(Date.UTC(2026, 8, 1)), // 2026-09-01
                    tarifa: 1500,
                    bonificacion: 0,
                    montoNeto: 1500,
                    chofer: "Carlos Pérez",
                    autopista: "AUSA"
                }
            ];

            const grupos = agruparPasadasTelepases({ pasadasValidas, vehiculosMap, contratosPorVehiculo });

            assert.equal(grupos.length, 1);
            assert.equal(grupos[0].idCliente, 100);
            assert.equal(grupos[0].advertencia, null);
            assert.equal(grupos[0].totalNeto, 1500);
            assert.equal(grupos[0].rangoFechas, "01/09/2026");
        });

        it("debe imputar al contrato si la pasada ocurre exactamente en fecha_hasta (último día)", () => {
            const pasadasValidas = [
                {
                    patente: "AA111AA",
                    dateObj: new Date(Date.UTC(2026, 8, 15)), // 2026-09-15
                    tarifa: 2000,
                    bonificacion: 0,
                    montoNeto: 2000,
                    chofer: "Carlos Pérez",
                    autopista: "AUSA"
                }
            ];

            const grupos = agruparPasadasTelepases({ pasadasValidas, vehiculosMap, contratosPorVehiculo });

            assert.equal(grupos.length, 1);
            assert.equal(grupos[0].idCliente, 100);
            assert.equal(grupos[0].advertencia, null);
            assert.equal(grupos[0].totalNeto, 2000);
            assert.equal(grupos[0].rangoFechas, "15/09/2026");
        });
    });

    describe("2. Fecha huérfana / Gap entre contratos (Out of bounds)", () => {
        const idVehiculo = 20;
        const vehiculosMap = new Map([["BB222BB", idVehiculo]]);
        const contratosPorVehiculo = new Map([
            [idVehiculo, [
                {
                    id: 1,
                    id_cliente: 101,
                    nombre: "Cliente",
                    apellido: "Uno",
                    razon_social: null,
                    fecha_desde: "2026-08-01",
                    fecha_hasta: "2026-09-01"
                },
                {
                    id: 2,
                    id_cliente: 102,
                    nombre: "Cliente",
                    apellido: "Dos",
                    razon_social: null,
                    fecha_desde: "2026-09-05",
                    fecha_hasta: "2026-09-30"
                }
            ]]
        ]);

        it("una pasada en días sin contrato (ej. 03/09) NO debe cobrarse a ningún cliente y debe alertar", () => {
            const pasadasValidas = [
                {
                    patente: "BB222BB",
                    dateObj: new Date(Date.UTC(2026, 8, 3)), // 2026-09-03 (el auto estuvo en base/taller)
                    tarifa: 3500,
                    bonificacion: 0,
                    montoNeto: 3500,
                    chofer: "S/D",
                    autopista: "AUSA"
                }
            ];

            const grupos = agruparPasadasTelepases({ pasadasValidas, vehiculosMap, contratosPorVehiculo });

            assert.equal(grupos.length, 1);
            assert.equal(grupos[0].idCliente, null);
            assert.equal(grupos[0].nombreCliente, "Sin cliente asignado");
            assert.match(grupos[0].advertencia, /No se encontró un contrato de alquiler activo/);
            assert.equal(grupos[0].totalNeto, 3500);
        });
    });

    describe("3. Contratos abiertos / indefinidos (fecha_hasta es null)", () => {
        const idVehiculo = 30;
        const vehiculosMap = new Map([["CC333CC", idVehiculo]]);
        const contratosPorVehiculo = new Map([
            [idVehiculo, [
                {
                    id: 3,
                    id_cliente: 103,
                    nombre: "Empresa",
                    apellido: "",
                    razon_social: "Transportes SA",
                    fecha_desde: "2026-09-01",
                    fecha_hasta: null
                }
            ]]
        ]);

        it("debe imputar pasadas posteriores a fecha_desde al contrato abierto", () => {
            const pasadasValidas = [
                {
                    patente: "CC333CC",
                    dateObj: new Date(Date.UTC(2026, 8, 25)), // 2026-09-25
                    tarifa: 1200,
                    bonificacion: 0,
                    montoNeto: 1200,
                    chofer: "Transportes SA",
                    autopista: "AUSA"
                }
            ];

            const grupos = agruparPasadasTelepases({ pasadasValidas, vehiculosMap, contratosPorVehiculo });

            assert.equal(grupos.length, 1);
            assert.equal(grupos[0].idCliente, 103);
            assert.equal(grupos[0].esEmpresa, true);
            assert.equal(grupos[0].advertencia, null);
        });

        it("debe dejar sin contrato pasadas previas al inicio del contrato abierto", () => {
            const pasadasValidas = [
                {
                    patente: "CC333CC",
                    dateObj: new Date(Date.UTC(2026, 7, 28)), // 2026-08-28 (anterior al contrato)
                    tarifa: 900,
                    bonificacion: 0,
                    montoNeto: 900,
                    chofer: "S/D",
                    autopista: "AUSA"
                }
            ];

            const grupos = agruparPasadasTelepases({ pasadasValidas, vehiculosMap, contratosPorVehiculo });

            assert.equal(grupos.length, 1);
            assert.equal(grupos[0].idCliente, null);
            assert.notEqual(grupos[0].advertencia, null);
        });
    });

    describe("4. Múltiples vehículos en la misma carga (Mix de escenarios)", () => {
        const vehiculosMap = new Map([
            ["AUTO1", 1],
            ["AUTO2", 2],
            ["AUTO3", 3]
            // "AUTO4" NO existe en el sistema
        ]);

        const contratosPorVehiculo = new Map([
            // AUTO1: 1 solo contrato todo el mes
            [1, [{ id: 10, id_cliente: 201, nombre: "Juan", apellido: "Mono", fecha_desde: "2026-09-01", fecha_hasta: "2026-09-30" }]],
            // AUTO2: 2 contratos (rotación)
            [2, [
                { id: 20, id_cliente: 202, nombre: "Pedro", apellido: "Primero", fecha_desde: "2026-09-01", fecha_hasta: "2026-09-10" },
                { id: 21, id_cliente: 203, nombre: "María", apellido: "Segunda", fecha_desde: "2026-09-11", fecha_hasta: "2026-09-30" }
            ]]
            // AUTO3: no tiene contratos
        ]);

        it("debe generar el desglose correcto para cada vehículo según sus contratos", () => {
            const pasadasValidas = [
                // AUTO1: 2 pasadas
                { patente: "AUTO1", dateObj: new Date(Date.UTC(2026, 8, 2)), tarifa: 100, bonificacion: 0, montoNeto: 100, chofer: "Juan" },
                { patente: "AUTO1", dateObj: new Date(Date.UTC(2026, 8, 20)), tarifa: 150, bonificacion: 0, montoNeto: 150, chofer: "Juan" },

                // AUTO2: pasadas divididas entre Pedro y María
                { patente: "AUTO2", dateObj: new Date(Date.UTC(2026, 8, 5)), tarifa: 300, bonificacion: 0, montoNeto: 300, chofer: "Pedro" },
                { patente: "AUTO2", dateObj: new Date(Date.UTC(2026, 8, 15)), tarifa: 400, bonificacion: 0, montoNeto: 400, chofer: "María" },

                // AUTO3: en flota pero sin contrato
                { patente: "AUTO3", dateObj: new Date(Date.UTC(2026, 8, 7)), tarifa: 500, bonificacion: 0, montoNeto: 500, chofer: "S/D" },

                // AUTO4: patente inexistente
                { patente: "AUTO4", dateObj: new Date(Date.UTC(2026, 8, 7)), tarifa: 600, bonificacion: 0, montoNeto: 600, chofer: "S/D" }
            ];

            const grupos = agruparPasadasTelepases({ pasadasValidas, vehiculosMap, contratosPorVehiculo });

            // Deberían haber 5 grupos en total:
            // 1 de AUTO1
            // 2 de AUTO2 (Pedro y María separados)
            // 1 de AUTO3 (Sin contrato)
            // 1 de AUTO4 (Vehículo no existe)
            assert.equal(grupos.length, 5);

            const gAuto1 = grupos.find(g => g.patente === "AUTO1");
            assert.equal(gAuto1.idCliente, 201);
            assert.equal(gAuto1.totalNeto, 250);
            assert.equal(gAuto1.cantidadPasadas, 2);

            const gAuto2Pedro = grupos.find(g => g.patente === "AUTO2" && g.idCliente === 202);
            assert.ok(gAuto2Pedro, "Debe existir grupo de Pedro para AUTO2");
            assert.equal(gAuto2Pedro.totalNeto, 300);

            const gAuto2Maria = grupos.find(g => g.patente === "AUTO2" && g.idCliente === 203);
            assert.ok(gAuto2Maria, "Debe existir grupo de María para AUTO2");
            assert.equal(gAuto2Maria.totalNeto, 400);

            const gAuto3 = grupos.find(g => g.patente === "AUTO3");
            assert.equal(gAuto3.idCliente, null);
            assert.match(gAuto3.advertencia, /No se encontró un contrato/);

            const gAuto4 = grupos.find(g => g.patente === "AUTO4");
            assert.equal(gAuto4.idVehiculo, null);
            assert.equal(gAuto4.advertencia, "El vehículo no existe en el sistema");
        });
    });

    describe("5. Filtrado de tarifas $0 y parseos de montos", () => {
        it("parseMonto debe procesar formatos monetarios argentinos e internacionales", () => {
            assert.equal(parseMonto(1500.5), 1500.5);
            assert.equal(parseMonto("1.500,50"), 1500.5);
            assert.equal(parseMonto("$ 25.977,62"), 25977.62);
            assert.equal(parseMonto("0,00"), 0);
            assert.equal(parseMonto(null), 0);
        });

        it("parseFechaTelepase debe reconocer seriales de Excel, DD/MM/YYYY y YYYY-MM-DD", () => {
            const desdeExcel = parseFechaTelepase(46267); // 02/09/2026
            assert.ok(desdeExcel instanceof Date);
            assert.equal(formatFechaYYYYMMDD(desdeExcel), "2026-09-02");

            const desdeSlash = parseFechaTelepase("02/09/2026");
            assert.equal(formatFechaYYYYMMDD(desdeSlash), "2026-09-02");

            const desdeIso = parseFechaTelepase("2026-09-02");
            assert.equal(formatFechaYYYYMMDD(desdeIso), "2026-09-02");
        });
    });

    describe("6. Regresión con caso real de producción (AI288DX y AI288CV)", () => {
        const vehiculosMap = new Map([
            ["AI288DX", 501],
            ["AI288CV", 502]
        ]);

        const contratosPorVehiculo = new Map([
            [501, [
                { id: 1, id_cliente: 301, nombre: "ATILIO MIGUEL", apellido: "QUAINI", fecha_desde: "2026-01-01", fecha_hasta: "2026-09-02" },
                { id: 2, id_cliente: 302, nombre: "LEANDRO", apellido: "BARRETO MALDONADO", fecha_desde: "2026-09-03", fecha_hasta: null }
            ]],
            [502, [
                { id: 3, id_cliente: 303, nombre: "DENIS JOSUE", apellido: "BRICEÑO MONSALVE", fecha_desde: "2026-01-01", fecha_hasta: "2026-09-01" },
                { id: 4, id_cliente: 304, nombre: "ROBERTO FABIAN", apellido: "ROJAS", fecha_desde: "2026-09-02", fecha_hasta: null }
            ]]
        ]);

        it("debe dividir AI288DX exactamente entre Atilio ($25.977,62) y Leandro ($24.855,48)", () => {
            // Simulamos las pasadas reales agrupadas por fecha
            const pasadasValidas = [
                // Hasta 02/09 (Atilio): total $25.977,62
                { patente: "AI288DX", dateObj: parseFechaTelepase("28/08/2026"), tarifa: 10000, bonificacion: 0, montoNeto: 10000, chofer: "Atilio" },
                { patente: "AI288DX", dateObj: parseFechaTelepase("02/09/2026"), tarifa: 15977.62, bonificacion: 0, montoNeto: 15977.62, chofer: "Atilio" },

                // Desde 03/09 (Leandro): total $24.855,48
                { patente: "AI288DX", dateObj: parseFechaTelepase("04/09/2026"), tarifa: 14855.48, bonificacion: 0, montoNeto: 14855.48, chofer: "Leandro" },
                { patente: "AI288DX", dateObj: parseFechaTelepase("07/09/2026"), tarifa: 10000, bonificacion: 0, montoNeto: 10000, chofer: "Leandro" }
            ];

            const grupos = agruparPasadasTelepases({ pasadasValidas, vehiculosMap, contratosPorVehiculo });

            assert.equal(grupos.length, 2);

            const gAtilio = grupos.find(g => g.idCliente === 301);
            const gLeandro = grupos.find(g => g.idCliente === 302);

            assert.ok(gAtilio);
            assert.ok(gLeandro);

            assert.equal(gAtilio.totalNeto.toFixed(2), "25977.62");
            assert.equal(gLeandro.totalNeto.toFixed(2), "24855.48");
        });

        it("debe dividir AI288CV exactamente entre Denis ($4.610,98) y Roberto ($6.671,74)", () => {
            const pasadasValidas = [
                // Hasta 01/09 (Denis)
                { patente: "AI288CV", dateObj: parseFechaTelepase("30/08/2026"), tarifa: 4610.98, bonificacion: 0, montoNeto: 4610.98, chofer: "Denis" },
                // Desde 02/09 (Roberto)
                { patente: "AI288CV", dateObj: parseFechaTelepase("02/09/2026"), tarifa: 6671.74, bonificacion: 0, montoNeto: 6671.74, chofer: "Roberto" }
            ];

            const grupos = agruparPasadasTelepases({ pasadasValidas, vehiculosMap, contratosPorVehiculo });

            assert.equal(grupos.length, 2);

            const gDenis = grupos.find(g => g.idCliente === 303);
            const gRoberto = grupos.find(g => g.idCliente === 304);

            assert.ok(gDenis);
            assert.ok(gRoberto);

            assert.equal(gDenis.totalNeto.toFixed(2), "4610.98");
            assert.equal(gRoberto.totalNeto.toFixed(2), "6671.74");
        });
    });
});
