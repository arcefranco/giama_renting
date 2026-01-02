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
  importe_iva,
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
  let NroComprobante = `${numero_comprobante_1_formateado}${numero_comprobante_2_formateado}`;
  let insertMovProv;
  //c_movprov
  try {
    const result = await pa7_giama_renting.query(
      `INSERT INTO c_movprov (Fecha, Proveedor, 
      TipoComprobante, NroComprobante, Vencimiento, NetoNoGravado, NetoGravado1, Iva1,
      TasaIva1, Total) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          cod_proveedor,
          FA_FC,
          NroComprobante,
          getTodayDate(),
          tipo_comprobante == 3 ? importe_neto : null,
          tipo_comprobante == 1 ? importe_neto : null,
          importe_iva,
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
      TipoComprobante, NroComprobante, Vencimiento, NetoNoGravado, NetoGravado1, Iva1,
      TasaIva1, Total) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          cod_proveedor,
          FA_FC,
          NroComprobante,
          getTodayDate(),
          tipo_comprobante == 3 ? importe_neto : null,
          tipo_comprobante == 1 ? importe_neto : null,
          importe_iva,
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

export const movimientosProveedoresEgresos = async ({
  fecha,
  cod_proveedor,
  tipo_comprobante,
  numero_comprobante_1,
  numero_comprobante_2,
  importe_total,
  cuenta_concepto,
  cuenta_concepto_2,
  cuenta_concepto_3,
  NroAsiento,
  NroAsientoSecundario,
  usuario,
  transaction_asientos,
  neto_no_gravado,
  neto_21,
  neto_10,
  neto_27,
  neto_no_gravado_2,
  neto_21_2,
  neto_10_2,
  neto_27_2,
  neto_no_gravado_3,
  neto_21_3,
  neto_10_3,
  neto_27_3,
  importe_iva_21,
  importe_iva_10,
  importe_iva_27,
  tasa_IIBB_CABA,
  tasa_IIBB,
  tasa_IVA,
  importe_tasa_IIBB_CABA,
  importe_tasa_IIBB,
  importe_tasa_IVA,
}) => {
  let FA_FC =
    tipo_comprobante == 1 ? "FA" : tipo_comprobante == 3 ? "FC" : null;
  let numero_comprobante_1_formateado = padWithZeros(numero_comprobante_1, 5);
  let numero_comprobante_2_formateado = padWithZeros(numero_comprobante_2, 8);
  let NroComprobante = `${numero_comprobante_1_formateado}${numero_comprobante_2_formateado}`;
  let importe_neto_1 = neto_no_gravado + neto_21 + neto_10 + neto_27;
  let importe_neto_2;
  let importe_neto_3;
  let importe_neto_21_total = neto_21 + neto_21_2 + neto_21_3;
  let importe_neto_27_total = neto_27 + neto_27_2 + neto_27_3;
  let importe_neto_10_total = neto_10 + neto_10_2 + neto_10_3;

  let importe_neto_no_gravado_total =
    neto_no_gravado + neto_no_gravado_2 + neto_no_gravado_3;
  if (cuenta_concepto_2) {
    importe_neto_2 = neto_no_gravado_2 + neto_21_2 + neto_10_2 + neto_27_2;
  }
  if (cuenta_concepto_3) {
    importe_neto_3 = neto_no_gravado_3 + neto_21_3 + neto_10_3 + neto_27_3;
  }

  let insertMovProv;
  //c_movprov
  try {
    const result = await pa7_giama_renting.query(
      `INSERT INTO c_movprov (Fecha, Proveedor, 
      TipoComprobante, NroComprobante, Vencimiento, NetoNoGravado, NetoGravado1, NetoGravado2, NetoGravado3,
      TasaIva1, TasaIva2, TasaIva3, Iva1, Iva2, Iva3, TasaPercIIBB, PercIIBB, TasaPercIva, PercIva, TasaPercIIBBCABA,
      PercIIBBCABA,
      Total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          fecha,
          cod_proveedor,
          FA_FC,
          NroComprobante,
          fecha,
          importe_neto_no_gravado_total,
          importe_neto_21_total,
          importe_neto_27_total,
          importe_neto_10_total,
          21,
          27,
          10.5,
          importe_iva_21,
          importe_iva_27,
          importe_iva_10,
          tasa_IIBB,
          importe_tasa_IIBB,
          tasa_IVA,
          importe_tasa_IVA,
          tasa_IIBB_CABA,
          importe_tasa_IIBB_CABA,
          importe_total,
        ],
        transaction: transaction_asientos,
      }
    );
    insertMovProv = result[0];
    console.log("ID MOV PROV: ", insertMovProv)
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
      TipoComprobante, NroComprobante, Vencimiento, NetoNoGravado, NetoGravado1, NetoGravado2, NetoGravado3,
      TasaIva1, TasaIva2, TasaIva3, Iva1, Iva2, Iva3, TasaPercIIBB, PercIIBB, TasaPercIva, PercIva, TasaPercIIBBCABA,
      PercIIBBCABA,
      Total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          fecha,
          cod_proveedor,
          FA_FC,
          NroComprobante,
          fecha,
          importe_neto_no_gravado_total,
          importe_neto_21_total,
          importe_neto_27_total,
          importe_neto_10_total,
          21,
          27,
          10.5,
          importe_iva_21,
          importe_iva_27,
          importe_iva_10,
          tasa_IIBB,
          importe_tasa_IIBB,
          tasa_IVA,
          importe_tasa_IVA,
          tasa_IIBB_CABA,
          importe_tasa_IIBB_CABA,
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
        replacements: [insertMovProv, 3, cuenta_concepto, importe_neto_1],
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
  if (cuenta_concepto_2) {
    try {
      await pa7_giama_renting.query(
        `INSERT INTO c_movprovdetalles (IdMovProveedor, IdTipoImporteComprobante,
      CtaContable, Importe) VALUES (?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [insertMovProv, 3, cuenta_concepto_2, importe_neto_2],
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
  }
  if (cuenta_concepto_3) {
    try {
      await pa7_giama_renting.query(
        `INSERT INTO c_movprovdetalles (IdMovProveedor, IdTipoImporteComprobante,
      CtaContable, Importe) VALUES (?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [insertMovProv, 3, cuenta_concepto_3, importe_neto_3],
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
          fecha,
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
