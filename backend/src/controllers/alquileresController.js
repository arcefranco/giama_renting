import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";

export const getFormasCobro = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM formas_cobro", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

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
    cuenta_contable_forma_cobro,
  } = req.body;
  let NroAsiento;
  let cuentaIC21;
  let cuentaALQU;
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  //OBTENGO NUMEROS DE CUENTA IC21 Y ALQU
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "IC21"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaIC21 = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    throw "Error al buscar un parámetro";
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "ALQU"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaALQU = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    throw "Error al buscar un parámetro";
  }
  //obtengo numero de asiento
  try {
    const result = await pa7_giama_renting.query(
      `
        SET @nro_asiento = 0;
        CALL net_getnumeroasiento(@nro_asiento);
        SELECT @nro_asiento AS nroAsiento;
      `,
      { type: QueryTypes.SELECT }
    );
    NroAsiento = result[2][0].nroAsiento;
  } catch (error) {
    throw `Error al obtener número de asiento: ${error}`;
  }
  console.log("cuentaIC21: ", cuentaIC21);
  console.log("cuentaALQU: ", cuentaALQU);
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
        transaction: transaction_giama_renting,
      }
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimientos contables /* los asientos se hacen a partir de que se cobra? */
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movimientos 
      (Fecha, NroAsiento, Cuenta, DH, Importe) VALUES (?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          NroAsiento,
          cuenta_contable_forma_cobro,
          "D",
          importe_total,
          /*           observacion,
          comprobante, NO HAY NI CONCEPTO NI NROCOMPROBANTE*/
        ],
        transaction: transaction_pa7_giama_renting,
      }
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 2
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movimientos 
      (Fecha, NroAsiento, Cuenta, DH, Importe) VALUES (?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          NroAsiento,
          cuentaALQU,
          "H",
          importe_neto,
          /*           observacion,
          comprobante, NO HAY NI CONCEPTO NI NROCOMPROBANTE*/
        ],
        transaction: transaction_pa7_giama_renting,
      }
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 3
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movimientos 
      (Fecha, NroAsiento, Cuenta, DH, Importe) VALUES (?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          NroAsiento,
          cuentaIC21,
          "H",
          importe_iva,
          /*observacion,
          comprobante, NO HAY NI CONCEPTO NI NROCOMPROBANTE*/
        ],
        transaction: transaction_pa7_giama_renting,
      }
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  transaction_giama_renting.commit();
  transaction_pa7_giama_renting.commit();
  return res.send({ status: true, message: "Alquiler ingresado con éxito" });
};
