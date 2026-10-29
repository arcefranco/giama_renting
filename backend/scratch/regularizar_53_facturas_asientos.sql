-- ==============================================================================
-- SCRIPT DE REGULARIZACIÓN: 53 FACTURAS DESFASADAS Y ASIENTOS SECUNDARIOS (c2_)
-- Entorno: pa7_giama_renting (Producción)
-- Total comprobantes a regularizar: 53 (49 de PV 2 + 4 de PV 3)
-- ==============================================================================

USE pa7_giama_renting;

START TRANSACTION;

-- ==============================================================================
-- 1. CORRECCIÓN EN TABLA facturas (Alinear NroAsiento y NroAsiento2 a los reales)
-- ==============================================================================

-- A) Lote de Telepases del 27/10/2026 (49 Facturas de PV 2, Ids 8200 a 8248)
UPDATE facturas SET NroAsiento = 36867, NroAsiento2 = 34387 WHERE Id = 8200;
UPDATE facturas SET NroAsiento = 36868, NroAsiento2 = 34388 WHERE Id = 8201;
UPDATE facturas SET NroAsiento = 36869, NroAsiento2 = 34389 WHERE Id = 8202;
UPDATE facturas SET NroAsiento = 36870, NroAsiento2 = 34390 WHERE Id = 8203;
UPDATE facturas SET NroAsiento = 36871, NroAsiento2 = 34391 WHERE Id = 8204;
UPDATE facturas SET NroAsiento = 36872, NroAsiento2 = 34392 WHERE Id = 8205;
UPDATE facturas SET NroAsiento = 36873, NroAsiento2 = 34393 WHERE Id = 8206;
UPDATE facturas SET NroAsiento = 36874, NroAsiento2 = 34394 WHERE Id = 8207;
UPDATE facturas SET NroAsiento = 36875, NroAsiento2 = 34395 WHERE Id = 8208;
UPDATE facturas SET NroAsiento = 36876, NroAsiento2 = 34396 WHERE Id = 8209;
UPDATE facturas SET NroAsiento = 36877, NroAsiento2 = 34397 WHERE Id = 8210;
UPDATE facturas SET NroAsiento = 36878, NroAsiento2 = 34398 WHERE Id = 8211;
UPDATE facturas SET NroAsiento = 36879, NroAsiento2 = 34399 WHERE Id = 8212;
UPDATE facturas SET NroAsiento = 36880, NroAsiento2 = 34400 WHERE Id = 8213;
UPDATE facturas SET NroAsiento = 36881, NroAsiento2 = 34401 WHERE Id = 8214;
UPDATE facturas SET NroAsiento = 36882, NroAsiento2 = 34402 WHERE Id = 8215;
UPDATE facturas SET NroAsiento = 36883, NroAsiento2 = 34403 WHERE Id = 8216;
UPDATE facturas SET NroAsiento = 36884, NroAsiento2 = 34404 WHERE Id = 8217;
UPDATE facturas SET NroAsiento = 36885, NroAsiento2 = 34405 WHERE Id = 8218;
UPDATE facturas SET NroAsiento = 36886, NroAsiento2 = 34406 WHERE Id = 8219;
UPDATE facturas SET NroAsiento = 36887, NroAsiento2 = 34407 WHERE Id = 8220;
UPDATE facturas SET NroAsiento = 36888, NroAsiento2 = 34408 WHERE Id = 8221;
UPDATE facturas SET NroAsiento = 36889, NroAsiento2 = 34409 WHERE Id = 8222;
UPDATE facturas SET NroAsiento = 36890, NroAsiento2 = 34410 WHERE Id = 8223;
UPDATE facturas SET NroAsiento = 36891, NroAsiento2 = 34411 WHERE Id = 8224;
UPDATE facturas SET NroAsiento = 36892, NroAsiento2 = 34412 WHERE Id = 8225;
UPDATE facturas SET NroAsiento = 36893, NroAsiento2 = 34413 WHERE Id = 8226;
UPDATE facturas SET NroAsiento = 36894, NroAsiento2 = 34414 WHERE Id = 8227;
UPDATE facturas SET NroAsiento = 36895, NroAsiento2 = 34415 WHERE Id = 8228;
UPDATE facturas SET NroAsiento = 36896, NroAsiento2 = 34416 WHERE Id = 8229;
UPDATE facturas SET NroAsiento = 36897, NroAsiento2 = 34417 WHERE Id = 8230;
UPDATE facturas SET NroAsiento = 36898, NroAsiento2 = 34418 WHERE Id = 8231;
UPDATE facturas SET NroAsiento = 36899, NroAsiento2 = 34419 WHERE Id = 8232;
UPDATE facturas SET NroAsiento = 36900, NroAsiento2 = 34420 WHERE Id = 8233;
UPDATE facturas SET NroAsiento = 36901, NroAsiento2 = 34421 WHERE Id = 8234;
UPDATE facturas SET NroAsiento = 36902, NroAsiento2 = 34422 WHERE Id = 8235;
UPDATE facturas SET NroAsiento = 36903, NroAsiento2 = 34423 WHERE Id = 8236;
UPDATE facturas SET NroAsiento = 36904, NroAsiento2 = 34424 WHERE Id = 8237;
UPDATE facturas SET NroAsiento = 36905, NroAsiento2 = 34425 WHERE Id = 8238;
UPDATE facturas SET NroAsiento = 36906, NroAsiento2 = 34426 WHERE Id = 8239;
UPDATE facturas SET NroAsiento = 36907, NroAsiento2 = 34427 WHERE Id = 8240;
UPDATE facturas SET NroAsiento = 36908, NroAsiento2 = 34428 WHERE Id = 8241;
UPDATE facturas SET NroAsiento = 36909, NroAsiento2 = 34429 WHERE Id = 8242;
UPDATE facturas SET NroAsiento = 36910, NroAsiento2 = 34430 WHERE Id = 8243;
UPDATE facturas SET NroAsiento = 36911, NroAsiento2 = 34431 WHERE Id = 8244;
UPDATE facturas SET NroAsiento = 36912, NroAsiento2 = 34432 WHERE Id = 8245;
UPDATE facturas SET NroAsiento = 36913, NroAsiento2 = 34433 WHERE Id = 8246;
UPDATE facturas SET NroAsiento = 36914, NroAsiento2 = 34434 WHERE Id = 8247;
UPDATE facturas SET NroAsiento = 36915, NroAsiento2 = 34435 WHERE Id = 8248;

