import fs from "fs";
import xlsx from "xlsx";

function run() {
    const filepath = "/home/gaston/giama-proyectos/giama_renting/backend/src/scripts/Copia de Telepases al 08.09.2026.xlsx";
    const workbook = xlsx.readFile(filepath);
    const worksheet = workbook.Sheets["PASADAS"];
    const dataRaw = xlsx.utils.sheet_to_json(worksheet);

    const data = dataRaw.map(row => {
        const normalizedRow = {};
        for (const key in row) {
            normalizedRow[key.trim().toUpperCase()] = row[key];
        }
        return normalizedRow;
    });

    const grupos = {};

    for (const row of data) {
        const patente = row.PATENTE ? String(row.PATENTE).trim().toUpperCase() : null;
        if (!patente) continue;

        let tarifa = typeof row.TARIFA === 'number' ? row.TARIFA : parseFloat(String(row.TARIFA || 0).replace(/[^0-9,\.-]/g, '').replace(',', '.'));
        if (tarifa <= 0) continue;

        let fechaJS = null;
        const rawFecha = row.FECHA;
        if (typeof rawFecha === "number") {
            fechaJS = new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
        } else if (rawFecha instanceof Date) {
            fechaJS = rawFecha;
        } else if (rawFecha) {
            const parts = String(rawFecha).trim().split("/");
            if (parts.length === 3) fechaJS = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
        }
        if (!fechaJS || isNaN(fechaJS)) continue;

        if (!grupos[patente]) grupos[patente] = [];
        grupos[patente].push(fechaJS);
    }

    let sql = "USE giama_renting;\n";
    sql += "DROP TEMPORARY TABLE IF EXISTS temp_excel_telepases;\n";
    sql += "CREATE TEMPORARY TABLE temp_excel_telepases (dominio VARCHAR(20), min_fecha DATE, max_fecha DATE);\n";
    
    let inserts = [];
    for (const patente of Object.keys(grupos)) {
        const fechas = grupos[patente].sort((a, b) => a - b);
        const minD = fechas[0].toISOString().split('T')[0];
        const maxD = fechas[fechas.length - 1].toISOString().split('T')[0];
        inserts.push(`('${patente}', '${minD}', '${maxD}')`);
    }

    for (let i = 0; i < inserts.length; i += 50) {
        const chunk = inserts.slice(i, i + 50);
        sql += `INSERT INTO temp_excel_telepases (dominio, min_fecha, max_fecha) VALUES ${chunk.join(', ')};\n`;
    }

    sql += `
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
    `;

    fs.writeFileSync('/home/gaston/giama-proyectos/giama_renting/backend/scratch/temp_query.sql', sql);
    console.log("SQL temporal generado");
}
run();
