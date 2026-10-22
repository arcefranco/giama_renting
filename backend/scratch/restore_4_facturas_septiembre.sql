USE pa7_giama_renting;

START TRANSACTION;

-- ==============================================================================
-- 1. OBTENER Y RESERVAR 4 NÚMEROS DE ASIENTOS CONSECUTIVOS (NUMA y NUMB)
-- ==============================================================================
SELECT Valor INTO @base_a FROM parametros WHERE Codigo = 'NUMA' AND Marca = 13 FOR UPDATE;
SELECT Valor INTO @base_b FROM parametros WHERE Codigo = 'NUMB' AND Marca = 13 FOR UPDATE;

-- Asientos para Factura 4643
SET @asiento_4643_a = @base_a + 1;
SET @asiento_4643_b = @base_b + 1;

-- Asientos para Factura 4567
SET @asiento_4567_a = @base_a + 2;
SET @asiento_4567_b = @base_b + 2;

-- Asientos para Factura 4743
SET @asiento_4743_a = @base_a + 3;
SET @asiento_4743_b = @base_b + 3;

-- Asientos para Factura 4800
SET @asiento_4800_a = @base_a + 4;
SET @asiento_4800_b = @base_b + 4;

-- Actualizar los contadores en parametros
UPDATE parametros SET Valor = @base_a + 4 WHERE Codigo = 'NUMA' AND Marca = 13;
UPDATE parametros SET Valor = @base_b + 4 WHERE Codigo = 'NUMB' AND Marca = 13;


-- ==============================================================================
-- 2. FACTURA 4643 (16/09/2026 - Alquiler Poquechoque)
-- ==============================================================================
INSERT INTO facturas 
(Marca, Numero, ImporteBruto, PorcentajeIva, Iva, FechaAltaRegistro, UsuarioAltaRegistro, PuntoVenta, NumeroFacturaEmitida, Tipo, Neto, Total, FechaComprobante, CodigoCliente, OrigenCbte, NroAsiento, NroAsiento2, CAE, VtoCAE, Resultado_Afip) 
VALUES 
(13, 4643, 454545.45, 21.00, 95454.54, NOW(), 'admin', 2, 4643, 'FA', 454545.45, 550000.00, '2026-09-16 00:00:00', 518, 'API', @asiento_4643_a, @asiento_4643_b, '86383442168250', '2026-09-26 00:00:00', 'A');

SET @id_factura_4643 = LAST_INSERT_ID();

INSERT INTO facturasitems 
(IdFactura, TipoAlicuota, Descripcion, Cantidad, PrecioUnitario, Porcentaje, Subtotal)
VALUES 
(@id_factura_4643, 'S', 'Alquiler - POQUECHOQUE MURUCHI - Dominio: AI288CS', 1, 454545.45, 21.00, 550000.00);

-- c_movimientos
INSERT INTO c_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, AsientoSecundario, TipoComprobante, FechaAltaRegistro)
VALUES 
('2026-09-16 00:00:00', @asiento_4643_a, '110310', 'D', 550000.00, 'Factura A Nº 00002-00004643 - DEMETRIO  POQUECHOQUE MURUCHI', '0000200004643', @asiento_4643_b, 'FA', NOW()),
('2026-09-16 00:00:00', @asiento_4643_a, '410101', 'H', 454545.45, 'Factura A Nº 00002-00004643 - DEMETRIO  POQUECHOQUE MURUCHI', '0000200004643', @asiento_4643_b, 'FA', NOW()),
('2026-09-16 00:00:00', @asiento_4643_a, '210201', 'H',  95454.54, 'Factura A Nº 00002-00004643 - DEMETRIO  POQUECHOQUE MURUCHI', '0000200004643', @asiento_4643_b, 'FA', NOW());

-- c2_movimientos
INSERT INTO c2_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, TipoComprobante, FechaAltaRegistro)
VALUES 
('2026-09-16 00:00:00', @asiento_4643_b, '110310', 'D', 550000.00, 'Factura A Nº 00002-00004643 - DEMETRIO  POQUECHOQUE MURUCHI', '0000200004643', 'FA', NOW()),
('2026-09-16 00:00:00', @asiento_4643_b, '410101', 'H', 454545.45, 'Factura A Nº 00002-00004643 - DEMETRIO  POQUECHOQUE MURUCHI', '0000200004643', 'FA', NOW()),
('2026-09-16 00:00:00', @asiento_4643_b, '210201', 'H',  95454.54, 'Factura A Nº 00002-00004643 - DEMETRIO  POQUECHOQUE MURUCHI', '0000200004643', 'FA', NOW());

-- Cuenta corriente (Insertar deuda de la 4643)
INSERT INTO clientesfacturacion_ctasctes 
(Cliente, Fecha, Descripcion, DH, Total, Tipo, Comprobante, NroAsiento, AsientoSecundario, UsuarioAltaRegistro, FechaAltaRegistro)
VALUES 
(518, '2026-09-16 00:00:00', 'FACTURA A N° 00002-00004643', 'D', 550000.00, 'FA', '0000200004643', @asiento_4643_a, @asiento_4643_b, 'admin', NOW());


