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
    m.tipo
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
        4 AS tipo
    FROM pagos_clientes pc
    INNER JOIN formas_cobro fc 
        ON fc.id = pc.id_forma_cobro
    WHERE pc.id_cliente = ?


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
        1 AS tipo
    FROM alquileres a
    INNER JOIN vehiculos v 
        ON v.id = a.id_vehiculo
    LEFT JOIN pa7_giama_renting.facturas f 
        ON f.id = a.id_factura_pa6
    LEFT JOIN recibos ON a.nro_recibo = recibos.id
    WHERE a.id_cliente = ? AND IFNULL(recibos.anulado,0) = 0

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
        2 AS tipo
    FROM contratos_alquiler ca
    INNER JOIN vehiculos v 
        ON v.id = ca.id_vehiculo
    WHERE ca.id_cliente = ?
      AND ca.deposito_garantia > 0


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
        3 AS tipo
    FROM costos_ingresos ci
    INNER JOIN conceptos_costos cc 
        ON cc.id = ci.id_concepto
    LEFT JOIN pa7_giama_renting.facturas f 
        ON f.id = ci.id_factura_pa6
    WHERE ci.id_cliente = ?

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
    WHERE ca.deposito_garantia > 0


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

) m
INNER JOIN clientes c ON c.id = m.id_cliente
ORDER BY m.id_cliente, m.fecha, m.tipo;
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
  cuentas[nombre].saldo += (Number(r.debe) || 0) - (Number(r.haber) || 0);
});
  return res.send(cuentas)
} catch (error) {
  const { body } = handleError(error, "ficha", acciones.get);
  return res.send(body);
}

}






