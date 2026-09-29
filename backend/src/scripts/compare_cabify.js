import { Sequelize, QueryTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const giama_renting = new Sequelize(process.env.DB_NAME || 'giama_renting', process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

const pa7_giama_renting = new Sequelize(process.env.DB_NAME_CONTABILIDAD || 'pa7_giama_renting', process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
});

async function main() {
    try {
        console.log("--- BÚSQUEDA EN BD TESTING ---");
        
        // 1. Cabify Masivo (creado hoy)
        const massive = await giama_renting.query(
            "SELECT id, detalle, importe_total FROM recibos WHERE (detalle LIKE '%Cabify Masivo%' OR observaciones LIKE '%Cobro Cabify%') ORDER BY id DESC LIMIT 1",
            { type: QueryTypes.SELECT }
        );
        let masivoId = massive.length ? massive[0].id : null;
        console.log("\n[MASIVO] Recibo:", massive[0] ? massive[0] : "No encontrado");

        if (masivoId) {
            const pc = await giama_renting.query("SELECT * FROM pagos_clientes WHERE nro_recibo = ?", { replacements: [masivoId], type: QueryTypes.SELECT });
            console.log(`[MASIVO] pagos_clientes: ${pc.length}`);
            
            const pCabify = await giama_renting.query("SELECT * FROM pagos_cabify WHERE nro_recibo = ?", { replacements: [masivoId], type: QueryTypes.SELECT });
            console.log(`[MASIVO] pagos_cabify: ${pCabify.length}`);

            const cMov = await pa7_giama_renting.query("SELECT * FROM c_movimientos WHERE NroComprobante = ?", { replacements: [masivoId], type: QueryTypes.SELECT });
            console.log(`[MASIVO] c_movimientos: ${cMov.length}`);
            
            const c2Mov = await pa7_giama_renting.query("SELECT * FROM c2_movimientos WHERE NroComprobante = ?", { replacements: [masivoId], type: QueryTypes.SELECT });
            console.log(`[MASIVO] c2_movimientos: ${c2Mov.length}`);
        }

        // 2. Cabify Manual (anterior)
        const manual = await giama_renting.query(
            "SELECT r.id, r.detalle, r.importe_total FROM recibos r JOIN pagos_clientes pc ON r.id = pc.nro_recibo JOIN formas_cobro f ON pc.id_forma_cobro = f.id WHERE f.nombre LIKE '%Cabify%' AND r.id < IFNULL((SELECT MIN(nro_recibo) FROM pagos_cabify), 9999999) ORDER BY r.id DESC LIMIT 1",
            { type: QueryTypes.SELECT }
        );
        let manualId = manual.length ? manual[0].id : null;
        console.log("\n[MANUAL] Recibo:", manual[0] ? manual[0] : "No encontrado");

        if (manualId) {
            const pcMan = await giama_renting.query("SELECT * FROM pagos_clientes WHERE nro_recibo = ?", { replacements: [manualId], type: QueryTypes.SELECT });
            console.log(`[MANUAL] pagos_clientes: ${pcMan.length}`);
            
            const cMovMan = await pa7_giama_renting.query("SELECT * FROM c_movimientos WHERE NroComprobante = ?", { replacements: [manualId], type: QueryTypes.SELECT });
            console.log(`[MANUAL] c_movimientos: ${cMovMan.length}`);
            
            const c2MovMan = await pa7_giama_renting.query("SELECT * FROM c2_movimientos WHERE NroComprobante = ?", { replacements: [manualId], type: QueryTypes.SELECT });
            console.log(`[MANUAL] c2_movimientos: ${c2MovMan.length}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await giama_renting.close();
        await pa7_giama_renting.close();
    }
}

main();