-- ==============================================================================
-- 3. FACTURA 4567 (15/09/2026 - Telepase Leandro Barreto)
-- ==============================================================================
INSERT INTO facturas 
(Marca, Numero, ImporteBruto, PorcentajeIva, Iva, FechaAltaRegistro, UsuarioAltaRegistro, PuntoVenta, NumeroFacturaEmitida, Tipo, Neto, Total, FechaComprobante, CodigoCliente, OrigenCbte, NroAsiento, NroAsiento2, CAE, VtoCAE, Resultado_Afip) 
VALUES 
(13, 4567, 42010.83, 21.00, 8822.27, NOW(), 'admin', 2, 4567, 'FA', 42010.83, 50833.10, '2026-09-15 00:00:00', 592, 'API', @asiento_4567_a, @asiento_4567_b, '86373274085451', '2026-09-25 00:00:00', 'A');

SET @id_factura_4567 = LAST_INSERT_ID();

INSERT INTO facturasitems 
(IdFactura, TipoAlicuota, Descripcion, Cantidad, PrecioUnitario, Porcentaje, Subtotal)
VALUES 
(@id_factura_4567, 'S', 'Telepases - Leandro Barreto Maldonado Flash & Go', 1, 42010.83, 21.00, 50833.10);

-- c_movimientos
INSERT INTO c_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, AsientoSecundario, TipoComprobante, FechaAltaRegistro)
VALUES 
('2026-09-15 00:00:00', @asiento_4567_a, '110310', 'D', 50833.10, 'Factura A Nº 00002-00004567 - Leandro Barreto Maldonado Flash & Go', '0000200004567', @asiento_4567_b, 'FA', NOW()),
('2026-09-15 00:00:00', @asiento_4567_a, '410110', 'H', 42010.83, 'Factura A Nº 00002-00004567 - Leandro Barreto Maldonado Flash & Go', '0000200004567', @asiento_4567_b, 'FA', NOW()),
('2026-09-15 00:00:00', @asiento_4567_a, '210201', 'H',  8822.27, 'Factura A Nº 00002-00004567 - Leandro Barreto Maldonado Flash & Go', '0000200004567', @asiento_4567_b, 'FA', NOW());

-- c2_movimientos
INSERT INTO c2_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, TipoComprobante, FechaAltaRegistro)
VALUES 
('2026-09-15 00:00:00', @asiento_4567_b, '110310', 'D', 50833.10, 'Factura A Nº 00002-00004567 - Leandro Barreto Maldonado Flash & Go', '0000200004567', 'FA', NOW()),
('2026-09-15 00:00:00', @asiento_4567_b, '410110', 'H', 42010.83, 'Factura A Nº 00002-00004567 - Leandro Barreto Maldonado Flash & Go', '0000200004567', 'FA', NOW()),
('2026-09-15 00:00:00', @asiento_4567_b, '210201', 'H',  8822.27, 'Factura A Nº 00002-00004567 - Leandro Barreto Maldonado Flash & Go', '0000200004567', 'FA', NOW());

-- Actualizar cuenta corriente para vincular al nuevo asiento
UPDATE clientesfacturacion_ctasctes 
SET NroAsiento = @asiento_4567_a, AsientoSecundario = @asiento_4567_b 
WHERE Id = 6937;


-- ==============================================================================
-- 4. FACTURA 4743 (22/09/2026 - Telepase Leandro Barreto)
-- ==============================================================================
INSERT INTO facturas 
(Marca, Numero, ImporteBruto, PorcentajeIva, Iva, FechaAltaRegistro, UsuarioAltaRegistro, PuntoVenta, NumeroFacturaEmitida, Tipo, Neto, Total, FechaComprobante, CodigoCliente, OrigenCbte, NroAsiento, NroAsiento2, CAE, VtoCAE, Resultado_Afip) 
VALUES 
(13, 4743, 34588.57, 21.00, 7263.60, NOW(), 'admin', 2, 4743, 'FA', 34588.57, 41852.17, '2026-09-22 00:00:00', 592, 'API', @asiento_4743_a, @asiento_4743_b, '86384358833983', '2026-10-02 00:00:00', 'A');

SET @id_factura_4743 = LAST_INSERT_ID();

INSERT INTO facturasitems 
(IdFactura, TipoAlicuota, Descripcion, Cantidad, PrecioUnitario, Porcentaje, Subtotal)
VALUES 
(@id_factura_4743, 'S', 'Telepases - Leandro Barreto Maldonado Flash & Go', 1, 34588.57, 21.00, 41852.17);

