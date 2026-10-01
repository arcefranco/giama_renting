USE pa7_giama_renting;

-- Restaurar la deuda en la cuenta corriente
INSERT INTO clientesfacturacion_ctasctes 
(Id, Cliente, Fecha, Descripcion, DH, Total, Tipo, Comprobante, NroAsiento, AsientoSecundario, UsuarioAltaRegistro, FechaAltaRegistro) 
VALUES 
(7011, 573, '2026-09-15 00:00:00', 'FACTURA A N° 00002-00004630', 'D', 11282.72, 'FA', '0000200004630', 33052, 30825, 'maquino', '2026-09-16 11:17:09');

-- Restaurar el asiento contable
INSERT INTO c_movimientos 
(Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante, AsientoSecundario, TipoComprobante)
VALUES 
('2026-09-15', 33052, '110310', 'D', 11282.72, 'Telepases (1 vehículos) Nombre: roberto fabian rojas CUIT/CUIL: 20123456789 FACTURA: 7283', '0000200004630', 30825, 'FA'),
('2026-09-15', 33052, '410101', 'H', 9324.56, 'Telepase AI288CV Nombre: roberto fabian rojas CUIT/CUIL: 20123456789 FACTURA: 7283', '0000200004630', 30825, 'FA'),
('2026-09-15', 33052, '210201', 'H', 1958.16, 'Telepases (1 vehículos) Nombre: roberto fabian rojas CUIT/CUIL: 20123456789 FACTURA: 7283', '0000200004630', 30825, 'FA');
