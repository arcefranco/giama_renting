USE giama_renting;

SELECT 'AI210DP' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI210DP' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BX' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BX' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH387KY' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387KY' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325CC' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325CC' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BY' as patente, '2026-08-29' as min_date, '2026-09-05' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BY' 
AND ca.fecha_desde <= '2026-09-05'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AI288DY' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DY' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BJ' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BJ' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288CW' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288CW' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AI325BH' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BH' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH252SX' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252SX' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AI210DR' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI210DR' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BV' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BV' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH448TY' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH448TY' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325CB' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325CB' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288DX' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DX' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH387LI' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387LI' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BG' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BG' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH387LF' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387LF' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH645XD' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH645XD' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH252SV' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252SV' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288CU' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288CU' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288DZ' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DZ' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BU' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BU' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH191LX' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH191LX' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH502KC' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH502KC' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH502KG' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH502KG' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BB' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BB' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH252TO' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252TO' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288DF' as patente, '2026-08-28' as min_date, '2026-09-05' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DF' 
AND ca.fecha_desde <= '2026-09-05'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH448TP' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH448TP' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288DU' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DU' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AI325BO' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BO' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BE' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BE' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI210DQ' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI210DQ' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH387LD' as patente, '2026-08-28' as min_date, '2026-09-03' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387LD' 
AND ca.fecha_desde <= '2026-09-03'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BQ' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BQ' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH645XC' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH645XC' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH252TL' as patente, '2026-08-29' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252TL' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH387LH' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387LH' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH387LA' as patente, '2026-08-31' as min_date, '2026-09-02' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387LA' 
AND ca.fecha_desde <= '2026-09-02'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-31');

SELECT 'AI288DD' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DD' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH448UK' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH448UK' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH252ST' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252ST' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH502KB' as patente, '2026-08-30' as min_date, '2026-09-04' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH502KB' 
AND ca.fecha_desde <= '2026-09-04'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-30');

SELECT 'AI325BS' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BS' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BA' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BA' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH252TT' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252TT' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH252TP' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252TP' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288DB' as patente, '2026-09-05' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DB' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-05');

SELECT 'AH502KF' as patente, '2026-08-31' as min_date, '2026-08-31' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH502KF' 
AND ca.fecha_desde <= '2026-08-31'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-31');

SELECT 'AH645XB' as patente, '2026-08-29' as min_date, '2026-09-03' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH645XB' 
AND ca.fecha_desde <= '2026-09-03'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AI325CA' as patente, '2026-08-28' as min_date, '2026-09-05' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325CA' 
AND ca.fecha_desde <= '2026-09-05'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288CS' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288CS' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BT' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BT' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BK' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BK' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288DE' as patente, '2026-08-29' as min_date, '2026-09-05' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DE' 
AND ca.fecha_desde <= '2026-09-05'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH191LS' as patente, '2026-08-28' as min_date, '2026-09-05' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH191LS' 
AND ca.fecha_desde <= '2026-09-05'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH387LG' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387LG' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH387LJ' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387LJ' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH252SM' as patente, '2026-08-30' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252SM' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-30');

SELECT 'AI325BC' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BC' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH448UA' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH448UA' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH252TK' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252TK' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH387KZ' as patente, '2026-08-29' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387KZ' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AI288CR' as patente, '2026-09-02' as min_date, '2026-09-03' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288CR' 
AND ca.fecha_desde <= '2026-09-03'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-02');

SELECT 'AH387LM' as patente, '2026-08-28' as min_date, '2026-09-04' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387LM' 
AND ca.fecha_desde <= '2026-09-04'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288DC' as patente, '2026-09-01' as min_date, '2026-09-02' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DC' 
AND ca.fecha_desde <= '2026-09-02'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-01');

SELECT 'AI325BM' as patente, '2026-09-01' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BM' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-01');

SELECT 'AI325BD' as patente, '2026-08-29' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BD' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH448UI' as patente, '2026-08-29' as min_date, '2026-09-05' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH448UI' 
AND ca.fecha_desde <= '2026-09-05'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AI288CZ' as patente, '2026-08-29' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288CZ' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH087VY' as patente, '2026-08-28' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH087VY' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH252TM' as patente, '2026-09-03' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252TM' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-03');

SELECT 'AH191LZ' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH191LZ' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH252TZ' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252TZ' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288CT' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288CT' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288DA' as patente, '2026-08-28' as min_date, '2026-08-28' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DA' 
AND ca.fecha_desde <= '2026-08-28'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI325BL' as patente, '2026-08-30' as min_date, '2026-09-03' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BL' 
AND ca.fecha_desde <= '2026-09-03'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-30');

SELECT 'AH252TS' as patente, '2026-09-04' as min_date, '2026-09-04' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252TS' 
AND ca.fecha_desde <= '2026-09-04'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-04');

SELECT 'AI210DL' as patente, '2026-08-28' as min_date, '2026-09-02' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI210DL' 
AND ca.fecha_desde <= '2026-09-02'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH387LE' as patente, '2026-08-29' as min_date, '2026-09-01' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH387LE' 
AND ca.fecha_desde <= '2026-09-01'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AI288CX' as patente, '2026-09-02' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288CX' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-02');

SELECT 'AH448TS' as patente, '2026-09-01' as min_date, '2026-09-01' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH448TS' 
AND ca.fecha_desde <= '2026-09-01'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-01');

SELECT 'AI325BF' as patente, '2026-08-28' as min_date, '2026-09-04' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BF' 
AND ca.fecha_desde <= '2026-09-04'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AI288DV' as patente, '2026-08-30' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288DV' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-30');

SELECT 'AI325BZ' as patente, '2026-09-03' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BZ' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-03');

SELECT 'AH252SQ' as patente, '2026-08-29' as min_date, '2026-08-29' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH252SQ' 
AND ca.fecha_desde <= '2026-08-29'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH191LK' as patente, '2026-08-29' as min_date, '2026-09-03' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH191LK' 
AND ca.fecha_desde <= '2026-09-03'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-29');

SELECT 'AH191LR' as patente, '2026-09-02' as min_date, '2026-09-02' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH191LR' 
AND ca.fecha_desde <= '2026-09-02'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-02');

SELECT 'AH448UC' as patente, '2026-08-31' as min_date, '2026-08-31' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH448UC' 
AND ca.fecha_desde <= '2026-08-31'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-31');

SELECT 'AI325BI' as patente, '2026-08-28' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BI' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-28');

SELECT 'AH448TR' as patente, '2026-09-06' as min_date, '2026-09-06' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AH448TR' 
AND ca.fecha_desde <= '2026-09-06'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-06');

SELECT 'AI288CV' as patente, '2026-08-30' as min_date, '2026-09-02' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI288CV' 
AND ca.fecha_desde <= '2026-09-02'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-08-30');

SELECT 'AI325BR' as patente, '2026-09-07' as min_date, '2026-09-07' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = 'AI325BR' 
AND ca.fecha_desde <= '2026-09-07'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '2026-09-07');
