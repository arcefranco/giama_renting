import { pa7_giama_renting } from './helpers/connection.js';

async function run() {
  try {
    const mov = await pa7_giama_renting.query(
      `SELECT IdMovProv, Fecha, Proveedor, TipoComprobante, NroComprobante, Total FROM c_movprov ORDER BY IdMovProv DESC LIMIT 2`,
      { type: pa7_giama_renting.QueryTypes.SELECT }
    );
    
    if (mov.length > 0) {
      const ids = mov.map(m => m.IdMovProv);
      const ctacte = await pa7_giama_renting.query(
        `SELECT IdProveedor, ConceptoComprobante, TipoComprobante, NroComprobante, Importe, IdComprobante FROM c_movprovctacte WHERE IdComprobante IN (?) ORDER BY IdComprobante DESC`,
        { replacements: [ids], type: pa7_giama_renting.QueryTypes.SELECT }
      );
      
      const relAsiento = await pa7_giama_renting.query(
        `SELECT IdMovProveedor, NroAsiento1, NroAsiento2 FROM c_movprovrelaasiento WHERE IdMovProveedor IN (?) ORDER BY IdMovProveedor DESC`,
        { replacements: [ids], type: pa7_giama_renting.QueryTypes.SELECT }
      );
      
      const nroAsientos = relAsiento.map(r => r.NroAsiento1).filter(a => a != null);
      if (nroAsientos.length > 0) {
        const detalles = await pa7_giama_renting.query(
          `SELECT NroAsiento, Cuenta, Debe, Haber FROM c_asientodetalles WHERE NroAsiento IN (?)`,
          { replacements: [nroAsientos], type: pa7_giama_renting.QueryTypes.SELECT }
        ).catch(e => {
          return pa7_giama_renting.query(
            `SELECT NroAsiento, Cuenta, Debe, Haber FROM c_asientodetalle WHERE NroAsiento IN (?)`,
            { replacements: [nroAsientos], type: pa7_giama_renting.QueryTypes.SELECT }
          );
        }).catch(e => {
            return pa7_giama_renting.query(
            `SELECT NroAsiento, Cuenta, Debe, Haber FROM asientos_detalle WHERE NroAsiento IN (?)`,
            { replacements: [nroAsientos], type: pa7_giama_renting.QueryTypes.SELECT }
          );
        }).catch(e => {
            return null;
        });
        
        console.log("\n\n=== 1. COMPROBANTES CARGADOS (Movimiento Proveedor) ===");
        console.table(mov);
        console.log("\n=== 2. IMPACTO EN CUENTA CORRIENTE ===");
        console.table(ctacte);
        console.log("\n=== 3. ASIENTOS CONTABLES GENERADOS ===");
        if(detalles) {
             console.table(detalles);
        } else {
             console.log("No pude leer el detalle de asientos, la tabla no se llama c_asientodetalles");
        }
      } else {
        console.log("No generó asientos.");
      }
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
run();
