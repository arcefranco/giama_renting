import { pa7_giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";
import { getTodayDate } from "./getTodayDate.js";
import { padWithZeros } from "./padWithZeros.js";

export const movimientosProveedores = async ({
  cod_proveedor,
  tipo_comprobante,
  numero_comprobante_1,
  numero_comprobante_2,
  importe_neto,
  importe_total,
  cuenta_concepto,
  NroAsiento,
  NroAsientoSecundario,
  usuario,
  transaction_asientos,
}) => {
  let FA_FC =
    tipo_comprobante == 1 ? "FA" : tipo_comprobante == 3 ? "FC" : null;
  let numero_comprobante_1_formateado = padWithZeros(numero_comprobante_1, 5);
  let numero_comprobante_2_formateado = padWithZeros(numero_comprobante_2, 8);
  console.log(
    "ESTO ES NUMERO COMPROBANTE FORMATEADO: ",
    numero_comprobante_2_formateado
  );
  let NroComprobante = `${numero_comprobante_1_formateado}${numero_comprobante_2_formateado}`;
  let insertMovProv;
  //c_movprov
  try {
    const result = await pa7_giama_renting.query(
      `INSERT INTO c_movprov (Fecha, Proveedor, 
      TipoComprobante, NroComprobante, Vencimiento, NetoGravado1, 
      TasaIva1, Total) VALUES (?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          cod_proveedor,
          FA_FC,
          NroComprobante,
          getTodayDate(),
          importe_neto,
          21,
          importe_total,
        ],
        transaction: transaction_asientos,
      }
    );
    insertMovProv = result[0];
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c2_movprov
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c2_movprov (Fecha, Proveedor, 
      TipoComprobante, NroComprobante, Vencimiento, NetoGravado1, 
      TasaIva1, Total) VALUES (?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          cod_proveedor,
          FA_FC,
          NroComprobante,
          getTodayDate(),
          importe_neto,
          21,
          importe_total,
        ],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c_movprovdetalles
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movprovdetalles (IdMovProveedor, IdTipoImporteComprobante,
      CtaContable, Importe) VALUES (?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [insertMovProv, 3, cuenta_concepto, importe_neto],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c_movprovctacte
  try {
    let A_C = tipo_comprobante == 1 ? "A" : tipo_comprobante == 3 ? "C" : null;
    let DenomComprobante =
      tipo_comprobante == 1 ? "FPA" : tipo_comprobante == 3 ? "FPC" : null;
    let ConceptoComprobante = `Factura "${A_C}" N° ${numero_comprobante_1_formateado}-${numero_comprobante_2_formateado}`;
    await pa7_giama_renting.query(
      `INSERT INTO c_movprovctacte (IdProveedor, ConceptoComprobante,
      DenomComprobante, NroComprobante, Fecha, TipoComprobante, IdComprobante, 
      TipoAplicacion, IdAplicacion, Importe, NroAsiento, ConceptoAplicacion,
      DenomAplicacion, NroAplicacion, ImporteTotalComprobante, ImporteTotalAplicacion, 
      FechaAltaRegistro, UsuarioAltaRegistro) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          cod_proveedor,
          ConceptoComprobante,
          DenomComprobante,
          NroComprobante,
          getTodayDate(),
          tipo_comprobante,
          insertMovProv,
          tipo_comprobante,
          insertMovProv,
          importe_total,
          NroAsiento,
          ConceptoComprobante,
          DenomComprobante,
          NroComprobante,
          importe_total,
          importe_total,
          `${getTodayDate()} 00:00:00`,
          usuario,
        ],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c_movprovrelaasiento
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movprovrelaasiento (IdMovProveedor, NroAsiento1, NroAsiento2) VALUES (?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          insertMovProv,
          NroAsiento,
          NroAsientoSecundario ? NroAsientoSecundario : null,
        ],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
};
