import xlsx from "xlsx";

const filepath = "/home/gaston/giama-proyectos/giama_renting/backend/src/scripts/Copia de Telepases al 08.09.2026.xlsx";
const workbook = xlsx.readFile(filepath);
const NOMBRE_PESTANA = "PASADAS";

if (!workbook.SheetNames.includes(NOMBRE_PESTANA)) {
    console.error("No se encontró la pestaña", NOMBRE_PESTANA);
    process.exit(1);
}

const worksheet = workbook.Sheets[NOMBRE_PESTANA];
const dataRaw = xlsx.utils.sheet_to_json(worksheet);

const data = dataRaw.map(row => {
    const normalizedRow = {};
    for (const key in row) {
        normalizedRow[key.trim().toUpperCase()] = row[key];
    }
    return normalizedRow;
});

const targetPatente = "AI288DX";
let rawPasadas = [];

const parseMonto = (valor) => {
    if (typeof valor === "number") return valor;
    if (!valor) return 0;
    let str = String(valor).replace(/[^0-9,\.-]/g, '');
    if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }
    return parseFloat(str) || 0;
};

const gruposPorPatente = {};

for (const [index, fila] of data.entries()) {
    const patente = fila.PATENTE ? String(fila.PATENTE).trim().toUpperCase() : null;
    
    if (patente === targetPatente) {
        rawPasadas.push(fila);
    }
    
    if (!patente) continue;

    const tarifa = parseMonto(fila.TARIFA);
    const bonificacion = parseMonto(fila.BONIFICACION);
    const montoNeto = tarifa;

    if (montoNeto <= 0) continue;

    let fechaStr = "";
    const rawFecha = fila.FECHA;
    if (typeof rawFecha === "number") {
        const fechaJS = new Date(Math.round((rawFecha - 25569) * 86400 * 1000));
        const d = String(fechaJS.getUTCDate()).padStart(2, "0");
        const m = String(fechaJS.getUTCMonth() + 1).padStart(2, "0");
        const y = fechaJS.getUTCFullYear();
        fechaStr = `${d}/${m}/${y}`;
    } else if (rawFecha instanceof Date) {
        const d = String(rawFecha.getUTCDate()).padStart(2, "0");
        const m = String(rawFecha.getUTCMonth() + 1).padStart(2, "0");
        const y = rawFecha.getUTCFullYear();
        fechaStr = `${d}/${m}/${y}`;
    } else if (rawFecha) {
        fechaStr = String(rawFecha).trim();
    }

    if (!gruposPorPatente[patente]) {
        gruposPorPatente[patente] = {
            totalTarifa: 0,
            totalBonificacion: 0,
            totalNeto: 0,
            cantidadPasadas: 0,
            chofer: fila.CHOFER ? String(fila.CHOFER).trim() : "S/D",
            autopistas: new Set(),
            fechas: [],
            fechasRaw: []
        };
    }

    gruposPorPatente[patente].totalTarifa += tarifa;
    gruposPorPatente[patente].totalBonificacion += bonificacion;
    gruposPorPatente[patente].totalNeto += montoNeto;
    gruposPorPatente[patente].cantidadPasadas += 1;
    if (fila.AUTOPISTA) gruposPorPatente[patente].autopistas.add(String(fila.AUTOPISTA).trim());
    if (fechaStr) {
        gruposPorPatente[patente].fechas.push(fechaStr);
        gruposPorPatente[patente].fechasRaw.push(rawFecha);
    }
}

console.log(`\n--- RESULTADOS PARA ${targetPatente} ---`);
console.log(`Cantidad de filas RAW en Excel para esta patente:`, rawPasadas.length);
console.log(`Algunas filas RAW (primeras 3):`, JSON.stringify(rawPasadas.slice(0, 3), null, 2));

const grupo = gruposPorPatente[targetPatente];
if (grupo) {
    const fechasOrdenadas = [...grupo.fechas].sort();
    const rangoFechas = fechasOrdenadas.length > 0
        ? (fechasOrdenadas[0] === fechasOrdenadas[fechasOrdenadas.length - 1]
            ? fechasOrdenadas[0]
            : `${fechasOrdenadas[0]} al ${fechasOrdenadas[fechasOrdenadas.length - 1]}`)
        : "S/D";

    console.log(`\n--- PROCESAMIENTO DEL CONTROLADOR (LO QUE SE GUARDA) ---`);
    console.log(`Cantidad pasadas:`, grupo.cantidadPasadas);
    console.log(`Total Tarifa:`, grupo.totalTarifa);
    console.log(`Importe Neto:`, grupo.totalNeto);
    console.log(`Rango de fechas (ordenado como texto!):`, rangoFechas);
    
    // Sort properly to see difference
    const fechasCorrectas = [...grupo.fechas].sort((a,b) => {
        const [da, ma, ya] = a.split('/');
        const [db, mb, yb] = b.split('/');
        return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
    });
    console.log(`Rango de fechas (si se ordenara por fecha real): ${fechasCorrectas[0]} al ${fechasCorrectas[fechasCorrectas.length - 1]}`);
    console.log(`Todas las fechas procesadas:`, JSON.stringify(grupo.fechas, null, 2));
} else {
    console.log(`No se encontró la patente ${targetPatente} en el grupo válido.`);
}
