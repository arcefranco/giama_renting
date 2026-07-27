import { giama_renting } from './helpers/connection.js';
import xlsx from "xlsx";

async function run() {
  const id_cliente = 219;
  try {
    const clienteResult = await giama_renting.query(
      `SELECT nombre, apellido, razon_social FROM clientes WHERE id = ?`,
      { replacements: [id_cliente], type: giama_renting.QueryTypes.SELECT }
    );
    let nombreCliente = "Cliente Desconocido";
    if (clienteResult.length > 0) {
      const c = clienteResult[0];
      nombreCliente = c.nombre ? `${c.nombre} ${c.apellido}` : c.razon_social;
    }
    console.log("Nombre:", nombreCliente);

    const resultado = await giama_renting.query(
      `SELECT
    m.fecha,
    m.concepto,
    m.nro_comprobante,
    m.debe,
    m.haber,
    @saldo := @saldo + IFNULL(m.debe, 0) - IFNULL(m.haber, 0) AS saldo,
    m.tipo,
    m.id_registro,
    m.garantia_devuelta
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
        pc.id AS id_registro,
        NULL AS garantia_devuelta
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
        a.id AS id_registro,
        NULL AS garantia_devuelta
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
        ca.id AS id_registro,
        ca.garantia_devuelta AS garantia_devuelta
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
        ci.id AS id_registro,
        NULL AS garantia_devuelta
    FROM costos_ingresos ci
    INNER JOIN conceptos_costos cc 
        ON cc.id = ci.id_concepto
    LEFT JOIN pa7_giama_renting.facturas f 
        ON f.id = ci.id_factura_pa6
    LEFT JOIN recibos ON ci.nro_recibo = recibos.id
    WHERE ci.id_cliente = ? AND IFNULL(recibos.anulado,0) = 0
    AND ci.anulado = 0

) AS m
CROSS JOIN (SELECT @saldo := 0) AS vars
ORDER BY m.fecha, m.tipo;`,
      {
        replacements: [id_cliente, id_cliente, id_cliente, id_cliente],
        type: giama_renting.QueryTypes.SELECT,
      }
    );

    let lastSaldo = 0;
    const formattedData = resultado.map(item => {
      lastSaldo = item.saldo ? Number(item.saldo) : 0;
      return {
        Fecha: item.fecha ? new Date(item.fecha).toLocaleDateString('es-AR') : '',
        Concepto: item.concepto || '',
        'Nro. Comprobante': item.nro_comprobante || '',
        Debe: item.debe ? Number(item.debe) : '',
        Haber: item.haber ? Number(item.haber) : '',
        'Garantía Dev.': item.garantia_devuelta ? Number(item.garantia_devuelta) : '',
        Saldo: lastSaldo
      };
    });

    formattedData.push({
      Fecha: 'Total',
      Concepto: '',
      'Nro. Comprobante': '',
      Debe: '',
      Haber: '',
      'Garantía Dev.': '',
      Saldo: lastSaldo
    });

    const worksheet = xlsx.utils.json_to_sheet(formattedData, { origin: "A4" });
    
    xlsx.utils.sheet_add_aoa(worksheet, [
      [`Cuenta Corriente: ${nombreCliente}`],
      [`Fecha de exportación: ${new Date().toLocaleDateString('es-AR')}`],
      []
    ], { origin: "A1" });

    const objectMaxLength = []; 
    formattedData.forEach((row) => {
      Object.entries(row).forEach(([key, value], idx) => {
        let columnValue = value ? value.toString().length : 0;
        let headerValue = key.length;
        let max = Math.max(columnValue, headerValue);
        objectMaxLength[idx] = max > (objectMaxLength[idx] || 0) ? max : objectMaxLength[idx];
      });
    });
    // Let's ensure headers are also counted (A4 is row 3 in 0-index)
    objectMaxLength[0] = Math.max(objectMaxLength[0] || 0, `Fecha de exportación: ${new Date().toLocaleDateString('es-AR')}`.length);

    worksheet['!cols'] = objectMaxLength.map(w => ({ width: w + 2 }));
    console.log("Success");
  } catch(e) {
    console.log(e);
  }
}
run();
