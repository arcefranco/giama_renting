USE pa7_giama_renting;
SELECT @nuevo_asiento := MAX(NroAsiento) + 1 FROM c_movimientos;
UPDATE c_movimientos SET NroAsiento = @nuevo_asiento WHERE ID IN (75160, 75161, 75162);
UPDATE facturas SET NroAsiento = @nuevo_asiento WHERE Id = 6211;
SELECT @nuevo_asiento AS Asiento_Corregido;
