import { giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";
export const verificarEstadoVehiculo = async (id_vehiculo) => {
  console.log("ID VEHICULO: ", id_vehiculo);
  try {
    let result = await giama_renting.query(
      "SELECT estado_actual FROM vehiculos WHERE id = ? ",
      {
        type: QueryTypes.SELECT,
        replacements: [id_vehiculo],
      }
    );
    console.log(result);
    if (result[0]["estado_actual"] !== 2) {
      console.log(result[0]["estado_actual"]);
      return `El vehículo debe estar listo para alquilar`;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    throw new Error("Error al verificar el estado del vehículo");
  }
};
