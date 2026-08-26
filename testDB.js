import { giama_renting } from "./backend/helpers/connection.js";
giama_renting.query("DESCRIBE usuarios").then(console.log).catch(console.error).finally(() => process.exit());
