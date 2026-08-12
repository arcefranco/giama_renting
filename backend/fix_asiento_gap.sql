USE pa7_giama_renting;
UPDATE c_movimientos SET NroAsiento = 28184 WHERE ID IN (75160, 75161, 75162);
UPDATE facturas SET NroAsiento = 28184 WHERE Id = 6211;
SELECT 28184 AS Asiento_Corregido_Definitivo;
