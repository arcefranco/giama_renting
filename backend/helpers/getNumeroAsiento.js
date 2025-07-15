import { QueryTypes } from "sequelize";
import { pa7_giama_renting } from "./connection.js";

export const getNumeroAsiento = async () => {
  try {
    const result = await pa7_giama_renting.query(
      `
        SET @nro_asiento = 0;
        CALL net_getnumeroasiento(@nro_asiento);
        SELECT @nro_asiento AS nroAsiento;
      `,
      { type: QueryTypes.SELECT }
    );
    return result[2][0].nroAsiento;
  } catch (error) {
    console.log(error);
    throw new Error("Error al obtener número de asiento");
  }
};

export const getNumeroAsientoSecundario = async () => {
  try {
    const result = await pa7_giama_renting.query(
      `
        SET @nro_asiento = 0;
        CALL net_getnumeroasientosecundario(@nro_asiento);
        SELECT @nro_asiento AS nroAsiento;
      `,
      { type: QueryTypes.SELECT }
    );
    return result[2][0].nroAsiento;
  } catch (error) {
    console.log(error);
    throw new Error("Error al obtener número de asiento");
  }
};
