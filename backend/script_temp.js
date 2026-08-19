import { giama_renting } from "./helpers/connection.js";
import { QueryTypes } from "sequelize";

async function run() {
    try {
        const alquileres = await giama_renting.query(
            "SELECT * FROM alquileres WHERE id_vehiculo = 36",
            { type: QueryTypes.SELECT }
        );
        console.table(alquileres);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
