//insertar pago, obtener cta cte cliente en particular, obtener todos los saldos de clientes
import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { insertRecibo } from "../../helpers/insertRecibo.js";
import { insertPago } from "../../helpers/insertPago.js";
import {asientoContable} from "../../helpers/asientoContable.js"
import {
  getNumeroAsiento,
  getNumeroAsientoSecundario,
} from "../../helpers/getNumeroAsiento.js";
import { getCuentaContableFormaCobro, getCuentaSecundariaFormaCobro } from "../../helpers/getCuentaContableFormaCobro.js";
import { handleError, acciones } from "../../helpers/handleError.js";

export const postPago = async (req, res) => {
    const {
    id_cliente,
    fecha,  
    id_forma_cobro,
    importe_cobro,
    observacion,
    //faltan
    usuario,
    } = req.body
    let nro_recibo;
    let NroAsiento;
    let NroAsientoSecundario;
    let transaction_giama_renting = await giama_renting.transaction()
    let transaction_pa7_giama_renting = await pa7_giama_renting.transaction()
    let cuenta_contable_forma_cobro
    let cuenta_secundaria_forma_cobro
  try {
    NroAsiento = await getNumeroAsiento();
    NroAsientoSecundario = await getNumeroAsientoSecundario();
  } catch (error) {
    console.log(error)
    const { body } = handleError(error, "número de asiento");
    return res.send(body);
  }
  //cuenta contable de la forma de cobro
  try {
  cuenta_contable_forma_cobro = await getCuentaContableFormaCobro(id_forma_cobro) 
  cuenta_secundaria_forma_cobro = await getCuentaSecundariaFormaCobro(id_forma_cobro)
  } catch (error) {
  console.log(error);
  const { body } = handleError(error, "parámetro");
  return res.send(body);
  }
//inserto el recibo
  try {
    nro_recibo = await insertRecibo(
        fecha,
        observacion,
        importe_cobro,
        usuario,
        id_cliente,
        null,
        null,
        null,
        id_forma_cobro,
        null,
        null,
        null,
        transaction_giama_renting,
        null,
        null,
        importe_cobro
    )
} catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    const { body } = handleError(error, "Recibo de alquiler", acciones.post);
    return res.send(body);
  }
//inserto el pago
  try {
    await insertPago(    
    id_cliente,
    fecha,  
    usuario,
    id_forma_cobro,
    importe_cobro,
    nro_recibo,
    observacion,
    NroAsiento,
    transaction_giama_renting)
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    const { body } = handleError(
        error,
        "pago",
        acciones.post
    );
    return res.send(body);
  }
let observacion_asientos = `RECIBO: ${nro_recibo} Observación: ${observacion}`
//asientos
try {
  await asientoContable(
    "c_movimientos",
    NroAsiento,
    cuenta_contable_forma_cobro,
    "D",
    importe_cobro,
    observacion_asientos,
    transaction_pa7_giama_renting,
    nro_recibo,
    fecha,
    NroAsientoSecundario,
    null
  );
  await asientoContable(
    "c_movimientos",
    NroAsiento,
    110308,//"cuenta_nueva",
    "H",
    importe_cobro,
    observacion_asientos,
    transaction_pa7_giama_renting,
    nro_recibo,
    fecha,
    NroAsientoSecundario,
    null
  );
  await asientoContable(
    "c2_movimientos",
    NroAsientoSecundario,
    cuenta_secundaria_forma_cobro,
    "D",
    importe_cobro,
    observacion_asientos,
    transaction_pa7_giama_renting,
    nro_recibo,
    fecha
  );
    
  await asientoContable(
    "c2_movimientos",
    NroAsientoSecundario,
    110308, //cuenta_nueva_secundaria
    "H",
    importe_cobro,
    observacion_asientos,
    transaction_pa7_giama_renting,
    nro_recibo,
    fecha,
    null,
    null
  );
  
} catch (error) {
console.log(error);
transaction_giama_renting.rollback();
transaction_pa7_giama_renting.rollback();
const { body } = handleError(error);
return res.send(body);
}

await transaction_giama_renting.commit()
await transaction_pa7_giama_renting.commit()
return res.send({status: true, message: "Cobro ingresado correctamente"})



}

