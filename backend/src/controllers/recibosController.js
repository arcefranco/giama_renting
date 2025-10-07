import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { handleError, acciones } from "../../helpers/handleError.js";
import { formatearFechaISOText } from "../../helpers/formatearFechaISO.js";
import dotenv from "dotenv";
import { asientoContable } from "../../helpers/asientoContable.js";
dotenv.config();
import { getParametro } from "../../helpers/getParametro.js";
import { padWithZeros } from "../../helpers/padWithZeros.js";
import {
  getNumeroAsiento,
  getNumeroAsientoSecundario,
} from "../../helpers/getNumeroAsiento.js";
const imageBase64 = `data:image/png;base64,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`;

export const getReciboById = async (req, res) => {
  const { id } = req.body;
  const serverURL = process.env.SERVER;
  const imageURL = `${serverURL}/public/images/Vector.png`;
  try {
    const data = await giama_renting.query(
      `SELECT 
        r.id AS nro_recibo,
        r.fecha,
        r.detalle,
        r.importe_total,
        r.usuario_alta,
        r.fecha_alta_registro,
        r.id_cliente,
        r.id_vehiculo,
        r.id_forma_cobro,
        c.nombre AS nombre_cliente,
        c.apellido AS apellido_cliente,
        c.direccion,
        c.nro_direccion AS numero_direccion,
        f.nombre AS nombre_forma_cobro,
        u.nombre AS nombre_usuario,
        s.nombre AS nombre_sucursal
      FROM recibos r
      LEFT JOIN clientes c ON c.id = r.id_cliente
      LEFT JOIN formas_cobro f ON f.id = r.id_forma_cobro
      LEFT JOIN usuarios u ON u.email = r.usuario_alta
      LEFT JOIN vehiculos v ON v.id = r.id_vehiculo
      LEFT JOIN sucursales s ON s.id = v.sucursal
      WHERE r.id = ?
      `,
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );

    if (!data.length)
      return res
        .status(404)
        .json({ status: false, message: "Recibo no encontrado" });

    const recibo = data[0];

    // Generamos HTML básico
    const html = `
      <div style="font-family: Arial; max-width: 700px; margin: 0 auto; padding: 20px; border: 1px solid #ccc">
        <h4 style="text-align: center;">Recibo de Pago</h4>
           <h3 style="text-align: center;">DOUMENTO NO VÁLIDO COMO FACTURA</h3>
        <img src="${imageURL}" alt="Logo" style="height: 180px; margin: 10px auto; display: block;" />
        <div style="display: grid; grid-template-columns: 1fr 1fr; justify-content: space-between; margin-bottom: 20px; font-size: 11px">
          <div>           
            <h4>Emisor</h4>
            <div>
            <p><b>Nombre: </b> Giama Renting</p>
            </div>
            <div>
            <p><b>IVA Responsable Inscripto CUIT 30-71228441-9</b></p>
            </div>
            <div>
            <p><b>Teléfono: </b> +54 3534246184</p>
            </div>
            <div>
            <p><b>Email: </b></p>
            </div>
          </div>
          <div>
            <h4>Receptor</h4>
            <div>
              <p><b>Nombre: </b> ${recibo.nombre_cliente} ${
      recibo.apellido_cliente
    }</p>
            </div>
            <div>
              <p><b>Dirección: </b>${recibo.direccion} ${
      recibo.numero_direccion
    }</p>
            </div>
          </div>
        </div>

        <h4>Detalle del Pago</h4>
        <div style="width: 100%;  margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; font-size: 12px;">
          <div>
            <p><b>Pago: </b> # ${id}</p>
          </div>
          <div>
            <p><b>Fecha Pago: </b>  ${formatearFechaISOText(recibo.fecha)}</p>
          </div>
           <div>
            <p><b>Tipo Pago: </b> ${recibo.nombre_forma_cobro}</p>
          </div>
           <div>
            <p><b>Creado por: </b> ${recibo.nombre_usuario}</p>
          </div>
           <div>
            <p><b>Cuenta: </b> Giama Renting</p>
          </div>
           <div>
          </div>
           <div>
            <p><b>Sucursal: </b> ${recibo.nombre_sucursal}</p>
          </div>
          <div>
          </div>
        </div>
        
        
        <h5>Detalle</h5>
        <div style="display: flex;  justify-content: space-between; font-size: 12px">
        <p>${recibo.detalle}</p>
        <p>$${recibo.importe_total}</p>
        </div>
        <hr/>
        <div style="margin-top: 40px; text-align: right;">
          <p>_________________________</p>
          <p>Nombre y Firma Emisor</p>
        </div>
      </div>
    `;

    return res.send({ status: true, data: { html: html } });
  } catch (error) {
    console.error(error);
    return res.send({ status: false, message: "Error al generar el recibo" });
  }
};

