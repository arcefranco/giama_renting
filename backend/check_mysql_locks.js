import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const pa7_prod = new Sequelize(
  process.env.DB_PA7_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST_prod,
    dialect: "mysql",
    timezone: "-03:00",
    logging: false
  }
);

async function run() {
    try {
        const [processes] = await pa7_prod.query("SHOW PROCESSLIST");
        console.log("=== PROCESSLIST (PROD) ===");
        console.table(processes.filter(p => p.Command !== 'Sleep'));
        
        try {
            const [innodbStatus] = await pa7_prod.query("SHOW ENGINE INNODB STATUS");
            console.log("\n=== INNODB STATUS (PROD) ===");
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
