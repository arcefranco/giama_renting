import xlsx from "xlsx";
import fs from "fs";

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

    const gruposPorPatente = {};

    for (const fila of data) {
        const patente = fila.PATENTE ? String(fila.PATENTE).trim().toUpperCase() : null;
        if (!patente) continue;

        let tarifa = typeof fila.TARIFA === 'number' ? fila.TARIFA : parseFloat(String(fila.TARIFA || 0).replace(/[^0-9,\.-]/g, '').replace(',', '.'));
        if (tarifa <= 0) continue;

        let fechaJS = null;
        const rawFecha = fila.FECHA;
        if (typeof rawFecha === "number") {
            fechaJS = new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
        } else if (rawFecha instanceof Date) {
            fechaJS = rawFecha;
        } else if (rawFecha) {
            const parts = String(rawFecha).trim().split("/");
            if (parts.length === 3) {
                fechaJS = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
            }
        }

        if (!fechaJS || isNaN(fechaJS)) continue;

        if (!gruposPorPatente[patente]) {
            gruposPorPatente[patente] = { pasadas: [] };
        }
        gruposPorPatente[patente].pasadas.push(fechaJS);
    }

    let sqlQueries = "USE giama_renting;\n";

    for (const patente of Object.keys(gruposPorPatente)) {
        const fechas = gruposPorPatente[patente].pasadas.sort((a, b) => a - b);
        const minDateStr = fechas[0].toISOString().split('T')[0];
        const maxDateStr = fechas[fechas.length - 1].toISOString().split('T')[0];

        // This query will return the patente along with contract info if there are contracts
        sqlQueries += `
SELECT '${patente}' as patente, '${minDateStr}' as min_date, '${maxDateStr}' as max_date, ca.id as contrato_id, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
FROM vehiculos v
JOIN contratos_alquiler ca ON ca.id_vehiculo = v.id
JOIN clientes c ON ca.id_cliente = c.id
WHERE v.Dominio = '${patente}' 
AND ca.fecha_desde <= '${maxDateStr}'
AND (ca.fecha_hasta IS NULL OR ca.fecha_hasta >= '${minDateStr}');\n`;
    }

    fs.writeFileSync('/home/gaston/giama-proyectos/giama_renting/backend/scratch/queries.sql', sqlQueries);
    console.log("Consultas SQL generadas en scratch/queries.sql");
}

run();