export const getRecibos = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM recibos", {
      type: QueryTypes.SELECT
    })
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Recibo", acciones.get);
    return res.send(body);
  }
}


//FUNCION AUXILIAR
const contra_asiento_recibo = async (id, transaction_giama_renting, transaction_pa7_giama_renting) => {
  let NroAsiento;
  let NroAsientoSecundario;

  const result_costo = await giama_renting.query(
      `SELECT * FROM costos_ingresos 
      WHERE nro_recibo = ?
      AND id_concepto IN (
      SELECT id FROM conceptos_costos WHERE genera_recibo = 1)`,
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    if(!result_costo.length){
      throw new Error("No se encontraron registros de ingresos asociados")
    }
  const costo_ingreso = result_costo[0]

  const {nro_asiento} = costo_ingreso

  //busco numeros de asiento
  try {
    NroAsiento = await getNumeroAsiento();
    NroAsientoSecundario = await getNumeroAsientoSecundario();
  } catch (error) {
      throw error;
  }
  //realizo los asientos
  try {
  const today = getTodayDate()
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
    :today AS Fecha,
    :NroAsiento AS NroAsiento,
    Cuenta,
    CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END AS DH,
    Importe,
    CONCAT('Anulación de recibo ${id}') AS Concepto,
    'ASD' AS TipoComprobante,
    :nro_comprobante AS NroComprobante,
    :NroAsientoSecundario AS AsientoSecundario
  FROM c_movimientos
  WHERE NroAsiento = :nro_asiento
  `,
  {
    type: QueryTypes.INSERT,
    replacements: {today, NroAsiento, nro_comprobante, NroAsientoSecundario, nro_asiento },
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
    :today AS Fecha,
    :NroAsientoSecundario AS NroAsiento,
    Cuenta,
    CASE WHEN DH = 'D' THEN 'H' ELSE 'D' END AS DH,
    Importe,
    CONCAT('Anulación de recibo ${id}') AS Concepto,
    'ASD' AS TipoComprobante,
    :nro_comprobante AS NroComprobante
  FROM c_movimientos
  WHERE NroAsiento = :nro_asiento
  `,
  {
    type: QueryTypes.INSERT,
    replacements: {today, NroAsientoSecundario, nro_comprobante, nro_asiento },
    transaction: transaction_pa7_giama_renting
  }
);
   /*  await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_concepto,
      "D",
      importe_neto,
      `Anulación de recibo ${id}`,
      transaction_pa7_giama_renting,
      padWithZeros(`${NroAsiento}`, 13),
      getTodayDate(),
      NroAsientoSecundario,
      "ASD"
      );
      await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaIVA,
      "D",
      importe_iva,
      `Anulación de recibo ${id}`,
      transaction_pa7_giama_renting,
      padWithZeros(`${NroAsiento}`, 13),
      getTodayDate(),
      NroAsientoSecundario,
      "ASD"
      );
      await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_forma_cobro,
      "H",
      importe_total,
      `Anulación de recibo ${id}`,
      transaction_pa7_giama_renting,
      padWithZeros(`${NroAsiento}`, 13),
      getTodayDate(),
      NroAsientoSecundario,
      "ASD"
      );
      //asientos secundarios
      await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_concepto,
      "D",
      importe_neto,
      `Anulación de recibo ${id}`,
      transaction_pa7_giama_renting,
      padWithZeros(`${NroAsiento}`, 13),
      getTodayDate(),
      null,
      "ASD"
      );
      await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaSecundariaIVA,
      "D",
      importe_iva,
      `Anulación de recibo ${id}`,
      transaction_pa7_giama_renting,
      padWithZeros(`${NroAsiento}`, 13),
      getTodayDate(),
      null,
      "ASD"
      );
      await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_forma_cobro,
      "H",
      importe_total,
      `Anulación de recibo ${id}`,
      transaction_pa7_giama_renting,
      padWithZeros(`${NroAsiento}`, 13),
      getTodayDate(),
      null,
      "ASD"
      ); */
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
}

export const anulacionRecibo = async (req, res) => {
  const { id } = req.body;
  let id_factura;
  let NumeroFacturaEmitida;
  let CAE;
  let VtoCAE;
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();

  try {
    const result = await giama_renting.query(
      "SELECT id_factura_pa6 FROM recibos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    id_factura = result[0]?.id_factura_pa6;
  } catch (error) {
    const { body } = handleError(error, "Recibo", acciones.get);
    return res.send(body);
  }

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
    CAE = factura.CAE;
    VtoCAE = factura.VtoCAE;


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

      await contra_asiento_recibo(id, transaction_giama_renting, transaction_pa7_giama_renting)
      await giama_renting.query(`DELETE FROM costos_ingresos 
      WHERE nro_recibo = ?`, {
        type: QueryTypes.DELETE,
        replacements: [id],
        transaction: transaction_giama_renting
      })

      await giama_renting.query("UPDATE recibos SET anulado = ?, fecha_anulacion = ? WHERE id = ?",{
        type: QueryTypes.UPDATE,
        replacements: [1, getTodayDate(), id],
        transaction: transaction_giama_renting
      })

      return res.send({ status: true, message: "Recibo anulado correctamente" });

    } else if (!NumeroFacturaEmitida || !CAE || !VtoCAE) {
      return res.send({
        status: false,
        message: "La factura aún no puede ser eliminada",
      });

    } else {
      // se genera nota de credito, se borran costos_ingresos asociados, se actualiza el recibo
      const { Id, Tipo, PuntoVenta, FacAsoc, NumeroFacturaEmitida, ...otrosCampos } = factura; 
      let id_ndc;
      let FacAsoc_insertada = `${padWithZeros(PuntoVenta, 5)}${padWithZeros(NumeroFacturaEmitida, 8)}`;
      const result = await pa7_giama_renting.query(
        `INSERT INTO facturas 
         (Tipo, FacAsoc, PuntoVenta, NumeroFacturaEmitida, ${Object.keys(otrosCampos).join(", ")})
         VALUES (?,?,?,?, ${Object.keys(otrosCampos).map(() => "?").join(", ")})`,
        {
          type: QueryTypes.INSERT,
          replacements: ["CB", FacAsoc_insertada, PuntoVenta, NumeroFacturaEmitida, ...Object.values(otrosCampos)],
          transaction: transaction_pa7_giama_renting
        }
      );
      console.log(result);
      id_ndc = result[0]
      //o queda claro que se hace con facturasitems // se hace un solo registro igual pero x "anulacion factura x"
      const descripcion_facturas_items = `Anulación factura ${id_factura}`
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
      await contra_asiento_recibo(id, transaction_giama_renting, transaction_pa7_giama_renting)
      await giama_renting.query(`DELETE FROM costos_ingresos 
      WHERE nro_recibo = ?`, {
        type: QueryTypes.DELETE,
        replacements: [id],
        transaction: transaction_giama_renting
      })

      await giama_renting.query("UPDATE recibos SET anulado = ?, fecha_anulacion = ? WHERE id = ?",{
        type: QueryTypes.UPDATE,
        replacements: [1, getTodayDate(), id],
        transaction: transaction_giama_renting
      })
      transaction_giama_renting.commit()
      transaction_pa7_giama_renting.commit()
      return res.send({ status: true, message: "Recibo anulado correctamente. Nota de crédito generada" });
    }

  } catch (error) {
    const { body } = handleError(error, "Factura", acciones.get);
    return res.send(body);
  }
};

