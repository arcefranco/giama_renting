//insertar pago, obtener cta cte cliente en particular, obtener todos los saldos de clientes
import { QueryError, QueryTypes } from "sequelize";
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
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { padWithZeros } from "../../helpers/padWithZeros.js";

const contra_asiento_factura = async (id_factura, nro_asiento_original, transaction_pa7_giama_renting, NroAsiento, NroAsientoSecundario) => {

const fecha = getTodayDate()

  //realizo los asientos
  try {

  const nro_comprobante = padWithZeros(`${NroAsiento}`, 13)
await giama_renting.query(
  `INSERT INTO c_movimientos (
    Fecha,
    NroAsiento,
    Cuenta,
    DH,
    Importe,
    Concepto,
    TipoComprobante,
    NroComprobante,
    AsientoSecundario
  )
  SELECT
    :fecha AS Fecha,
    :NroAsiento AS NroAsiento,
    Cuenta,
    CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END AS DH,
    Importe,
    CONCAT('Anulación de factura ${id_factura}') AS Concepto,
    'ASD' AS TipoComprobante,
    :nro_comprobante AS NroComprobante,
    :NroAsientoSecundario AS AsientoSecundario
  FROM c_movimientos
  WHERE NroAsiento = :nro_asiento_original
  `,
  {
    type: QueryTypes.INSERT,
    replacements: {fecha, NroAsiento, nro_comprobante, NroAsientoSecundario, nro_asiento_original },
    transaction: transaction_pa7_giama_renting
  }
);

await giama_renting.query(
  `INSERT INTO c2_movimientos (
    Fecha,
    NroAsiento,
    Cuenta,
    DH,
    Importe,
    Concepto,
    TipoComprobante,
    NroComprobante
  )
  SELECT
    :fecha AS Fecha,
    :NroAsientoSecundario AS NroAsiento,
    Cuenta,
    CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END AS DH,
    Importe,
    CONCAT('Anulación de recibo ${id_factura}') AS Concepto,
    'ASD' AS TipoComprobante,
    :nro_comprobante AS NroComprobante
  FROM c_movimientos
  WHERE NroAsiento = :nro_asiento_original
  `,
  {
    type: QueryTypes.INSERT,
    replacements: {fecha, NroAsientoSecundario, nro_comprobante, nro_asiento_original },
    transaction: transaction_pa7_giama_renting
  }
);

  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}
const contra_asiento_recibo = async (nro_recibo, transaction_pa7_giama_renting, NroAsiento, NroAsientoSecundario) => {

  let nro_asiento_original;
  let fecha;
  try {
    const result_pago = await giama_renting.query("SELECT * FROM pagos_clientes WHERE nro_recibo = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [nro_recibo]
      }
    )
    if (result_pago.length){
      nro_asiento_original = result_pago[0]["nro_asiento"]
    }else{
      throw new Error("No se encontró el numero de asiento del cobro original")
    }
  } catch (error) {
    console.log(error)
    throw new Error("Error al buscar el numero de asiento del cobro original")
  }
  //busco la fecha del recibo 
  try {
    let result = await giama_renting.query("SELECT Fecha FROM recibos WHERE id = ?", {
      type: QueryTypes.SELECT,
      replacements: [nro_recibo]
    })
    console.log(result)
    fecha = result[0]["Fecha"]
  } catch (error) {
    console.log(error)
    throw new Error("Error al buscar fecha del recibo")
  }



  //realizo los asientos
  try {

  const nro_comprobante = padWithZeros(`${NroAsiento}`, 13)
await giama_renting.query(
  `INSERT INTO c_movimientos (
    Fecha,
    NroAsiento,
    Cuenta,
    DH,
    Importe,
    Concepto,
    TipoComprobante,
    NroComprobante,
    AsientoSecundario
  )
  SELECT
    :fecha AS Fecha,
    :NroAsiento AS NroAsiento,
    Cuenta,
    CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END AS DH,
    Importe,
    CONCAT('Anulación de recibo ${nro_recibo}') AS Concepto,
    'ASD' AS TipoComprobante,
    :nro_comprobante AS NroComprobante,
    :NroAsientoSecundario AS AsientoSecundario
  FROM c_movimientos
  WHERE NroAsiento = :nro_asiento_original
  `,
  {
    type: QueryTypes.INSERT,
    replacements: {fecha, NroAsiento, nro_comprobante, NroAsientoSecundario, nro_asiento_original },
    transaction: transaction_pa7_giama_renting
  }
);

await giama_renting.query(
  `INSERT INTO c2_movimientos (
    Fecha,
    NroAsiento,
    Cuenta,
    DH,
    Importe,
    Concepto,
    TipoComprobante,
    NroComprobante
  )
  SELECT
    :fecha AS Fecha,
    :NroAsientoSecundario AS NroAsiento,
    Cuenta,
    CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END AS DH,
    Importe,
    CONCAT('Anulación de recibo ${nro_recibo}') AS Concepto,
    'ASD' AS TipoComprobante,
    :nro_comprobante AS NroComprobante
  FROM c_movimientos
  WHERE NroAsiento = :nro_asiento_original
  `,
  {
    type: QueryTypes.INSERT,
    replacements: {fecha, NroAsientoSecundario, nro_comprobante, nro_asiento_original },
    transaction: transaction_pa7_giama_renting
  }
);

  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}
const eliminarPago = async (nro_recibo) => {
  try {
    await giama_renting.query("DELETE FROM pagos_clientes WHERE nro_recibo = ?", {
      type: QueryTypes.DELETE,
      replacements: [nro_recibo]
    })
  } catch (error) {
    console.log(error)
    throw new Error ("Hubo un error al eliminar el pago")
  }
}

export const postPago = async (req, res) => {
    const {
    id_cliente,
    fecha,  
    id_forma_cobro,
    id_forma_cobro_2,
    id_forma_cobro_3,
    importe_cobro,
    importe_cobro_2,
    importe_cobro_3,
    observacion,
    //faltan
    usuario,
    } = req.body
    let nro_recibo;
    let NroAsiento;
    let NroAsientoSecundario;
    let transaction_giama_renting = await giama_renting.transaction()
    let transaction_pa7_giama_renting = await pa7_giama_renting.transaction()
    let cuenta_contable_forma_cobro;
    let cuenta_secundaria_forma_cobro;
    let cuenta_contable_forma_cobro_2;
    let cuenta_secundaria_forma_cobro_2;
    let cuenta_contable_forma_cobro_3;
    let cuenta_secundaria_forma_cobro_3;
  let importe_total_1_formateado = importe_cobro ? parseFloat(importe_cobro) : 0
  let importe_total_2_formateado = importe_cobro_2 ? parseFloat(importe_cobro_2) : 0 
  let importe_total_3_formateado = importe_cobro_3 ? parseFloat(importe_cobro_3) : 0
  let CUIT;
  let nombre_completo_cliente;
  console.log(usuario);
  const importe_total_cobro = (importe_total_1_formateado + importe_total_2_formateado + importe_total_3_formateado).toFixed(2)

    //buscar CUIT del cliente
    try {
    const result = await giama_renting.query(
      "SELECT nro_documento, nombre, apellido, razon_social FROM clientes WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_cliente],
      }
    );
    if (result[0]["nro_documento"]){
      CUIT = result[0]["nro_documento"]
    } 
    if(result[0]["nombre"] && result[0]["apellido"]){
      nombre_completo_cliente = `${result[0]["nombre"]} ${result[0]["apellido"]}`
    }else if(result[0]["razon_social"]){
      nombre_completo_cliente = `${result[0]["razon_social"]}`
    }else{
      nombre_completo_cliente = "SIN NOMBRE"
    }
    } catch (error) {
    const { body } = handleError(
      error,
      "documento del cliente",
      acciones.get
    );
    return res.send(body);
  }

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
  if(id_forma_cobro_2){
  cuenta_contable_forma_cobro_2 = await getCuentaContableFormaCobro(id_forma_cobro_2) 
  cuenta_secundaria_forma_cobro_2 = await getCuentaSecundariaFormaCobro(id_forma_cobro_2)
  }
  if(id_forma_cobro_3){
  cuenta_contable_forma_cobro_3 = await getCuentaContableFormaCobro(id_forma_cobro_3) 
  cuenta_secundaria_forma_cobro_3 = await getCuentaSecundariaFormaCobro(id_forma_cobro_3)
  }
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
        importe_total_cobro,
        usuario,
        id_cliente,
        null,
        null,
        null,
        id_forma_cobro,
        id_forma_cobro_2,
        id_forma_cobro_3,
        transaction_giama_renting,
        importe_cobro_2,
        importe_cobro_3,
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
    if(id_forma_cobro_2){
    await insertPago(    
    id_cliente,
    fecha,  
    usuario,
    id_forma_cobro_2,
    importe_cobro_2,
    nro_recibo,
    observacion,
    NroAsiento,
    transaction_giama_renting)
    }
    if(id_forma_cobro_3){
    await insertPago(    
    id_cliente,
    fecha,  
    usuario,
    id_forma_cobro_3,
    importe_cobro_3,
    nro_recibo,
    observacion,
    NroAsiento,
    transaction_giama_renting)
    }
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
let observacion_asientos = `RECIBO: ${nro_recibo} Nombre: ${nombre_completo_cliente} CUIT/CUIL: ${CUIT} Observación: ${observacion}`
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
  if(importe_cobro_2){
  await asientoContable(
    "c_movimientos",
    NroAsiento,
    cuenta_contable_forma_cobro_2,
    "D",
    importe_cobro_2,
    observacion_asientos,
    transaction_pa7_giama_renting,
    nro_recibo,
    fecha,
    NroAsientoSecundario,
    null
  );
  }
  if(importe_cobro_3){
  await asientoContable(
    "c_movimientos",
    NroAsiento,
    cuenta_contable_forma_cobro_3,
    "D",
    importe_cobro_3,
    observacion_asientos,
    transaction_pa7_giama_renting,
    nro_recibo,
    fecha,
    NroAsientoSecundario,
    null
  );
  }
  await asientoContable(
    "c_movimientos",
    NroAsiento,
    110310,//"cuenta_nueva",
    "H",
    importe_total_cobro,
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
  if(importe_cobro_2){
    await asientoContable(
    "c2_movimientos",
    NroAsientoSecundario,
    cuenta_secundaria_forma_cobro_2,
    "D",
    importe_cobro_2,
    observacion_asientos,
    transaction_pa7_giama_renting,
    nro_recibo,
    fecha
  );
  }
  if(importe_cobro_3){
    await asientoContable(
    "c2_movimientos",
    NroAsientoSecundario,
    cuenta_secundaria_forma_cobro_3,
    "D",
    importe_cobro_3,
    observacion_asientos,
    transaction_pa7_giama_renting,
    nro_recibo,
    fecha
  );
  }

    
  await asientoContable(
    "c2_movimientos",
    NroAsientoSecundario,
    110310, //cuenta_nueva_secundaria
    "H",
    importe_total_cobro,
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
return res.send({status: true, message: "Cobro ingresado correctamente", data: nro_recibo})
}

export const ctaCteCliente = async (req, res) => {
  const {id_cliente} = req.body
  try {
    const resultado = await giama_renting.query(`SELECT
    m.fecha,
    m.concepto,
    m.nro_comprobante,
    m.debe,
    m.haber,
    @saldo := @saldo + IFNULL(m.debe, 0) - IFNULL(m.haber, 0) AS saldo,
    m.tipo,
    m.id_registro
FROM (

    /* PAGOS */
    SELECT
        pc.fecha AS fecha,
        CONCAT(
            CASE 
                WHEN pc.observacion IS NOT NULL AND pc.observacion <> ''
                THEN CONCAT(' ', pc.observacion)
                ELSE ''
            END
        ) AS concepto,
        pc.nro_recibo AS nro_comprobante,
        NULL AS debe,
        pc.importe_cobro AS haber,
        4 AS tipo,
        pc.id AS id_registro
    FROM pagos_clientes pc
    INNER JOIN formas_cobro fc 
        ON fc.id = pc.id_forma_cobro
    LEFT JOIN recibos ON pc.nro_recibo = recibos.id
    WHERE pc.id_cliente = ? AND IFNULL(recibos.anulado,0) = 0


    UNION ALL


    /* ALQUILERES */
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
        f.numerofacturaemitida AS nro_comprobante,
        a.importe_total AS debe,
        NULL AS haber,
        1 AS tipo,
        a.id AS id_registro
    FROM alquileres a
    INNER JOIN vehiculos v 
        ON v.id = a.id_vehiculo
    LEFT JOIN pa7_giama_renting.facturas f 
        ON f.id = a.id_factura_pa6
    LEFT JOIN recibos ON a.nro_recibo = recibos.id
    WHERE a.id_cliente = ? AND IFNULL(recibos.anulado,0) = 0
    AND a.anulado = 0

    UNION ALL


    /* DEPOSITO */
    SELECT
        ca.fecha_contrato AS fecha,
        CONCAT(
            'Deposito gtia - ',
            v.dominio
        ) AS concepto,
        NULL AS nro_comprobante,
        ca.deposito_garantia AS debe,
        NULL AS haber,
        2 AS tipo,
        ca.id AS id_registro
    FROM contratos_alquiler ca
    INNER JOIN vehiculos v 
        ON v.id = ca.id_vehiculo
    LEFT JOIN recibos ON ca.nro_recibo = recibos.id
    WHERE ca.id_cliente = ?
      AND ca.deposito_garantia > 0
      AND IFNULL(recibos.anulado,0) = 0
      AND ca.anulado_deposito = 0


    UNION ALL


    /* COSTOS / INGRESOS */
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
        f.numerofacturaemitida AS nro_comprobante,
        ci.importe_total AS debe,
        NULL AS haber,
        3 AS tipo,
        ci.id AS id_registro
    FROM costos_ingresos ci
    INNER JOIN conceptos_costos cc 
        ON cc.id = ci.id_concepto
    LEFT JOIN pa7_giama_renting.facturas f 
        ON f.id = ci.id_factura_pa6
    LEFT JOIN recibos ON ci.nro_recibo = recibos.id
    WHERE ci.id_cliente = ? AND IFNULL(recibos.anulado,0) = 0
    AND ci.anulado = 0

) m
CROSS JOIN (SELECT @saldo := 0) vars
ORDER BY m.fecha, m.tipo;`, {
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
const {fecha} = req.body
const query = `SELECT
    m.id_cliente,
        COALESCE(
        NULLIF(CONCAT(c.nombre, ' ', c.apellido), ' '),
        c.razon_social
    ) AS nombre_cliente,
    m.fecha,
    m.concepto,
    m.nro_comprobante,
    m.debe,
    m.haber,
    m.tipo
FROM (

    /* PAGOS */
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
        pc.nro_recibo AS nro_comprobante,
        NULL AS debe,
        pc.importe_cobro AS haber,
        4 AS tipo
    FROM pagos_clientes pc
    LEFT JOIN recibos ON pc.nro_recibo = recibos.id
    WHERE IFNULL(recibos.anulado,0) = 0 and pc.anulado = 0

    UNION ALL


    /* ALQUILERES */
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
        f.numerofacturaemitida,
        a.importe_total,
        NULL,
        1 AS tipo
    FROM alquileres a
    INNER JOIN vehiculos v ON v.id = a.id_vehiculo
    LEFT JOIN pa7_giama_renting.facturas f 
        ON f.id = a.id_factura_pa6
    LEFT JOIN recibos ON a.nro_recibo = recibos.id
    WHERE IFNULL(recibos.anulado,0) = 0 and a.anulado = 0

    UNION ALL


    /* DEPOSITO */
    SELECT
        ca.id_cliente,
        ca.fecha_contrato,
        CONCAT('Deposito gtia - ', v.dominio),
        NULL,
        ca.deposito_garantia,
        NULL,
        2 AS tipo
    FROM contratos_alquiler ca
    INNER JOIN vehiculos v ON v.id = ca.id_vehiculo
    LEFT JOIN recibos ON ca.nro_recibo = recibos.id
    WHERE ca.deposito_garantia > 0
    AND IFNULL(recibos.anulado,0) = 0 and ca.anulado_deposito = 0


    UNION ALL


    /* COSTOS / INGRESOS */
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
        f.numerofacturaemitida,
        ci.importe_total,
        NULL,
        3 AS tipo
    FROM costos_ingresos ci
    INNER JOIN conceptos_costos cc ON cc.id = ci.id_concepto
    LEFT JOIN pa7_giama_renting.facturas f 
        ON f.id = ci.id_factura_pa6
    LEFT JOIN recibos ON ci.nro_recibo = recibos.id
    WHERE IFNULL(recibos.anulado,0) = 0 and ci.anulado = 0

) m
INNER JOIN clientes c ON c.id = m.id_cliente
WHERE c.es_cia_seguros = 0
ORDER BY m.id_cliente, m.fecha, m.tipo;
`
const query_fecha = `SELECT
    m.id_cliente,
    COALESCE(
        NULLIF(CONCAT(c.nombre, ' ', c.apellido), ' '),
        c.razon_social
    ) AS nombre_cliente,
    m.fecha,
    m.concepto,
    m.nro_comprobante,
    m.debe,
    m.haber,
    m.tipo
FROM (

    /* PAGOS */
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
        pc.nro_recibo AS nro_comprobante,
        NULL AS debe,
        pc.importe_cobro AS haber,
        4 AS tipo
    FROM pagos_clientes pc
    LEFT JOIN recibos ON pc.nro_recibo = recibos.id
    WHERE IFNULL(recibos.anulado,0) = 0
      AND pc.fecha <= :fecha and pc.anulado = 0

    UNION ALL

    /* ALQUILERES */
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
        f.numerofacturaemitida,
        a.importe_total,
        NULL,
        1 AS tipo
    FROM alquileres a
    INNER JOIN vehiculos v ON v.id = a.id_vehiculo
    LEFT JOIN pa7_giama_renting.facturas f 
        ON f.id = a.id_factura_pa6
    LEFT JOIN recibos ON a.nro_recibo = recibos.id
    WHERE IFNULL(recibos.anulado,0) = 0
      AND a.fecha_desde <= :fecha and a.anulado = 0

    UNION ALL

    /* DEPOSITO */
    SELECT
        ca.id_cliente,
        ca.fecha_contrato,
        CONCAT('Deposito gtia - ', v.dominio),
        NULL,
        ca.deposito_garantia,
        NULL,
        2 AS tipo
    FROM contratos_alquiler ca
    INNER JOIN vehiculos v ON v.id = ca.id_vehiculo
    LEFT JOIN recibos ON ca.nro_recibo = recibos.id
    WHERE ca.deposito_garantia > 0
      AND IFNULL(recibos.anulado,0) = 0
      AND ca.fecha_desde <= :fecha and ca.anulado_deposito = 0

    UNION ALL

    /* COSTOS / INGRESOS */
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
        f.numerofacturaemitida,
        ci.importe_total,
        NULL,
        3 AS tipo
    FROM costos_ingresos ci
    INNER JOIN conceptos_costos cc ON cc.id = ci.id_concepto
    LEFT JOIN pa7_giama_renting.facturas f 
        ON f.id = ci.id_factura_pa6
    LEFT JOIN recibos ON ci.nro_recibo = recibos.id
    WHERE IFNULL(recibos.anulado,0) = 0
      AND ci.fecha <= :fecha and ci.anulado = 0
) m
INNER JOIN clientes c ON c.id = m.id_cliente
WHERE c.es_cia_seguros = 0
ORDER BY m.id_cliente, m.fecha, m.tipo;
`;
if(fecha){
try {
    const rows = await giama_renting.query(query_fecha, {
      type: QueryTypes.SELECT,
      replacements: {fecha: fecha}
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
    cuentas[nombre].saldo += (Number(r.debe) || 0) - (Number(r.haber) || 0);
  });
    return res.send(cuentas)
  } catch (error) {
    const { body } = handleError(error, "ficha", acciones.get);
    return res.send(body);
  }
}else{
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
    cuentas[nombre].saldo += (Number(r.debe) || 0) - (Number(r.haber) || 0);
  });
    return res.send(cuentas)
  } catch (error) {
    const { body } = handleError(error, "ficha", acciones.get);
    return res.send(body);
  }

}

}

export const getEstadoDeuda = async (req, res) => {
  const { id, tipo } = req.body;
  let id_factura;
  let NumeroFacturaEmitida;
  let tabla;
  let tipo_factura;
  let CodigoCliente;
  let id_concepto;
  let genera_factura;
  //tipo 1: alquiler; tipo 3: ingreso; tipo 2: depósito
  //codigo 1: no hay factura; codigo 2: hay factura no emitida; codigo 3: hay factura emitida
  if(tipo == 1){
    tabla = "alquileres"
  }else if(tipo == 3){
    tabla = "costos_ingresos"
  }
  else if(tipo == 2){
    return res.send({status: true, codigo: 4, message: "El registro no generó factura. Se realizará una reversión del asiento. ¿Desea continuar?", id_registro: id, tipo_deuda: tipo})
  }
  else{
    return res.send({status: false, message: "Error al determinar el tipo de deuda."})
  }
  if(tipo == 3){
    try {
      const result_concepto = await giama_renting.query("SELECT id_concepto FROM costos_ingresos WHERE id = ?",{
        type: QueryTypes.SELECT,
        replacements: [id]
      })
      id_concepto = result_concepto[0]["id_concepto"]
      const result_genera_factura = await giama_renting.query("SELECT genera_factura FROM conceptos_costos WHERE id = ?", {
        type: QueryTypes.SELECT,
        replacements: [id_concepto]
      })
      genera_factura = result_genera_factura[0]["genera_factura"]
  
      if(genera_factura == 0){
        return res.send({status: true, codigo: 4, message: "El registro no generó factura. Se realizará una reversión del asiento. ¿Desea continuar?", id_registro: id, tipo_deuda: tipo})
      }
      
    } catch (error) {
      console.log(error)
      return res.send({status: false, message: "Error al reconocer el concepto del ingreso"})
    }
  }
  try {
    const result = await giama_renting.query(
      `SELECT id_factura_pa6 FROM ${tabla} WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    id_factura = result[0]?.id_factura_pa6;
    
  } catch (error) {
    const { body } = handleError(error, tabla, acciones.get);
    return res.send(body);
  }

  if(!id_factura){
    return res.send({status: true, codigo: 1, message: "El registro de alquiler no tiene factura asociada. Consultar con sistemas."})
  }else{
  try {
   const result = await pa7_giama_renting.query(
      "SELECT * FROM facturas WHERE Id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_factura],
      }
    );
    if (!result || result.length === 0) {
      return res.send({ status: false, message: "Factura no encontrada" });
    }
    const factura = result[0];
    NumeroFacturaEmitida = factura.NumeroFacturaEmitida;
    tipo_factura = factura.Tipo;
    CodigoCliente = factura.CodigoCliente;
    if(NumeroFacturaEmitida){
      return res.send({status: true, codigo: 2, message: "Si se anula esta factura se deberá generar una nota de crédito. ¿Desea continuar?", tipo: tipo_factura, cliente: CodigoCliente, id_registro: id, id_factura: id_factura, tipo_deuda: tipo})
    }else{
      return res.send({status: true, codigo: 3, message: "Si se anula esta factura se eliminará su registro. ¿Desea continuar?", tipo: tipo_factura, cliente: CodigoCliente, id_registro: id, id_factura: id_factura, tipo_deuda: tipo})
    }
    } catch (error) {
    console.log(error)
    const { body } = handleError(error, "Factura", acciones.get);
    return res.send(body);
    }


}
}

export const anulacionFactura = async (req, res) => {
  const {id_registro, id_factura, tipo_factura, cliente, tipo} = req.body
  if(!id_factura || !id_registro || !tipo_factura ||!cliente || !tipo){
   return res.send({status: false, message: "Faltan datos para completar la operación"})
  }
  let tipo_NC;
  let NumeroFacturaEmitida;
  let CAE;
  let VtoCAE;
  let tabla;
  let campo;
  let fecha_anulacion_campo;
  let NroAsientoFactura;
  let NroAsiento_nuevo;
  let NroAsientoSecundario_nuevo;
  if(tipo == 1){
    tabla = "alquileres"
    campo = "anulado"
    fecha_anulacion_campo = "fecha_anulacion"
  }else if(tipo == 3){
    tabla = "costos_ingresos"
    campo = "anulado"
    fecha_anulacion_campo = "fecha_anulacion"
  }else if(tipo == 2){
    tabla = "contratos_alquiler"
    campo = "anulado_deposito"
    fecha_anulacion_campo = "fecha_anulacion_deposito"
  }else{
    return res.send({status: false, message: "Error al determinar el tipo de deuda."})
  }
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  try {
    NroAsiento_nuevo = await getNumeroAsiento();
    NroAsientoSecundario_nuevo = await getNumeroAsientoSecundario();
    const registro_original = await giama_renting.query(`SELECT * FROM ${tabla} WHERE id = ${id_registro}`)
    if(!registro_original[0].length){
      return res.send({status: false, message: "Error al encontrar el registro original"})
    }else{
      console.log(registro_original[0])
    }
    const result = await pa7_giama_renting.query(
      "SELECT * FROM facturas WHERE Id = ? AND tipo = ? AND CodigoCliente =  ?", {
        type: QueryTypes.SELECT,
        replacements: [id_factura, tipo_factura, cliente]
      }
    )
    if(!result.length){
      return res.send({status: false, message: "No se encontró la factura"})
    }
    const factura = result[0]
    NumeroFacturaEmitida = factura.NumeroFacturaEmitida;
    CAE = factura.CAE;
    VtoCAE = factura.VtoCAE;
    NroAsientoFactura = factura.NroAsiento;
    if(factura.Tipo === "FA"){
      tipo_NC = "CA"
    }else if(factura.Tipo === "FB"){
      tipo_NC = "CB"
    }

        if (!NumeroFacturaEmitida && !CAE && !VtoCAE) {
    
          await pa7_giama_renting.query("DELETE FROM facturasitems WHERE IdFactura = ?", {
            type: QueryTypes.DELETE,
            replacements: [id_factura],
            transaction: transaction_pa7_giama_renting
          });
          await pa7_giama_renting.query("DELETE FROM facturas WHERE Id = ?", {
            type: QueryTypes.DELETE,
            replacements: [id_factura],
            transaction: transaction_pa7_giama_renting
          });
    
          await contra_asiento_factura(id_factura, NroAsientoFactura, transaction_pa7_giama_renting, NroAsiento_nuevo, NroAsientoSecundario_nuevo);
          await giama_renting.query(`UPDATE ${tabla} SET ${campo} = 1, ${fecha_anulacion_campo} = ? WHERE id = ?`,{
            type: QueryTypes.UPDATE,
            replacements: [getTodayDate(), id_registro],
            transaction: transaction_giama_renting
          })
          await transaction_giama_renting.commit(); 
          await transaction_pa7_giama_renting.commit();  
    
          return res.send({ status: true, message: "Factura anulada correctamente" });
    
        } else if (!NumeroFacturaEmitida || !CAE || !VtoCAE) {
    
          return res.send({
            status: false,
            message: "La factura aún no puede ser eliminada",
          });
    
        } else {
          const { Id, Tipo, PuntoVenta, FacAsoc, NumeroFacturaEmitida, VtoCAE, CAE, NroAsiento, NroAsiento2, ...otrosCampos } = factura; 
          if (!tipo_NC) {
            return res.send({status: false, message: "No está aclarado el tipo de nota de crédito"})
          }
          let id_ndc;
          let FacAsoc_insertada = `${padWithZeros(PuntoVenta, 5)}${padWithZeros(NumeroFacturaEmitida, 8)}`;
          const result = await pa7_giama_renting.query(
            `INSERT INTO facturas 
             (Tipo, FacAsoc, PuntoVenta, NumeroFacturaEmitida, VtoCAE, CAE, NroAsiento, NroAsiento2, ${Object.keys(otrosCampos).join(", ")})
             VALUES (?,?,?,?,?,?,?,?, ${Object.keys(otrosCampos).map(() => "?").join(", ")})`,
            {
              type: QueryTypes.INSERT,
              replacements: [tipo_NC, FacAsoc_insertada, PuntoVenta, null, null, null, NroAsiento_nuevo, NroAsientoSecundario_nuevo, ...Object.values(otrosCampos)],
              transaction: transaction_pa7_giama_renting
            }
          );
          id_ndc = result[0]
          
          const descripcion_facturas_items = `Anulación factura ${Tipo} ${padWithZeros(PuntoVenta, 5)}-${padWithZeros(NumeroFacturaEmitida, 8)}`
          await giama_renting.query(
            `INSERT INTO facturasitems (
              IdFactura,
              TipoAlicuota,
              Descripcion,
              Cantidad,
              PrecioUnitario,
              Porcentaje,
              Subtotal,
              usd_precio_unitario,
              usd_subtotal
            )
            SELECT
              :id_ndc AS IdFactura,
              TipoAlicuota,
              :descripcion_facturas_items AS Descripcion,
              Cantidad,
              PrecioUnitario,
              Porcentaje,
              Subtotal,
              usd_precio_unitario,
              usd_subtotal
            FROM facturasitems
            WHERE IdFactura = :id_factura
            `,
            {
              type: QueryTypes.INSERT,
              replacements: {id_ndc, descripcion_facturas_items, id_factura},
              transaction: transaction_pa7_giama_renting
            }
          );
          await contra_asiento_factura(id_factura, NroAsientoFactura, transaction_pa7_giama_renting, NroAsiento_nuevo, NroAsientoSecundario_nuevo);
          await giama_renting.query(`UPDATE ${tabla} SET ${campo} = 1, ${fecha_anulacion_campo} = ? WHERE id = ?`,{
            type: QueryTypes.UPDATE,
            replacements: [getTodayDate(), id_registro],
            transaction: transaction_giama_renting
          })
  
          await transaction_giama_renting.commit(); 
          await transaction_pa7_giama_renting.commit();  
          return res.send({ status: true, message: `Factura anulada correctamente. Nota de crédito generada (id comprobante: ${id_ndc})`});
        }
    
  } catch (error) {
    console.log(error)
    await transaction_giama_renting.rollback();
    await transaction_pa7_giama_renting.rollback();
    const { body } = handleError(error, "factura", acciones.delete);
    return res.send(body);
  }
}

export const anulacionRecibo = async (req, res) => {
  const { nro_recibo } = req.body;
  let NroAsiento_nuevo;
  let NroAsientoSecundario_nuevo;
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  //busco numeros de asiento
  try {
    NroAsiento_nuevo = await getNumeroAsiento();
    NroAsientoSecundario_nuevo = await getNumeroAsientoSecundario();
  } catch (error) {
    console.log(error)
    return res.send({status: false, message: "Error al obtener número de asiento"})
  }
    try {
      await contra_asiento_recibo(nro_recibo, transaction_pa7_giama_renting, NroAsiento_nuevo, NroAsientoSecundario_nuevo);
      await eliminarPago(nro_recibo);
      await giama_renting.query("UPDATE recibos SET anulado = ?, fecha_anulacion = ? WHERE id = ?",{
        type: QueryTypes.UPDATE,
        replacements: [1, getTodayDate(), nro_recibo],
        transaction: transaction_giama_renting
      })

      await transaction_giama_renting.commit(); 
      await transaction_pa7_giama_renting.commit();  

      return res.send({ status: true, message: "Recibo anulado correctamente" });
    } catch (error) {
      console.log(error)
    await transaction_giama_renting.rollback();
    await transaction_pa7_giama_renting.rollback();
    const { body } = handleError(error, "Recibo", acciones.delete);
    return res.send(body);
    }

  

};

export const anulacionDeuda = async (req, res) => {
  const {tipo, id_registro} = req.body
  let tabla;
  let campo;
  let campo_fecha_anulacion;
  let nro_asiento_original;
  let NroAsiento_nuevo;
  let NroAsientoSecundario_nuevo;
  if(tipo == 2){
    tabla = "contratos_alquiler"
    campo = "anulado_deposito"
    campo_fecha_anulacion = "fecha_anulacion_deposito"
  }
  else if(tipo == 3){
    tabla = "costos_ingresos"
    campo = "anulado"
    campo_fecha_anulacion = "fecha_anulacion"
  }else{
    return res.send({status: false, message: "Error al determinar registro"})
  }

  try {
    const result = await giama_renting.query(
      `SELECT nro_asiento FROM ${tabla} WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id_registro],
      }
    );
    console.log(result)
    if(!result.length){
      return res.send({status: false, message: "Error al obtener numero de asiento original"})
    }
    nro_asiento_original = result[0]["nro_asiento"];
    
  } catch (error) {
    const { body } = handleError(error, tabla, acciones.get);
    return res.send(body);
  }
  try {
    NroAsiento_nuevo = await getNumeroAsiento();
    NroAsientoSecundario_nuevo = await getNumeroAsientoSecundario();
  } catch (error) {
    console.log(error)
    return res.send({status: false, message: "Error al obtener número de asiento"})
  }
  const fecha = getTodayDate()

let transaction_pa7_giama_renting = await pa7_giama_renting.transaction()
try {
  const nro_comprobante = padWithZeros(`${NroAsiento_nuevo}`, 13)
  await giama_renting.query(
  `INSERT INTO c_movimientos (
    Fecha,
    NroAsiento,
    Cuenta,
    DH,
    Importe,
    Concepto,
    TipoComprobante,
    NroComprobante,
    AsientoSecundario
  )
  SELECT
    :fecha AS Fecha,
    :NroAsiento_nuevo AS NroAsiento,
    Cuenta,
    CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END AS DH,
    Importe,
    CONCAT('Anulación de asiento ${nro_asiento_original}') AS Concepto,
    'ASD' AS TipoComprobante,
    :nro_comprobante AS NroComprobante,
    :NroAsientoSecundario_nuevo AS AsientoSecundario
  FROM c_movimientos
  WHERE NroAsiento = :nro_asiento_original
  `,
  {
    type: QueryTypes.INSERT,
    replacements: {fecha, NroAsiento_nuevo, nro_comprobante, NroAsientoSecundario_nuevo, nro_asiento_original },
    transaction: transaction_pa7_giama_renting
  }
);

  await giama_renting.query(
  `INSERT INTO c2_movimientos (
    Fecha,
    NroAsiento,
    Cuenta,
    DH,
    Importe,
    Concepto,
    TipoComprobante,
    NroComprobante
  )
  SELECT
    :fecha AS Fecha,
    :NroAsientoSecundario_nuevo AS NroAsiento,
    Cuenta,
    CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END AS DH,
    Importe,
    CONCAT('Anulación de asiento original ${nro_asiento_original}') AS Concepto,
    'ASD' AS TipoComprobante,
    :nro_comprobante AS NroComprobante
  FROM c_movimientos
  WHERE NroAsiento = :nro_asiento_original
  `,
  {
    type: QueryTypes.INSERT,
    replacements: {fecha, NroAsientoSecundario_nuevo, nro_comprobante, nro_asiento_original },
    transaction: transaction_pa7_giama_renting
  }
  );
    await giama_renting.query(
      `UPDATE ${tabla} SET ${campo} = 1, ${campo_fecha_anulacion} = ? WHERE id = ?`,
      {
        type: QueryTypes.UPDATE,
        replacements: [fecha, id_registro],
      }
    );
    await transaction_pa7_giama_renting.commit()
    return res.send({status: true, message: "Comprobante anulado correctamente"})


  } catch (error) {
    console.log(error);
    await transaction_pa7_giama_renting.rollback()
    return res.send({status: false, message: "Error al anular el comprobante"})
  }

}




