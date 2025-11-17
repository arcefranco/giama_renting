import { giama_renting, pa7_giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";
import { getTodayDate } from "./getTodayDate.js";

export const insertFactura = async (
  id_cliente,
  importe_neto,
  importe_iva,
  importe_total,
  usuario,
  NroAsiento,
  NroAsientoSecundario,
  concepto,
  transaction_giama_renting,
  transaction_pa7_giama_renting
) => {
  let clienteObtenido;
  let existeClienteFacturacion;
  let CodigoCliente;
  let nombre_provincia;
  let tipo_factura;
  let id_factura;
  //buscar datos del cliente
  try {
    const result = await giama_renting.query(
      "SELECT * FROM clientes WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_cliente],
        transaction: transaction_giama_renting,
      }
    );
    if (!result.length)
      throw new Error("No se encontró el cliente para la facturación");
    clienteObtenido = result[0];
  } catch (error) {
    throw new Error(
      `Error al buscar el cliente para la facturación ${
        error.message && error.message
      }`
    );
  }
  if (!clienteObtenido.tipo_contribuyente)
    throw new Error("El cliente debe aclarar su tipo responsable");
  if (clienteObtenido.tipo_contribuyente == 1 || clienteObtenido.tipo_contribuyente == 4) tipo_factura = "FA"; 
  else tipo_factura = "FB";
  //obtengo el nombre de la provincia del cliente
  try {
    const result = await giama_renting.query(
      "SELECT nombre FROM provincias WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [clienteObtenido.provincia],
        transaction: transaction_giama_renting,
      }
    );
    if (!result.length) nombre_provincia = null;
    else nombre_provincia = result[0]["nombre"];
  } catch (error) {
    throw Error(
      `Error al obtener la provincia del cliente ${
        error.message && error.message
      }`
    );
  }
  //buscar en clientesfacturacion si el cliente ya existe. si existe se captura el id.
  try {
    const result = await pa7_giama_renting.query(
      "SELECT Id, CUIT FROM clientesfacturacion WHERE CUIT = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [clienteObtenido["nro_documento"]],
        transaction: transaction_pa7_giama_renting,
      }
    );
    if (!result.length) {
      existeClienteFacturacion = false;
    } else if (result.length) {
      existeClienteFacturacion = true;
      CodigoCliente = result[0]["Id"];
    }
  } catch (error) {
    throw new Error(
      `Error al buscar el cliente ${error.message && error.message}`
    );
  }

  if (!existeClienteFacturacion) {
    let nombre;
    if (clienteObtenido.razon_social) {
      nombre = clienteObtenido.razon_social;
    } else {
      nombre = clienteObtenido.nombre + " " + clienteObtenido.apellido;
    }
    const domicilio =
      clienteObtenido.direccion + " " + clienteObtenido.nro_direccion;
    const result = await pa7_giama_renting.query(
      `
        INSERT INTO clientesfacturacion (RazonSocial, CUIT, TipoDocumento, TipoResponsable,
        Domicilio, Localidad, Provincia) VALUES (?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          nombre,
          clienteObtenido.nro_documento,
          clienteObtenido.tipo_documento,
          clienteObtenido.tipo_contribuyente,
          domicilio,
          clienteObtenido.ciudad,
          nombre_provincia ? nombre_provincia : null,
        ],
        transaction: transaction_pa7_giama_renting,
      }
    );
    CodigoCliente = result[0];
  }
  //inserto la factura
  try {
    const result = await pa7_giama_renting.query(
      `INSERT INTO facturas 
    (Marca, Numero, ImporteBruto, PorcentajeIva, Iva, FechaAltaRegistro, UsuarioAltaRegistro, 
    PuntoVenta, Tipo, Neto, Total, FechaComprobante, CodigoCliente, OrigenCbte, NroAsiento, 
    NroAsiento2) VALUES (?,?,?,?,?,NOW(),?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          13,
          0,
          importe_neto,
          21,
          importe_iva,
          usuario,
          2,
          tipo_factura,
          importe_neto,
          importe_total,
          `${getTodayDate()} 00:00:00`,
          CodigoCliente,
          "MANUALES",
          NroAsiento,
          NroAsientoSecundario,
        ],
        transaction: transaction_pa7_giama_renting,
      }
    );
    id_factura = result[0];
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar la factura ${error.message && error.message}`
    );
  }
  //inserto en factura items
  try {
    await pa7_giama_renting.query(
      `INSERT INTO facturasitems 
        (IdFactura, TipoAlicuota, Descripcion, Cantidad, PrecioUnitario,
        Porcentaje, Subtotal) VALUES (?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_factura,
          "S",
          concepto,
          1,
          importe_neto,
          21,
          importe_total,
        ],
        transaction: transaction_pa7_giama_renting,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar la factura ${error.message && error.message}`
    );
  }
  return id_factura;
};
