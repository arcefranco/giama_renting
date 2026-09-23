import xlsx from "xlsx";
import fs from "fs";

function run() {
    const filepath = "/home/gaston/giama-proyectos/giama_renting/backend/src/scripts/Copia de Telepases al 08.09.2026.xlsx";
    const workbook = xlsx.readFile(filepath);
    const worksheet = workbook.Sheets["PASADAS"];
    const dataRaw = xlsx.utils.sheet_to_json(worksheet);

    let sumDenis = 0;
    let sumRoberto = 0;
    
    let sumAtilio = 0;
    let sumLeandro = 0;
    
    let parsedCount = 0;

    for (const row of dataRaw) {
        const normalizedRow = {};
        for (const key in row) {
            normalizedRow[key.trim().toUpperCase()] = row[key];
        }

        const patente = normalizedRow.PATENTE ? String(normalizedRow.PATENTE).trim().toUpperCase() : null;
        if (patente !== "AI288CV" && patente !== "AI288DX") continue;

        let rawTarifa = normalizedRow['TARIFA'] || normalizedRow['TARIFA CON IVA'] || normalizedRow['IMPORTE'] || 0;
        let tarifa = typeof rawTarifa === 'number' ? rawTarifa : parseFloat(String(rawTarifa).replace(/[^0-9,\.-]/g, '').replace(',', '.'));
        if (isNaN(tarifa)) tarifa = 0;

        let fechaJS = null;
        const rawFecha = normalizedRow.FECHA;
        if (typeof rawFecha === "number") {
            fechaJS = new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
        } else if (rawFecha instanceof Date) {
            fechaJS = rawFecha;
        } else if (rawFecha) {
            const parts = String(rawFecha).trim().split("/");
            if (parts.length === 3) fechaJS = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
        }
        
        if (!fechaJS || isNaN(fechaJS)) continue;
        
        const fechaStr = fechaJS.toISOString().split('T')[0];
        parsedCount++;
        
        if (patente === "AI288CV") {
            if (fechaStr <= "2026-09-01") {
                sumDenis += tarifa;
            } else {
                sumRoberto += tarifa;
            }
        }
        
        if (patente === "AI288DX") {
            if (fechaStr <= "2026-09-02") {
                sumAtilio += tarifa;
            } else {
                sumLeandro += tarifa;
            }
        }
    }

    const output = `
AI288CV
- DENIS JOSUE BRICEÑO MONSALVE (hasta 01/09): $${sumDenis.toFixed(2)}
- roberto fabian rojas (desde 02/09): $${sumRoberto.toFixed(2)}
- TOTAL COBRADO A ROBERTO POR ERROR: $${(sumDenis + sumRoberto).toFixed(2)}

AI288DX
- Atilio Miguel Quaini (hasta 02/09): $${sumAtilio.toFixed(2)}
- Leandro Barreto Maldonado (desde 03/09): $${sumLeandro.toFixed(2)}
- TOTAL COBRADO A LEANDRO POR ERROR: $${(sumAtilio + sumLeandro).toFixed(2)}
    `;
    
    fs.writeFileSync('/home/gaston/giama-proyectos/giama_renting/backend/scratch/importes_exactos.txt', output);
    console.log(output);
}
run();
