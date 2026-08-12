import { pa7_giama_renting } from "./src/helpers/connection.js";

async function run() {
    try {
        const [processes] = await pa7_giama_renting.query("SHOW PROCESSLIST");
        console.log("=== PROCESSLIST ===");
        console.table(processes);
        
        try {
            const [innodbStatus] = await pa7_giama_renting.query("SHOW ENGINE INNODB STATUS");
            console.log("\n=== INNODB STATUS ===");
            console.log(innodbStatus[0].Status);
        } catch(e) {
            console.log("Could not get innodb status (requires privileges)");
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();
