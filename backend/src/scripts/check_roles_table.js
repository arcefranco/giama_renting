import { giama_renting } from "../../helpers/connection.js";

async function main() {
    try {
        const roles = await giama_renting.query("SELECT * FROM roles LIMIT 1");
        console.log("Roles table columns:", Object.keys(roles[0][0] || {}));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

main();
