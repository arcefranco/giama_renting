USE giama_renting;
DROP TEMPORARY TABLE IF EXISTS temp_excel_telepases;
CREATE TEMPORARY TABLE temp_excel_telepases (dominio VARCHAR(20), min_fecha DATE, max_fecha DATE);
INSERT INTO temp_excel_telepases (dominio, min_fecha, max_fecha) VALUES ('AI210DP', '2026-08-28', '2026-09-07'), ('AI325BX', '2026-08-28', '2026-09-07'), ('AH387KY', '2026-08-28', '2026-09-07'), ('AI325CC', '2026-08-28', '2026-09-06'), ('AI325BY', '2026-08-29', '2026-09-05'), ('AI288DY', '2026-08-28', '2026-09-07'), ('AI325BJ', '2026-08-28', '2026-09-07'), ('AI288CW', '2026-08-29', '2026-09-07'), ('AI325BH', '2026-08-28', '2026-09-07'), ('AH252SX', '2026-08-29', '2026-09-07'), ('AI210DR', '2026-08-28', '2026-09-07'), ('AI325BV', '2026-08-28', '2026-09-07'), ('AH448TY', '2026-08-28', '2026-09-07'), ('AI325CB', '2026-08-28', '2026-09-07'), ('AI288DX', '2026-08-28', '2026-09-07'), ('AH387LI', '2026-08-28', '2026-09-07'), ('AI325BG', '2026-08-28', '2026-09-07'), ('AH387LF', '2026-08-29', '2026-09-07'), ('AH645XD', '2026-08-29', '2026-09-07'), ('AH252SV', '2026-08-28', '2026-09-07'), ('AI288CU', '2026-08-28', '2026-09-06'), ('AI288DZ', '2026-08-28', '2026-09-07'), ('AI325BU', '2026-08-28', '2026-09-07'), ('AH191LX', '2026-08-28', '2026-09-07'), ('AH502KC', '2026-08-28', '2026-09-06'), ('AH502KG', '2026-08-28', '2026-09-07'), ('AI325BB', '2026-08-28', '2026-09-07'), ('AH252TO', '2026-08-28', '2026-09-07'), ('AI288DF', '2026-08-28', '2026-09-05'), ('AH448TP', '2026-08-28', '2026-09-07'), ('AI288DU', '2026-08-29', '2026-09-07'), ('AI325BO', '2026-08-28', '2026-09-06'), ('AI325BE', '2026-08-28', '2026-09-07'), ('AI210DQ', '2026-08-28', '2026-09-07'), ('AH387LD', '2026-08-28', '2026-09-03'), ('AI325BQ', '2026-08-28', '2026-09-06'), ('AH645XC', '2026-08-28', '2026-09-06'), ('AH252TL', '2026-08-29', '2026-09-06'), ('AH387LH', '2026-08-29', '2026-09-07'), ('AH387LA', '2026-08-31', '2026-09-02'), ('AI288DD', '2026-08-29', '2026-09-07'), ('AH448UK', '2026-08-28', '2026-09-07'), ('AH252ST', '2026-08-28', '2026-09-07'), ('AH502KB', '2026-08-30', '2026-09-04'), ('AI325BS', '2026-08-28', '2026-09-06'), ('AI325BA', '2026-08-28', '2026-09-07'), ('AH252TT', '2026-08-29', '2026-09-07'), ('AH252TP', '2026-08-28', '2026-09-07'), ('AI288DB', '2026-09-05', '2026-09-07'), ('AH502KF', '2026-08-31', '2026-08-31');
INSERT INTO temp_excel_telepases (dominio, min_fecha, max_fecha) VALUES ('AH645XB', '2026-08-29', '2026-09-03'), ('AI325CA', '2026-08-28', '2026-09-05'), ('AI288CS', '2026-08-28', '2026-09-07'), ('AI325BT', '2026-08-28', '2026-09-07'), ('AI325BK', '2026-08-28', '2026-09-07'), ('AI288DE', '2026-08-29', '2026-09-05'), ('AH191LS', '2026-08-28', '2026-09-05'), ('AH387LG', '2026-08-28', '2026-09-07'), ('AH387LJ', '2026-08-28', '2026-09-06'), ('AH252SM', '2026-08-30', '2026-09-07'), ('AI325BC', '2026-08-28', '2026-09-06'), ('AH448UA', '2026-08-28', '2026-09-07'), ('AH252TK', '2026-08-29', '2026-09-07'), ('AH387KZ', '2026-08-29', '2026-09-06'), ('AI288CR', '2026-09-02', '2026-09-03'), ('AH387LM', '2026-08-28', '2026-09-04'), ('AI288DC', '2026-09-01', '2026-09-02'), ('AI325BM', '2026-09-01', '2026-09-06'), ('AI325BD', '2026-08-29', '2026-09-06'), ('AH448UI', '2026-08-29', '2026-09-05'), ('AI288CZ', '2026-08-29', '2026-09-07'), ('AH087VY', '2026-08-28', '2026-09-06'), ('AH252TM', '2026-09-03', '2026-09-07'), ('AH191LZ', '2026-08-28', '2026-09-07'), ('AH252TZ', '2026-08-28', '2026-09-07'), ('AI288CT', '2026-08-28', '2026-09-07'), ('AI288DA', '2026-08-28', '2026-08-28'), ('AI325BL', '2026-08-30', '2026-09-03'), ('AH252TS', '2026-09-04', '2026-09-04'), ('AI210DL', '2026-08-28', '2026-09-02'), ('AH387LE', '2026-08-29', '2026-09-01'), ('AI288CX', '2026-09-02', '2026-09-07'), ('AH448TS', '2026-09-01', '2026-09-01'), ('AI325BF', '2026-08-28', '2026-09-04'), ('AI288DV', '2026-08-30', '2026-09-06'), ('AI325BZ', '2026-09-03', '2026-09-07'), ('AH252SQ', '2026-08-29', '2026-08-29'), ('AH191LK', '2026-08-29', '2026-09-03'), ('AH191LR', '2026-09-02', '2026-09-02'), ('AH448UC', '2026-08-31', '2026-08-31'), ('AI325BI', '2026-08-28', '2026-09-07'), ('AH448TR', '2026-09-06', '2026-09-06'), ('AI288CV', '2026-08-30', '2026-09-02'), ('AI325BR', '2026-09-07', '2026-09-07');

    -- ESTA CONSULTA DEVUELVE SOLO LAS PATENTES QUE TUVIERON MÁS DE UN CONTRATO EN EL PERÍODO DE LAS PASADAS
    SELECT 
        t.dominio AS Patente, 
        t.min_fecha AS Primera_Pasada, 
        t.max_fecha AS Ultima_Pasada, 
        COUNT(DISTINCT ca.id_cliente) AS Cantidad_Clientes_Distintos
    FROM temp_excel_telepases t
    JOIN vehiculos v ON v.Dominio = t.dominio
    JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
    WHERE ca.fecha_desde <= t.max_fecha
      AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= t.min_fecha)
    GROUP BY t.dominio, t.min_fecha, t.max_fecha
    HAVING COUNT(DISTINCT ca.id_cliente) > 1
    ORDER BY t.dominio;
    
    -- ESTA CONSULTA MUESTRA EL DETALLE DE LOS CONTRATOS DE ESAS PATENTES AFECTADAS
    SELECT 
        t.dominio AS Patente, 
        t.min_fecha AS Primera_Pasada, 
        t.max_fecha AS Ultima_Pasada, 
        ca.fecha_desde AS Contrato_Desde, 
        ca.fecha_hasta AS Contrato_Hasta, 
        c.nombre AS Nombre, 
        c.apellido AS Apellido, 
        c.razon_social AS Empresa
    FROM temp_excel_telepases t
    JOIN vehiculos v ON v.Dominio = t.dominio
    JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
    JOIN clientes c ON ca.id_cliente = c.id
    WHERE ca.fecha_desde <= t.max_fecha
      AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= t.min_fecha)
      AND t.dominio IN (
          SELECT t2.dominio
          FROM temp_excel_telepases t2
          JOIN vehiculos v2 ON v2.Dominio = t2.dominio
          JOIN contratos_alquiler ca2 ON ca2.id_vehiculo = v2.id
          WHERE ca2.fecha_desde <= t2.max_fecha
            AND (ca2.fecha_hasta IS NULL OR ca2.fecha_hasta >= t2.min_fecha)
          GROUP BY t2.dominio
          HAVING COUNT(DISTINCT ca2.id_cliente) > 1
      )
    ORDER BY t.dominio, ca.fecha_desde;
    