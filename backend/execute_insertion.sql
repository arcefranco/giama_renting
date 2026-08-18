USE pa7_giama_renting;

CREATE TEMPORARY TABLE tmp_factura SELECT * FROM facturas WHERE Id = 5727;
UPDATE tmp_factura SET Id = NULL, NumeroFacturaEmitida = 1821, CAE = '86294975564133';
INSERT INTO facturas SELECT * FROM tmp_factura;
SET @nuevo_id_factura = LAST_INSERT_ID();

CREATE TEMPORARY TABLE tmp_items SELECT * FROM facturasitems WHERE IdFactura = 5727;
UPDATE tmp_items SET Id = NULL, IdFactura = @nuevo_id_factura;
INSERT INTO facturasitems SELECT * FROM tmp_items;
SET @nuevo_id_item = LAST_INSERT_ID();

SET @nuevo_asiento = (SELECT MAX(NroAsiento) + 1 FROM c_movimientos);

CREATE TEMPORARY TABLE tmp_mov SELECT * FROM c_movimientos WHERE NroComprobante = '0000200001830' AND NroAsiento = 26177;
UPDATE tmp_mov SET ID = NULL, NroComprobante = '0000200001821', NroAsiento = @nuevo_asiento, Concepto = REPLACE(Concepto, '1830', '1821');
INSERT INTO c_movimientos SELECT * FROM tmp_mov;

SELECT 
  @nuevo_id_factura AS Nuevo_Id_Factura, 
  @nuevo_id_item AS Nuevo_Id_Item, 
  @nuevo_asiento AS Nuevo_Asiento,
  (SELECT GROUP_CONCAT(ID) FROM c_movimientos WHERE NroAsiento = @nuevo_asiento) AS Movimientos_Insertados;
