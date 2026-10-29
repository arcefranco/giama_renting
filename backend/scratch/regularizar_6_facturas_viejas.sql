-- ==============================================================================
-- SCRIPT DE REGULARIZACIÓN: 6 FACTURAS HISTÓRICAS (CABIFY Y OTRAS)
-- Entorno: pa7_giama_renting (Producción)
-- Total comprobantes: 6
-- ==============================================================================

USE pa7_giama_renting;

START TRANSACTION;

-- 1. Factura FA 2-803 ($268.441,83) - Rhoger Giovanny Blanco Uribe
UPDATE facturas SET NroAsiento = 10053, NroAsiento2 = 10046 WHERE Id = 1650;

-- 2. Facturas Cabify FA 1-7 a 1-10 (Noviembre 2025)
UPDATE facturas SET NroAsiento = 10280, NroAsiento2 = 10273 WHERE Id = 2327;
UPDATE facturas SET NroAsiento = 10281, NroAsiento2 = 10274 WHERE Id = 2328;
UPDATE facturas SET NroAsiento = 10282, NroAsiento2 = 10275 WHERE Id = 2329;
UPDATE facturas SET NroAsiento = 10283, NroAsiento2 = 10276 WHERE Id = 2330;

-- 3. Factura Cabify FA 1-20 ($7.646.540,00 - Junio 2026)
UPDATE facturas SET NroAsiento = 22201, NroAsiento2 = 20925 WHERE Id = 4903;

COMMIT;
