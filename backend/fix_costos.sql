USE giama_renting;
CREATE TEMPORARY TABLE tmp_costos SELECT * FROM costos_ingresos WHERE id = 5868;
UPDATE tmp_costos SET id = NULL, id_factura_pa6 = 6211;
INSERT INTO costos_ingresos SELECT * FROM tmp_costos;
SELECT LAST_INSERT_ID() AS Nuevo_Id_Costo;
DROP TEMPORARY TABLE tmp_costos;