-- B) Lote de Venta de Vehículos Usados del 20/10/2026 (4 Facturas de PV 3, Ids 8113 a 8116)
UPDATE facturas SET NroAsiento = 36406, NroAsiento2 = 33942 WHERE Id = 8113;
UPDATE facturas SET NroAsiento = 36408, NroAsiento2 = 33944 WHERE Id = 8114;
UPDATE facturas SET NroAsiento = 36409, NroAsiento2 = 33945 WHERE Id = 8115;
UPDATE facturas SET NroAsiento = 36421, NroAsiento2 = 33957 WHERE Id = 8116;

-- ==============================================================================
-- 2. GENERACIÓN DE ASIENTOS SECUNDARIOS EN c2_movimientos
-- Espeja las líneas de c_movimientos asociadas a las 53 facturas, asignando
-- como NroAsiento el AsientoSecundario original.
-- ==============================================================================

INSERT INTO c2_movimientos (
  Fecha,
  NroAsiento,
  Cuenta,
  DH,
  Importe,
  Concepto,
  NroComprobante,
  TipoComprobante,
  FechaAltaRegistro,
  UsuarioAltaRegistro
)
SELECT 
  cm.Fecha,
  cm.AsientoSecundario AS NroAsiento,
  cm.Cuenta,
  cm.DH,
  cm.Importe,
  cm.Concepto,
  cm.NroComprobante,
  cm.TipoComprobante,
  NOW() AS FechaAltaRegistro,
  'regularizacion_sistemas' AS UsuarioAltaRegistro
FROM c_movimientos cm
WHERE cm.NroAsiento IN (
  -- 49 asientos de telepases
  36867, 36868, 36869, 36870, 36871, 36872, 36873, 36874, 36875, 36876,
  36877, 36878, 36879, 36880, 36881, 36882, 36883, 36884, 36885, 36886,
  36887, 36888, 36889, 36890, 36891, 36892, 36893, 36894, 36895, 36896,
  36897, 36898, 36899, 36900, 36901, 36902, 36903, 36904, 36905, 36906,
  36907, 36908, 36909, 36910, 36911, 36912, 36913, 36914, 36915,
  -- 4 asientos de venta de vehículos
  36406, 36408, 36409, 36421
);

-- ==============================================================================
-- 3. VERIFICACIÓN FINAL ANTES DE COMMIT
-- ==============================================================================
-- Chequeo A: Las 53 facturas ahora deben encontrar su asiento exacto en c_movimientos
-- SELECT COUNT(*) FROM facturas f JOIN c_movimientos cm ON cm.NroAsiento = f.NroAsiento WHERE f.Id IN (8113,8114,8115,8116) OR f.Id BETWEEN 8200 AND 8248; -- Debe dar >= 53

-- Chequeo B: Las 53 facturas ahora deben encontrar su asiento exacto en c2_movimientos
-- SELECT COUNT(DISTINCT NroAsiento) FROM c2_movimientos WHERE NroAsiento IN (33942, 33944, 33945, 33957) OR (NroAsiento BETWEEN 34387 AND 34435); -- Debe dar 53

COMMIT;
