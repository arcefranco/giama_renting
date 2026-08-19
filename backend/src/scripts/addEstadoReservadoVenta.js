import { giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";

const runMigration = async () => {
  try {
    console.log("Iniciando migración para estado 'Reservado venta'...");

    const estados = await giama_renting.query(
      "SELECT id FROM estados_vehiculos WHERE nombre = 'Reservado venta'",
      { type: QueryTypes.SELECT }
    );

    if (estados.length === 0) {
      await giama_renting.query(
        "INSERT INTO estados_vehiculos (id, nombre) VALUES (9, 'Reservado venta')"
      );
      console.log("Estado 'Reservado venta' insertado exitosamente con ID 9.");
    } else {
      console.log("El estado 'Reservado venta' ya existe en la base de datos.");
    }

    console.log("Migración finalizada con éxito.");
  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    await giama_renting.close();
  }
};

runMigration();
