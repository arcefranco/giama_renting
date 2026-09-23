import mysql from 'mysql2/promise';
import xlsx from "xlsx";

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'rds.giama.com.ar',
      user: 'admin',
      password: 'juan1720',
      database: 'giama_renting'
    });

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
    const dominiosEnExcel = new Set();

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
        dominiosEnExcel.add(patente);
    }

    const dominiosList = Array.from(dominiosEnExcel);
    
    // Obtener todos los vehiculos del excel
    const [vehiculos] = await connection.query(`SELECT id, Dominio FROM vehiculos WHERE Dominio IN (?)`, [dominiosList]);
    const vehiculosMap = new Map(vehiculos.map(v => [v.Dominio.toUpperCase(), v.id]));
    const idsVehiculos = vehiculos.map(v => v.id);

    if (idsVehiculos.length === 0) {
        console.log("No se encontraron vehiculos.");
        return;
    }

    // Obtener todos los contratos para esos vehiculos
    const [contratos] = await connection.query(`
        SELECT ca.id as contrato_id, ca.id_vehiculo, ca.fecha_desde, ca.fecha_hasta, c.nombre, c.apellido, c.razon_social
        FROM contratos_alquiler ca
        JOIN clientes c ON ca.id_cliente = c.id
        WHERE ca.id_vehiculo IN (?)
        ORDER BY ca.fecha_desde ASC
    `, [idsVehiculos]);

    const contratosPorVehiculo = {};
    for (const c of contratos) {
        if (!contratosPorVehiculo[c.id_vehiculo]) contratosPorVehiculo[c.id_vehiculo] = [];
        contratosPorVehiculo[c.id_vehiculo].push(c);
    }

    const casosProblematicos = [];

    for (const patente of dominiosList) {
        const idVehiculo = vehiculosMap.get(patente);
        if (!idVehiculo) continue;
        
        const contratosVehiculo = contratosPorVehiculo[idVehiculo] || [];

        const fechas = gruposPorPatente[patente].pasadas.sort((a, b) => a - b);
        const minFecha = fechas[0];
        const maxFecha = fechas[fechas.length - 1];
        
        const minDateStr = minFecha.toISOString().split('T')[0];
        const maxDateStr = maxFecha.toISOString().split('T')[0];

        const contratosActivos = contratosVehiculo.filter(c => {
            const fDesde = c.fecha_desde instanceof Date ? c.fecha_desde.toISOString().split('T')[0] : c.fecha_desde;
            const fHasta = c.fecha_hasta ? (c.fecha_hasta instanceof Date ? c.fecha_hasta.toISOString().split('T')[0] : c.fecha_hasta) : null;
            return fDesde <= maxDateStr && (!fHasta || fHasta >= minDateStr);
        });

        const clientesDistintos = new Set(contratosActivos.map(c => c.nombre + c.apellido + c.razon_social));

        if (clientesDistintos.size > 1) {
            casosProblematicos.push({
                patente,
                fechasPasadas: `${minDateStr} al ${maxDateStr}`,
                contratos: contratosActivos.map(c => {
                    const fDesde = c.fecha_desde instanceof Date ? c.fecha_desde.toISOString().split('T')[0] : c.fecha_desde;
                    const fHasta = c.fecha_hasta ? (c.fecha_hasta instanceof Date ? c.fecha_hasta.toISOString().split('T')[0] : c.fecha_hasta) : 'actualidad';
                    return `${c.nombre} ${c.apellido} ${c.razon_social || ''} (${fDesde} a ${fHasta})`.trim()
                })
            });
        }
    }

    if (casosProblematicos.length > 0) {
        console.log("SE ENCONTRARON LOS SIGUIENTES CASOS CON MULTIPLES CONTRATOS EN EL PERIODO DE LAS PASADAS:");
        console.log(JSON.stringify(casosProblematicos, null, 2));
    } else {
        console.log("NO se encontraron otros casos problemáticos en este Excel.");
    }

  } catch (error) {
    console.error(error);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
}

run();
