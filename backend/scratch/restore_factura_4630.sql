USE pa7_giama_renting;

-- 1. Obtener y actualizar NroAsiento
SELECT Valor INTO @nro_asiento FROM parametros WHERE Codigo = 'NUMA' AND Marca = 13 FOR UPDATE;
SET @nro_asiento = @nro_asiento + 1;
UPDATE parametros SET Valor = @nro_asiento WHERE Codigo = 'NUMA' AND Marca = 13;

-- 2. Obtener y actualizar NroAsientoSecundario
SELECT Valor INTO @nro_asiento_sec FROM parametros WHERE Codigo = 'NUMB' AND Marca = 13 FOR UPDATE;
SET @nro_asiento_sec = @nro_asiento_sec + 1;
UPDATE parametros SET Valor = @nro_asiento_sec WHERE Codigo = 'NUMB' AND Marca = 13;

-- 3. Fijar el código de cliente
SET @cod_cliente = 573;

-- 4. Insertar la Factura A 2-4630 con los datos del Excel / ARCA
INSERT INTO facturas 
(Marca, Numero, ImporteBruto, PorcentajeIva, Iva, FechaAltaRegistro, UsuarioAltaRegistro, PuntoVenta, NumeroFacturaEmitida, Tipo, Neto, Total, FechaComprobante, CodigoCliente, OrigenCbte, NroAsiento, NroAsiento2, CAE, VtoCAE, Resultado_Afip) 
VALUES 
(13, 4630, 9324.56, 21.00, 1958.16, '2026-09-15 00:00:00', 'admin', 2, '0000200004630', 'FA', 9324.56, 11282.72, '2026-09-15 00:00:00', @cod_cliente, 'API', @nro_asiento, @nro_asiento_sec, '83379294971309', '2026-09-25 00:00:00', 'A');

SET @id_factura = LAST_INSERT_ID();

-- 5. Insertar Factura Item
INSERT INTO facturasitems 
(IdFactura, TipoAlicuota, Descripcion, Cantidad, PrecioUnitario, Porcentaje, Subtotal)
VALUES 
(@id_factura, 'S', 'Telepases (Recupero) - roberto fabian rojas', 1, 9324.56, 21.00, 11282.72);

-- 6. Insertar en clientesfacturacion_ctasctes (La Deuda)
INSERT INTO clientesfacturacion_ctasctes 
(Cliente, Fecha, Descripcion, DH, Total, Tipo, Comprobante, NroAsiento, AsientoSecundario, UsuarioAltaRegistro, FechaAltaRegistro) 
VALUES 
(@cod_cliente, '2026-09-15 00:00:00', 'FACTURA A N° 00002-00004630', 'D', 11282.72, 'FA', '0000200004630', @nro_asiento, @nro_asiento_sec, 'admin', NOW());

-- 7. Insertar en c_movimientos (Con cuenta 410110 de Telepases)
INSERT INTO c_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, AsientoSecundario, TipoComprobante)
VALUES 
('2026-09-15', @nro_asiento, '110310', 'D', 11282.72, 'Factura A Nº 00002-00004630 - roberto fabian rojas', '0000200004630', @nro_asiento_sec, 'FA'),
('2026-09-15', @nro_asiento, '410110', 'H', 9324.56, 'Factura A Nº 00002-00004630 - roberto fabian rojas', '0000200004630', @nro_asiento_sec, 'FA'),
('2026-09-15', @nro_asiento, '210201', 'H', 1958.16, 'Factura A Nº 00002-00004630 - roberto fabian rojas', '0000200004630', @nro_asiento_sec, 'FA');

-- 8. Insertar en c2_movimientos (Libro secundario)
INSERT INTO c2_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, TipoComprobante)
VALUES 
('2026-09-15', @nro_asiento, '110310', 'D', 11282.72, 'Factura A Nº 00002-00004630 - roberto fabian rojas', '0000200004630', 'FA'),
('2026-09-15', @nro_asiento, '410110', 'H', 9324.56, 'Factura A Nº 00002-00004630 - roberto fabian rojas', '0000200004630', 'FA'),
('2026-09-15', @nro_asiento, '210201', 'H', 1958.16, 'Factura A Nº 00002-00004630 - roberto fabian rojas', '0000200004630', 'FA');
