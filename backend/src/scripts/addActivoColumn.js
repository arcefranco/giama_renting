import { giama_renting } from "../../helpers/connection.js";

async function run() {
  try {
    console.log("Adding 'activo' column to 'usuarios' table if not exists...");
    
    await giama_renting.query(`
      ALTER TABLE usuarios 
      ADD COLUMN activo TINYINT(1) DEFAULT 1;
    `);

    console.log("Column 'activo' added successfully.");
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log("Column 'activo' already exists.");
    } else {
      console.error("Error adding column:", error);
    }
  } finally {
    process.exit(0);
  }
}

run();
