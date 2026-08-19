import { pa7_giama_renting } from "../../helpers/connection.js";

const nrosComprobantes = [
  '0001600001621',
  '0001600002939',
  '0005200009048',
  '0005200009056',
  '0005200009057',
  '0005200009061',
  '0005200009062'
];

const fixNotasDeCredito = async () => {
  try {
    console.log("Corrigiendo signo y tipo de las Notas de Crédito especificadas en PA6...");

    // 1. Corregir c_movprov
    const [result1] = await pa7_giama_renting.query(
      `UPDATE c_movprov 
       SET Total = Total * -1, 
           NetoNoGravado = NetoNoGravado * -1, 
           NetoGravado1 = NetoGravado1 * -1, 
           NetoGravado2 = NetoGravado2 * -1, 
           NetoGravado3 = NetoGravado3 * -1,
           Iva1 = Iva1 * -1,
           Iva2 = Iva2 * -1,
           Iva3 = Iva3 * -1,
           PercIIBB = PercIIBB * -1,
           PercIva = PercIva * -1,
           PercIIBBCABA = PercIIBBCABA * -1,
           TipoComprobante = 'CA'
       WHERE NroComprobante IN (:nros) AND TipoComprobante IN ('NCA', 'NC') AND Total > 0`,
      { replacements: { nros: nrosComprobantes } }
    );
    console.log(`c_movprov actualizados:`, result1.affectedRows);

    // 2. Corregir c2_movprov
    const [result2] = await pa7_giama_renting.query(
      `UPDATE c2_movprov 
       SET Total = Total * -1, 
           NetoNoGravado = NetoNoGravado * -1, 
           NetoGravado1 = NetoGravado1 * -1, 
           NetoGravado2 = NetoGravado2 * -1, 
           NetoGravado3 = NetoGravado3 * -1,
           Iva1 = Iva1 * -1,
           Iva2 = Iva2 * -1,
           Iva3 = Iva3 * -1,
           PercIIBB = PercIIBB * -1,
           PercIva = PercIva * -1,
           PercIIBBCABA = PercIIBBCABA * -1,
           TipoComprobante = 'CA'
       WHERE NroComprobante IN (:nros) AND TipoComprobante IN ('NCA', 'NC') AND Total > 0`,
      { replacements: { nros: nrosComprobantes } }
    );
    console.log(`c2_movprov actualizados:`, result2.affectedRows);

    // 3. Corregir c_movprovctacte
    const [result3] = await pa7_giama_renting.query(
      `UPDATE c_movprovctacte
       SET Importe = Importe * -1,
           ImporteTotalComprobante = ImporteTotalComprobante * -1,
           ImporteTotalAplicacion = ImporteTotalAplicacion * -1,
           DenomComprobante = 'CPA',
           DenomAplicacion = 'CPA'
       WHERE NroComprobante IN (:nros) AND TipoComprobante = 4 AND Importe > 0`,
      { replacements: { nros: nrosComprobantes } }
    );
    console.log(`c_movprovctacte actualizados:`, result3.affectedRows);

    // 4. Corregir c_movprovdetalles (vinculados por IdMovProveedor)
    const [result4] = await pa7_giama_renting.query(
      `UPDATE c_movprovdetalles d
       JOIN c_movprov m ON d.IdMovProveedor = m.Id
       SET d.Importe = d.Importe * -1
       WHERE m.NroComprobante IN (:nros) AND m.TipoComprobante = 'CA' AND d.Importe > 0`,
      { replacements: { nros: nrosComprobantes } }
    );
    console.log(`c_movprovdetalles actualizados:`, result4.affectedRows);

    console.log("¡Terminado!");
  } catch (error) {
    console.error("Error al corregir los registros:", error);
  } finally {
    await pa7_giama_renting.close();
  }
};

fixNotasDeCredito();
