import { pa7_giama_renting } from "../../helpers/connection.js";
import { QueryTypes } from "sequelize";
import { handleError } from "../../helpers/handleError.js";

const acciones = {
    get: "listar",
};

export const getAsientos = async (req, res) => {
    try {
        const asientos = await pa7_giama_renting.query(
            `SELECT NroAsiento, MAX(Fecha) as Fecha, MAX(CASE WHEN DH = 'D' THEN Concepto ELSE NULL END) as Concepto, TipoComprobante, NroComprobante, MAX(UsuarioAltaRegistro) as UsuarioAltaRegistro, SUM(CASE WHEN DH = 'D' THEN Importe ELSE 0 END) AS Total
             FROM net_c_view_getasientoscontables
             GROUP BY NroAsiento, TipoComprobante, NroComprobante
             ORDER BY MAX(ID) DESC
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
    const { nroAsiento } = req.params;
    try {
        const lineas = await pa7_giama_renting.query(
            `SELECT ID, Fecha, NroAsiento, Cuenta, Nombre AS NombreCuenta, DH, Importe, Concepto, TipoComprobante, NroComprobante, UsuarioAltaRegistro
             FROM net_c_view_getasientoscontables
             WHERE NroAsiento = :nroAsiento
             ORDER BY ID ASC`,
            {
                replacements: { nroAsiento },
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
        console.log("getFacturas");
        const facturas = await pa7_giama_renting.query(
            `SELECT f.Id AS ID, f.FechaAltaRegistro AS Fecha, f.NroAsiento, f.NroAsiento2, f.Tipo AS TipoComprobante, f.Numero AS NroComprobante, 
                    f.Neto, f.Iva, f.Total AS Importe, f.CodigoCliente, 
                    COALESCE(c.RazonSocial, '') AS NombreCliente,
                    f.UsuarioAltaRegistro, 'H' AS DH, 'Factura/Nota' AS Concepto
             FROM facturas f
             LEFT JOIN clientesfacturacion c ON f.CodigoCliente = c.Id
             ORDER BY f.Id DESC
             LIMIT 500`,
            {
                type: QueryTypes.SELECT,
            }
        );
        console.log(facturas)
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
            `SELECT Id, IdFactura, TipoAlicuota, Descripcion, Cantidad, PrecioUnitario, Porcentaje, Subtotal 
             FROM facturasitems 
             WHERE IdFactura = :idFactura
             ORDER BY Id ASC`,
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
