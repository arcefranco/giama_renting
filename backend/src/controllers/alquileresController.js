import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";

export const postFormaCobro = async (req, res) => {
  const { nombre, cuenta_contable } = req.body;
  try {
    await giama_renting.query(
      "INSERT INTO formas_cobro (nombre, cuenta_contable) VALUES (?,?)",
      {
        replacements: [nombre, cuenta_contable],
        type: QueryTypes.INSERT,
      }
    );
    return res.send({
      status: true,
      message: "Forma de cobro insertada correctamente!",
    });
  } catch (error) {
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};

export const postAlquiler = async (req, res) => {
  const {
    //no incluye fecha_cobro porque falta confirmacion de cobro
    id_vehiculo,
    id_cliente,
    fecha_desde,
    fecha_hasta,
    importe_neto,
    importe_iva,
    importe_total,
    id_forma_cobro,
  } = req.body;
  try {
    await giama_renting.query(
      `INSERT INTO alquileres 
    (id_vehiculo,
    id_cliente,
    fecha_desde,
    fecha_hasta,
    importe_neto,
    importe_iva,
    importe_total,
    id_forma_cobro) VALUES (?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          id_cliente,
          fecha_desde,
          fecha_hasta,
          importe_neto,
          importe_iva,
          importe_total,
          id_forma_cobro,
        ],
      }
    );
    return res.send({ status: true, message: "Alquiler ingresado con éxito" });
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};
