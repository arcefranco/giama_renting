import { giama_renting } from "../../helpers/connection.js";

async function run() {
  try {
    console.log("Adding audit columns to 'usuarios' table...");
    
    const columns = [
      "usuario_alta VARCHAR(50)",
      "fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP",
      "usuario_modificacion VARCHAR(50)",
      "fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ];

    for (const col of columns) {
      try {
        await giama_renting.query(`ALTER TABLE usuarios ADD COLUMN ${col}`);
        console.log(`Added column: ${col.split(' ')[0]}`);
      } catch (e) {
        if (e.original && e.original.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column already exists: ${col.split(' ')[0]}`);
        } else {
          console.error(`Error adding column ${col.split(' ')[0]}:`, e);
        }
      }
    }

    console.log("Audit columns added successfully.");
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log("One or more audit columns already exist.");
    } else {
      console.error("Error adding columns:", error);
    }
  } finally {
    process.exit(0);
  }
}

run();
