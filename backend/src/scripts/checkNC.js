import { pa7_giama_renting } from "../../helpers/connection.js";

const checkNC = async () => {
  try {
    const [result] = await pa7_giama_renting.query(
      `SELECT * FROM c_movimientos WHERE NroComprobante = '0005200017397'`
    );
    console.log("Datos del asiento en c_movimientos:");
    console.table(result);
  } catch (error) {
    console.error("Error al consultar:", error);
  } finally {
    await pa7_giama_renting.close();
  }
};

checkNC();
