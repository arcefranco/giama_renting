import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { handleSqlError } from "../../helpers/handleSqlError.js";

export const getCuentasContables = async (req, res) => {
  try {
    const resultado = await pa7_giama_renting.query(
      "SELECT Codigo, Nombre, CuentaSecundaria FROM c_plancuentas",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

export const postConceptoCostos = async (req, res) => {
  const { nombre, cuenta_contable, cuenta_secundaria } = req.body;
  try {
    await giama_renting.query(
      "INSERT INTO conceptos_costos (nombre, cuenta_contable, cuenta_secundaria) VALUES (?,?,?)",
      {
        type: QueryTypes.INSERT,
        replacements: [nombre, cuenta_contable, cuenta_secundaria],
      }
    );
    return res.send({ status: true, message: "Concepto ingresado con éxito" });
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};