export const ctaCteCliente = async (req, res) => {
  const {id_cliente} = req.body
  try {
    const resultado = await giama_renting.query(`SELECT
    m.fecha,
    m.concepto,
    m.debe,
    m.haber,
    @saldo := @saldo + IFNULL(m.haber, 0) - IFNULL(m.debe, 0) AS saldo
FROM (

    SELECT
        pc.fecha AS fecha,
        CONCAT(
            CASE 
                WHEN pc.observacion IS NOT NULL AND pc.observacion <> ''
                THEN CONCAT(' ', pc.observacion)
                ELSE ''
            END
        ) AS concepto,
        NULL AS debe,
        pc.importe_cobro AS haber
    FROM pagos_clientes pc
    INNER JOIN formas_cobro fc 
        ON fc.id = pc.id_forma_cobro
    WHERE pc.id_cliente = ?

    UNION ALL

    SELECT
        a.fecha_alquiler AS fecha,
        CONCAT(
            'Alquiler - ',
            v.dominio,
            ' - ',
            DATE_FORMAT(a.fecha_desde, '%d/%m/%Y'),
            ' al ',
            DATE_FORMAT(a.fecha_hasta, '%d/%m/%Y')
        ) AS concepto,
        a.importe_total AS debe,
        NULL AS haber
    FROM alquileres a
    INNER JOIN vehiculos v 
        ON v.id = a.id_vehiculo
    WHERE a.id_cliente = ?

    UNION ALL

    SELECT
        ca.fecha_contrato AS fecha,
        CONCAT(
            'Deposito gtia - ',
            v.dominio
        ) AS concepto,
        ca.deposito_garantia AS debe,
        NULL AS haber
    FROM contratos_alquiler ca
    INNER JOIN vehiculos v 
        ON v.id = ca.id_vehiculo
    WHERE ca.id_cliente = ?
      AND ca.deposito_garantia > 0

    UNION ALL

    SELECT
        ci.fecha AS fecha,
        CONCAT(
            cc.nombre,
            CASE 
                WHEN ci.observacion IS NOT NULL AND ci.observacion <> ''
                THEN CONCAT(' ', ci.observacion)
                ELSE ''
            END
        ) AS concepto,
        ci.importe_total AS debe,
        NULL AS haber
    FROM costos_ingresos ci
    INNER JOIN conceptos_costos cc 
        ON cc.id = ci.id_concepto
    WHERE ci.id_cliente = ?

) m
CROSS JOIN (SELECT @saldo := 0) vars
ORDER BY m.fecha;`, {
      type: QueryTypes.SELECT,
      replacements: [id_cliente, id_cliente, id_cliente, id_cliente]
    });
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "cuenta corriente del cliente", acciones.get);
    return res.send(body);
  }
}

export const fichaCtaCte = async (req, res) => {
const query = `SELECT
    m.id_cliente,
    CONCAT(c.nombre, ' ', c.apellido) AS nombre_cliente,
    m.fecha,
    m.concepto,
    m.debe,
    m.haber
FROM (

    SELECT
        pc.id_cliente,
        pc.fecha,
        CONCAT(
            CASE 
                WHEN pc.observacion IS NOT NULL AND pc.observacion <> ''
                THEN CONCAT(' ', pc.observacion)
                ELSE ''
            END
        ) AS concepto,
        NULL AS debe,
        pc.importe_cobro AS haber
    FROM pagos_clientes pc

    UNION ALL

    SELECT
        a.id_cliente,
        a.fecha_alquiler,
        CONCAT(
            'Alquiler - ',
            v.dominio,
            ' - ',
            DATE_FORMAT(a.fecha_desde, '%d/%m/%Y'),
            ' al ',
            DATE_FORMAT(a.fecha_hasta, '%d/%m/%Y')
        ),
        a.importe_total,
        NULL
    FROM alquileres a
    INNER JOIN vehiculos v ON v.id = a.id_vehiculo

    UNION ALL

    SELECT
        ca.id_cliente,
        ca.fecha_contrato,
        CONCAT('Deposito gtia - ', v.dominio),
        ca.deposito_garantia,
        NULL
    FROM contratos_alquiler ca
    INNER JOIN vehiculos v ON v.id = ca.id_vehiculo
    WHERE ca.deposito_garantia > 0

    UNION ALL

    SELECT
        ci.id_cliente,
        ci.fecha,
        CONCAT(
            cc.nombre,
            CASE 
                WHEN ci.observacion IS NOT NULL AND ci.observacion <> ''
                THEN CONCAT(' ', ci.observacion)
                ELSE ''
            END
        ),
        ci.importe_total,
        NULL
    FROM costos_ingresos ci
    INNER JOIN conceptos_costos cc ON cc.id = ci.id_concepto

) m
INNER JOIN clientes c ON c.id = m.id_cliente
ORDER BY m.id_cliente, m.fecha;

`
try {
  const rows = await giama_renting.query(query, {
    type: QueryTypes.SELECT
  });
  
const cuentas = {};

rows.forEach(r => {
  const nombre = r.nombre_cliente?.trim() || `Cliente ${r.id_cliente}`;

  if (!cuentas[nombre]) {
    cuentas[nombre] = {
      id_cliente: r.id_cliente,
      nombre_cliente: nombre,
      saldo: 0,
      detalle: []
    };
  }

  cuentas[nombre].detalle.push(r);
  cuentas[nombre].saldo += (Number(r.haber) || 0) - (Number(r.debe) || 0);
});
  return res.send(cuentas)
} catch (error) {
  const { body } = handleError(error, "ficha", acciones.get);
  return res.send(body);
}

}






