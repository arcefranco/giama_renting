import { giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";

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
            observacion, nro_asiento],
        transaction: transaction
    })
} catch (error) {
    console.log(error)
    throw new Error ("Error al insertar un pago")
}
}