USE pa7_giama_renting;

-- Actualizar facturasitems
UPDATE facturasitems 
SET Descripcion = 'Excedentes Pasadas Telepase CUIT/CUIL: 20288809799 - ASIENTO: 34807'
WHERE IdFactura = (SELECT ID FROM facturas WHERE Numero = 4630 AND PuntoVenta = 2 LIMIT 1);

-- Actualizar c_movimientos
UPDATE c_movimientos
SET Concepto = 'Telepases (1 vehículos) Nombre: roberto fabian rojas FACTURA: 4630'
WHERE NroAsiento = 34807;

-- Actualizar c2_movimientos
UPDATE c2_movimientos
SET Concepto = 'Telepases (1 vehículos) Nombre: roberto fabian rojas FACTURA: 4630'
WHERE NroAsiento = 34807;

