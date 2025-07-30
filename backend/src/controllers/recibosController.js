import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { formatearFechaISOText } from "../../helpers/formatearFechaISO.js";

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
            <p><b>Email: </b>info.giamarenting@gmail.com</p>
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
            <p><b>Fecha Pago: </b>  ${formatearFechaISOText(getTodayDate())}</p>
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
    return res
      .status(500)
      .json({ status: false, message: "Error al generar el recibo" });
  }
};
