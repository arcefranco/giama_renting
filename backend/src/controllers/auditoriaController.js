import { pa7_giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";
import { handleError } from "../../helpers/handleError.js";

const acciones = {
    get: "listar",
};

export const getAsientos = async (req, res) => {
    try {
        const asientos = await pa7_giama_renting.query(
            `SELECT 
                CONCAT(a.NroAsiento, '_', DATE_FORMAT(a.Fecha, '%Y-%m-%d')) AS AsientoKey,
                a.NroAsiento,
                MAX(a.AsientoSecundario) AS AsientoSecundario,
                a.Fecha,
                DATE_FORMAT(a.Fecha, '%Y-%m-%d') AS FechaStr,
                COALESCE(
                    MAX(CASE WHEN a.DH = 'D' AND a.Concepto IS NOT NULL AND a.Concepto != '' THEN a.Concepto ELSE NULL END),
                    MAX(a.Concepto)
                ) AS Concepto,
                MAX(a.TipoComprobante) AS TipoComprobante,
                MAX(a.NroComprobante) AS NroComprobante,
                COALESCE(
                    MAX(NULLIF(TRIM(a.UsuarioAltaRegistro), '')),
                    MAX(NULLIF(TRIM(f.UsuarioAltaRegistro), ''))
                ) AS UsuarioAltaRegistro,
                COUNT(DISTINCT a.ID) AS CantidadLineas,
                ROUND(SUM(CASE WHEN a.DH = 'D' THEN a.Importe ELSE 0 END), 2) AS TotalDebe,
                ROUND(SUM(CASE WHEN a.DH = 'H' THEN a.Importe ELSE 0 END), 2) AS TotalHaber,
                ROUND(SUM(CASE WHEN a.DH = 'D' THEN a.Importe ELSE 0 END), 2) AS Total,
                ROUND(
                    SUM(CASE WHEN a.DH = 'D' THEN a.Importe ELSE 0 END) -
                    SUM(CASE WHEN a.DH = 'H' THEN a.Importe ELSE 0 END),
                    2
                ) AS Diferencia,
                ROUND(
                    SUM(
                        CASE 
                            WHEN a.CodigoEspecial IN ('IVDF', 'IVCF') OR a.Nombre LIKE '%IVA%' THEN a.Importe 
                            ELSE 0 
                        END
                    ),
                    2
                ) AS TotalIva
             FROM net_c_view_getasientoscontables a
             LEFT JOIN (
                 SELECT NroAsiento, DATE(FechaComprobante) AS FechaComprobante, MAX(UsuarioAltaRegistro) AS UsuarioAltaRegistro
                 FROM facturas
                 GROUP BY NroAsiento, DATE(FechaComprobante)
             ) f ON a.NroAsiento = f.NroAsiento AND DATE(a.Fecha) = f.FechaComprobante
             GROUP BY a.NroAsiento, a.Fecha
             ORDER BY MAX(a.ID) DESC
             LIMIT 500`,
            {
                type: QueryTypes.SELECT,
            }
        );
        return res.send(asientos);
    } catch (error) {
        const { body } = handleError(error, "asientos", acciones.get);
        return res.send(body);
    }
};

export const getAsientoLineas = async (req, res) => {
    const { nroAsiento, fecha } = req.params;
    try {
        const whereFecha = fecha ? "AND DATE(a.Fecha) = :fecha" : "";
        const lineas = await pa7_giama_renting.query(
            `SELECT 
                a.ID,
                a.Fecha,
                a.NroAsiento,
                a.AsientoSecundario,
                a.Cuenta,
                a.CuentaSecundaria,
                a.Rubro,
                a.Nombre AS NombreCuenta,
                a.CodigoEspecial,
                a.DH,
                a.Importe,
                CASE WHEN a.DH = 'D' THEN a.Importe ELSE 0 END AS Debe,
                CASE WHEN a.DH = 'H' THEN a.Importe ELSE 0 END AS Haber,
                a.Concepto,
                a.TipoComprobante,
                a.NroComprobante,
                COALESCE(
                    NULLIF(TRIM(a.UsuarioAltaRegistro), ''),
                    (SELECT MAX(f.UsuarioAltaRegistro) FROM facturas f WHERE f.NroAsiento = a.NroAsiento AND DATE(f.FechaComprobante) = DATE(a.Fecha))
                ) AS UsuarioAltaRegistro
             FROM net_c_view_getasientoscontables a
             WHERE a.NroAsiento = :nroAsiento ${whereFecha}
             ORDER BY a.ID ASC`,
            {
                replacements: { nroAsiento, ...(fecha ? { fecha } : {}) },
                type: QueryTypes.SELECT,
            }
        );
        return res.send(lineas);
    } catch (error) {
        const { body } = handleError(error, "asientoLineas", acciones.get);
        return res.send(body);
    }
};

export const getFacturas = async (req, res) => {
    try {
        const facturas = await pa7_giama_renting.query(
            `SELECT 
                f.Id AS ID,
                f.FechaAltaRegistro AS Fecha,
                f.FechaComprobante,
                f.NroAsiento,
                f.NroAsiento2,
                f.Tipo AS TipoComprobante,
                f.PuntoVenta,
                f.Numero,
                f.NumeroFacturaEmitida,
                CASE
                    WHEN f.NumeroFacturaEmitida IS NOT NULL AND f.NumeroFacturaEmitida > 0
                        THEN CONCAT(LPAD(COALESCE(f.PuntoVenta, 0), 5, '0'), '-', LPAD(f.NumeroFacturaEmitida, 8, '0'))
                    WHEN f.Numero IS NOT NULL AND f.Numero != '0' AND f.Numero != ''
                        THEN CASE 
                            WHEN f.PuntoVenta IS NOT NULL AND f.PuntoVenta > 0 
                                THEN CONCAT(LPAD(f.PuntoVenta, 5, '0'), '-', LPAD(f.Numero, 8, '0'))
                            ELSE f.Numero
                        END
                    ELSE CONCAT('PV ', COALESCE(f.PuntoVenta, '-'), ' (Sin emitir - ID ', f.Id, ')')
                END AS NroComprobante,
                f.ImporteBruto,
                f.Neto,
                f.PorcentajeIva,
                f.Iva,
                f.PorcentajeIIBB,
                COALESCE(f.PercepcionIIBB, 0) AS PercepcionIIBB,
                f.Total AS Importe,
                f.CodigoCliente,
                COALESCE(c.RazonSocial, '') AS NombreCliente,
                COALESCE(c.CUIT, '') AS CUIT,
                c.TipoResponsable,
                c.Localidad,
                c.Provincia,
                c.Email,
                f.CAE,
                f.VtoCAE,
                f.FacAsoc,
                f.OrigenCbte,
                f.Resultado_Afip,
                f.observacion_Afip,
                f.UsuarioAltaRegistro
             FROM facturas f
             LEFT JOIN clientesfacturacion c ON f.CodigoCliente = c.Id
             ORDER BY f.Id DESC
             LIMIT 500`,
            {
                type: QueryTypes.SELECT,
            }
        );
        return res.send(facturas);
    } catch (error) {
        const { body } = handleError(error, "facturas", acciones.get);
        return res.send(body);
    }
};

export const getFacturaItems = async (req, res) => {
    const { idFactura } = req.params;
    try {
        const items = await pa7_giama_renting.query(
            `SELECT 
                fi.Id,
                fi.IdFactura,
                fi.TipoAlicuota,
                fi.Descripcion,
                fi.Cantidad,
                fi.PrecioUnitario,
                ROUND(COALESCE(fi.Cantidad, 1) * COALESCE(fi.PrecioUnitario, 0), 2) AS ImporteNetoItem,
                fi.Porcentaje,
                ROUND(
                    COALESCE(fi.Cantidad, 1) * COALESCE(fi.PrecioUnitario, 0) * (COALESCE(fi.Porcentaje, 0) / 100),
                    2
                ) AS ImporteIvaItem,
                ROUND(
                    COALESCE(fi.Cantidad, 1) * COALESCE(fi.PrecioUnitario, 0) * (1 + COALESCE(fi.Porcentaje, 0) / 100),
                    2
                ) AS TotalCalculadoItem,
                fi.Subtotal
             FROM facturasitems fi
             WHERE fi.IdFactura = :idFactura
             ORDER BY fi.Id ASC`,
            {
                replacements: { idFactura },
                type: QueryTypes.SELECT,
            }
        );
        return res.send(items);
    } catch (error) {
        const { body } = handleError(error, "facturaItems", acciones.get);
        return res.send(body);
    }
};
