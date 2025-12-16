import { giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";
import { handleError } from "./handleError.js";
import { acciones } from "./handleError.js";
export const insertPago = async (
id_cliente,
fecha,  /**fecha del recibo */
usuario_alta_registro,
id_forma_cobro,
importe_cobro,
nro_recibo,
observacion,
nro_asiento,
transaction
) => {
let nombre_forma_cobro;
let observacion_final;
try {
    const result = await giama_renting.query(
      "SELECT nombre FROM formas_cobro WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_forma_cobro],
      }
    );
     nombre_forma_cobro = result[0]["nombre"]
  } catch (error) {
    const { body } = handleError(
      error,
      "nombre de la forma de cobro",
      acciones.get
    );
    throw new Error(body);
  }
observacion_final = `${nombre_forma_cobro} + ${observacion}`
try {
    await giama_renting.query(`
    INSERT INTO pagos_clientes 
        (id_cliente, 
        fecha,
        usuario_alta_registro,
        id_forma_cobro,
        importe_cobro,
        nro_recibo,
        observacion,
        nro_asiento)
    VALUES (?,?,?,?,?,?,?,?)`, {
        type: QueryTypes.INSERT,
        replacements: [id_cliente, fecha, usuario_alta_registro,
            id_forma_cobro, importe_cobro, nro_recibo,
            observacion_final, nro_asiento],
        transaction: transaction
    })
} catch (error) {
    console.log(error)
    throw new Error ("Error al insertar un pago")
}
}