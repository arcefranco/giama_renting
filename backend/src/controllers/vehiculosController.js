import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";

export const getVehiculos = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM vehiculos", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};
export const postVehiculo = async (req, res) => {
  const {
    modelo,
    dominio,
    nro_chasis,
    nro_motor,
    kilometros,
    proveedor_gps,
    nro_serie_gps,
    dispositivo,
    meses_amortizacion,
    color,
  } = req.body;
  let precio_inicial;
  try {
    precio_inicial = await giama_renting.query(
      "SELECT precio FROM precios_modelos WHERE modelo = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [modelo],
      }
    );
  } catch (error) {
    return res.send(error);
  }
  try {
    await giama_renting.query(
      `INSERT INTO vehiculos (modelo, precio_inicial, dominio, nro_chasis, nro_motor
        kilometros, proveedor_gps, nro_serie_gps, dispositivo, meses_amortizacion, color) VALUES
        (??????????)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          modelo,
          precio_inicial,
          dominio,
          nro_chasis,
          nro_motor,
          kilometros,
          proveedor_gps,
          nro_serie_gps,
          dispositivo,
          meses_amortizacion,
          color,
        ],
      }
    );
  } catch (error) {
    return res.send(error);
  }
};