-- c_movimientos
INSERT INTO c_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, AsientoSecundario, TipoComprobante, FechaAltaRegistro)
VALUES 
('2026-09-22 00:00:00', @asiento_4743_a, '110310', 'D', 41852.17, 'Factura A Nº 00002-00004743 - Leandro Barreto Maldonado Flash & Go', '0000200004743', @asiento_4743_b, 'FA', NOW()),
('2026-09-22 00:00:00', @asiento_4743_a, '410110', 'H', 34588.57, 'Factura A Nº 00002-00004743 - Leandro Barreto Maldonado Flash & Go', '0000200004743', @asiento_4743_b, 'FA', NOW()),
('2026-09-22 00:00:00', @asiento_4743_a, '210201', 'H',  7263.60, 'Factura A Nº 00002-00004743 - Leandro Barreto Maldonado Flash & Go', '0000200004743', @asiento_4743_b, 'FA', NOW());

-- c2_movimientos
INSERT INTO c2_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, TipoComprobante, FechaAltaRegistro)
VALUES 
('2026-09-22 00:00:00', @asiento_4743_b, '110310', 'D', 41852.17, 'Factura A Nº 00002-00004743 - Leandro Barreto Maldonado Flash & Go', '0000200004743', 'FA', NOW()),
('2026-09-22 00:00:00', @asiento_4743_b, '410110', 'H', 34588.57, 'Factura A Nº 00002-00004743 - Leandro Barreto Maldonado Flash & Go', '0000200004743', 'FA', NOW()),
('2026-09-22 00:00:00', @asiento_4743_b, '210201', 'H',  7263.60, 'Factura A Nº 00002-00004743 - Leandro Barreto Maldonado Flash & Go', '0000200004743', 'FA', NOW());

-- Actualizar cuenta corriente para vincular al nuevo asiento
UPDATE clientesfacturacion_ctasctes 
SET NroAsiento = @asiento_4743_a, AsientoSecundario = @asiento_4743_b 
WHERE Id = 7145;


-- ==============================================================================
-- 5. FACTURA 4800 (22/09/2026 - Telepase Roberto Rojas)
-- ==============================================================================
INSERT INTO facturas 
(Marca, Numero, ImporteBruto, PorcentajeIva, Iva, FechaAltaRegistro, UsuarioAltaRegistro, PuntoVenta, NumeroFacturaEmitida, Tipo, Neto, Total, FechaComprobante, CodigoCliente, OrigenCbte, NroAsiento, NroAsiento2, CAE, VtoCAE, Resultado_Afip) 
VALUES 
(13, 4800, 12763.45, 21.00, 2680.32, NOW(), 'admin', 2, 4800, 'FA', 12763.45, 15443.77, '2026-09-22 00:00:00', 573, 'API', @asiento_4800_a, @asiento_4800_b, '86384365171952', '2026-10-02 00:00:00', 'A');

SET @id_factura_4800 = LAST_INSERT_ID();

INSERT INTO facturasitems 
(IdFactura, TipoAlicuota, Descripcion, Cantidad, PrecioUnitario, Porcentaje, Subtotal)
VALUES 
(@id_factura_4800, 'S', 'Telepases - roberto fabian rojas', 1, 12763.45, 21.00, 15443.77);

-- c_movimientos
INSERT INTO c_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, AsientoSecundario, TipoComprobante, FechaAltaRegistro)
VALUES 
('2026-09-22 00:00:00', @asiento_4800_a, '110310', 'D', 15443.77, 'Factura A Nº 00002-00004800 - roberto fabian rojas', '0000200004800', @asiento_4800_b, 'FA', NOW()),
('2026-09-22 00:00:00', @asiento_4800_a, '410110', 'H', 12763.45, 'Factura A Nº 00002-00004800 - roberto fabian rojas', '0000200004800', @asiento_4800_b, 'FA', NOW()),
('2026-09-22 00:00:00', @asiento_4800_a, '210201', 'H',  2680.32, 'Factura A Nº 00002-00004800 - roberto fabian rojas', '0000200004800', @asiento_4800_b, 'FA', NOW());

-- c2_movimientos
INSERT INTO c2_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, TipoComprobante, FechaAltaRegistro)
VALUES 
('2026-09-22 00:00:00', @asiento_4800_b, '110310', 'D', 15443.77, 'Factura A Nº 00002-00004800 - roberto fabian rojas', '0000200004800', 'FA', NOW()),
('2026-09-22 00:00:00', @asiento_4800_b, '410110', 'H', 12763.45, 'Factura A Nº 00002-00004800 - roberto fabian rojas', '0000200004800', 'FA', NOW()),
('2026-09-22 00:00:00', @asiento_4800_b, '210201', 'H',  2680.32, 'Factura A Nº 00002-00004800 - roberto fabian rojas', '0000200004800', 'FA', NOW());

-- Actualizar cuenta corriente para vincular al nuevo asiento
UPDATE clientesfacturacion_ctasctes 
SET NroAsiento = @asiento_4800_a, AsientoSecundario = @asiento_4800_b 
WHERE Id = 7213;

COMMIT;
