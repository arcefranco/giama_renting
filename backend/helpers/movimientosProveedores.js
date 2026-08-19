import { pa7_giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";
import { getTodayDate } from "./getTodayDate.js";
import { padWithZeros } from "./padWithZeros.js";

export const movimientosProveedores = async ({
  fecha_factura,
  cod_proveedor,
  tipo_comprobante,
  numero_comprobante_1,
  numero_comprobante_2,
  importe_neto,
  importe_iva,
  importe_iva_10_5,
  importe_total,
  cuenta_concepto,
  NroAsiento,
  NroAsientoSecundario,
  usuario,
  transaction_asientos,
  tasa_IIBB_CABA,
  tasa_IIBB,
  tasa_IVA,
  importe_tasa_IIBB_CABA,
  importe_tasa_IIBB,
  importe_tasa_IVA,
}) => {
  const signo = (tipo_comprobante == 4 || tipo_comprobante == 6) ? -1 : 1;
  importe_neto *= signo;
  importe_iva *= signo;
  importe_iva_10_5 *= signo;
  importe_total *= signo;
  if (importe_tasa_IIBB) importe_tasa_IIBB *= signo;
  if (importe_tasa_IVA) importe_tasa_IVA *= signo;
  if (importe_tasa_IIBB_CABA) importe_tasa_IIBB_CABA *= signo;

  let FA_FC =
    tipo_comprobante == 1 ? "FA" : 
    tipo_comprobante == 3 ? "FC" : 
    tipo_comprobante == 2 ? "NDA" :
    tipo_comprobante == 4 ? "NCA" :
    tipo_comprobante == 5 ? "NDC" :
    tipo_comprobante == 6 ? "NCC" : null;
  let numero_comprobante_1_formateado = padWithZeros(numero_comprobante_1, 5);
  let numero_comprobante_2_formateado = padWithZeros(numero_comprobante_2, 8);
  let NroComprobante = `${numero_comprobante_1_formateado}${numero_comprobante_2_formateado}`;
  let insertMovProv;
  //c_movprov
  try {
    const result = await pa7_giama_renting.query(
      `INSERT INTO c_movprov (Fecha, Proveedor, 
      TipoComprobante, NroComprobante, Vencimiento, NetoNoGravado, NetoGravado1, NetoGravado3, Iva1, Iva3,
      TasaIva1, TasaIva3, Total, TasaPercIIBB, PercIIBB, TasaPercIva, PercIva, TasaPercIIBBCABA, 
      PercIIBBCABA) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          fecha_factura,
          cod_proveedor,
          FA_FC,
          NroComprobante,
          fecha_factura,
          tipo_comprobante == 3 ? importe_neto : null,
          tipo_comprobante == 1 ? (importe_iva_10_5 > 0 ? null : importe_neto) : null,
          tipo_comprobante == 1 ? (importe_iva_10_5 > 0 ? importe_neto : null) : null,
          importe_iva,
          importe_iva_10_5,
          21,
          10.5,
          importe_total,
          tasa_IIBB ? tasa_IIBB : null,
          importe_tasa_IIBB ? importe_tasa_IIBB : null,
          tasa_IVA ? tasa_IVA : null,
          importe_tasa_IVA ? importe_tasa_IVA : null,
          tasa_IIBB_CABA ? tasa_IIBB_CABA : null,
          importe_tasa_IIBB_CABA ? importe_tasa_IIBB_CABA : null
        ],
        transaction: transaction_asientos,
      }
    );
    insertMovProv = result[0];
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c2_movprov
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c2_movprov (Fecha, Proveedor, 
      TipoComprobante, NroComprobante, Vencimiento, NetoNoGravado, NetoGravado1, NetoGravado3, Iva1, Iva3,
      TasaIva1, TasaIva3, Total, TasaPercIIBB, PercIIBB, TasaPercIva, PercIva, TasaPercIIBBCABA, 
      PercIIBBCABA) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          fecha_factura,
          cod_proveedor,
          FA_FC,
          NroComprobante,
          fecha_factura,
          tipo_comprobante == 3 ? importe_neto : null,
          tipo_comprobante == 1 ? (importe_iva_10_5 > 0 ? null : importe_neto) : null,
          tipo_comprobante == 1 ? (importe_iva_10_5 > 0 ? importe_neto : null) : null,
          importe_iva,
          importe_iva_10_5,
          21,
          10.5,
          importe_total,
          tasa_IIBB ? tasa_IIBB : null,
          importe_tasa_IIBB ? importe_tasa_IIBB : null,
          tasa_IVA ? tasa_IVA : null,
          importe_tasa_IVA ? importe_tasa_IVA : null,
          tasa_IIBB_CABA ? tasa_IIBB_CABA : null,
          importe_tasa_IIBB_CABA ? importe_tasa_IIBB_CABA : null
        ],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""
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
      `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c_movprovctacte
  try {
    let A_C = (tipo_comprobante == 1 || tipo_comprobante == 2 || tipo_comprobante == 4) ? "A" : (tipo_comprobante == 3 || tipo_comprobante == 5 || tipo_comprobante == 6) ? "C" : null;
    let DenomComprobante = tipo_comprobante == 1 ? "FPA" : tipo_comprobante == 3 ? "FPC" : tipo_comprobante == 2 ? "DPA" : tipo_comprobante == 4 ? "CPA" : tipo_comprobante == 5 ? "DPC" : tipo_comprobante == 6 ? "CPC" : null;
    let tipo_nombre = (tipo_comprobante == 1 || tipo_comprobante == 3) ? "Factura" : (tipo_comprobante == 2 || tipo_comprobante == 5) ? "Nota de Débito" : (tipo_comprobante == 4 || tipo_comprobante == 6) ? "Nota de Crédito" : "Comprobante";
    let ConceptoComprobante = `${tipo_nombre} "${A_C}" N° ${numero_comprobante_1_formateado}-${numero_comprobante_2_formateado}`;
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
          fecha_factura,
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
      `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""
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
      `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""
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

  // --- NUESTROS DATOS DINÁMICOS ---
  conceptos,
  cuentasPorConcepto,
  // --------------------------------
  NroAsiento,
  NroAsientoSecundario,
  usuario,
  transaction_asientos,

  // Estos impuestos son a nivel factura general, se mantienen:
  tasa_IIBB_CABA,
  tasa_IIBB,
  tasa_IVA,
  importe_tasa_IIBB_CABA,
  importe_tasa_IIBB,
  importe_tasa_IVA,
}) => {
  let FA_FC =
    tipo_comprobante == 1 ? "FA" : 
    tipo_comprobante == 3 ? "FC" : 
    tipo_comprobante == 2 ? "DA" :
    tipo_comprobante == 4 ? "CA" :
    tipo_comprobante == 5 ? "DC" :
    tipo_comprobante == 6 ? "CC" : null;
  let numero_comprobante_1_formateado = padWithZeros(numero_comprobante_1, 5);
  let numero_comprobante_2_formateado = padWithZeros(numero_comprobante_2, 8);
  let NroComprobante = `${numero_comprobante_1_formateado}${numero_comprobante_2_formateado}`;

  const signo = (tipo_comprobante == 4 || tipo_comprobante == 6) ? -1 : 1;
  importe_total *= signo;
  if (importe_tasa_IIBB) importe_tasa_IIBB *= signo;
  if (importe_tasa_IVA) importe_tasa_IVA *= signo;
  if (importe_tasa_IIBB_CABA) importe_tasa_IIBB_CABA *= signo;

  // Consolidamos todos los netos e IVAs recorriendo los conceptos dinámicamente
  const totales = conceptos.reduce((acc, c) => {
    acc.neto_no_gravado += parseFloat(c.neto_no_gravado || 0) * signo;
    acc.neto_21 += parseFloat(c.neto_21 || 0) * signo;
    acc.neto_10 += parseFloat(c.neto_10 || 0) * signo;
    acc.neto_27 += parseFloat(c.neto_27 || 0) * signo;

    acc.iva_21 += (parseFloat(c.neto_21 || 0) * 0.21) * signo;
    acc.iva_10 += (parseFloat(c.neto_10 || 0) * 0.105) * signo;
    acc.iva_27 += (parseFloat(c.neto_27 || 0) * 0.27) * signo;

    return acc;
  }, {
    neto_no_gravado: 0, neto_21: 0, neto_10: 0, neto_27: 0,
    iva_21: 0, iva_10: 0, iva_27: 0
  });



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
          totales.neto_no_gravado,
          totales.neto_21,
          totales.neto_27,
          totales.neto_10,
          21,
          27,
          10.5,
          totales.iva_21,
          totales.iva_27,
          totales.iva_10,
          tasa_IIBB || 0,
          importe_tasa_IIBB || 0,
          tasa_IVA || 0,
          importe_tasa_IVA || 0,
          tasa_IIBB_CABA || 0,
          importe_tasa_IIBB_CABA || 0,
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
      `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""
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
          totales.neto_no_gravado,
          totales.neto_21,
          totales.neto_27,
          totales.neto_10,
          21,
          27,
          10.5,
          totales.iva_21,
          totales.iva_27,
          totales.iva_10,
          tasa_IIBB || 0,
          importe_tasa_IIBB || 0,
          tasa_IVA || 0,
          importe_tasa_IVA || 0,
          tasa_IIBB_CABA || 0,
          importe_tasa_IIBB_CABA || 0,
          importe_total,
        ],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c_movprovdetalles
  for (const concepto of conceptos) {
    if (!concepto.id_concepto) continue;

    const cuentaContable = cuentasPorConcepto[concepto.id_concepto]?.cuenta_contable;
    const netoConcepto = (Number(concepto.neto_no_gravado || 0) + Number(concepto.neto_21 || 0) + Number(concepto.neto_27 || 0) + Number(concepto.neto_10 || 0)) * signo;

    if (Math.abs(netoConcepto) > 0 && cuentaContable) {
      try {
        await pa7_giama_renting.query(
          `INSERT INTO c_movprovdetalles (IdMovProveedor, IdTipoImporteComprobante, CtaContable, Importe) 
         VALUES (?, ?, ?, ?)`,
          {
            type: QueryTypes.INSERT,
            replacements: [insertMovProv, 3, cuentaContable, netoConcepto],
            transaction: transaction_asientos,
          }
        ); // <- Faltaba cerrar con punto y coma acá
      } catch (error) { // <- Faltaba cerrar la llave del try antes del catch
        console.log(error);
        throw new Error(
          `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""}`
        );
      }
    }
  }

  //c_movprovctacte
  try {
    let A_C = (tipo_comprobante == 1 || tipo_comprobante == 2 || tipo_comprobante == 4) ? "A" : (tipo_comprobante == 3 || tipo_comprobante == 5 || tipo_comprobante == 6) ? "C" : null;
    let DenomComprobante = tipo_comprobante == 1 ? "FPA" : tipo_comprobante == 3 ? "FPC" : tipo_comprobante == 2 ? "DPA" : tipo_comprobante == 4 ? "CPA" : tipo_comprobante == 5 ? "DPC" : tipo_comprobante == 6 ? "CPC" : null;
    let tipo_nombre = (tipo_comprobante == 1 || tipo_comprobante == 3) ? "Factura" : (tipo_comprobante == 2 || tipo_comprobante == 5) ? "Nota de Débito" : (tipo_comprobante == 4 || tipo_comprobante == 6) ? "Nota de Crédito" : "Comprobante";
    let ConceptoComprobante = `${tipo_nombre} "${A_C}" N° ${numero_comprobante_1_formateado}-${numero_comprobante_2_formateado}`;
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
      `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""
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
      `Error al insertar registro en proveedores ${error.message ? ` :${error.message}` : ""
      }`
    );
  }
};
