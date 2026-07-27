import { pa7_giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";
import { getTodayDate } from "./getTodayDate.js";

export const insertOdp = async (importe, observacion, nroAsiento, idProveedorPA6, transaction_pa7_giama_renting) => {
  try {
    // 1. Obtener el próximo ID de ODP
    const [maxOdpResult] = await pa7_giama_renting.query(
      `SELECT MAX(IdOdp) as maxId FROM c_odp`, 
      { type: QueryTypes.SELECT }
    );
    const nuevoIdOdp = (maxOdpResult.maxId || 0) + 1;
    
    // 2. Insertar la Orden de Pago Pura (OPP)
    await pa7_giama_renting.query(
      `INSERT INTO c_odp (
        IdOdp, CharTipoODP, TipoDestino, Fecha, Importe, Estado, 
        Concepto, Observacion, NroAsiento, TotalDescuentos, 
        TotalImputacion, UsuarioAltaRegistro, TipoODP, IdProveedor, TotalAnticipo
      ) VALUES (?, 'P', 1, ?, ?, 0, 'Devolución Garantía Renting', ?, ?, 0, ?, 'Renting', 1, ?, 0)`,
       {
         replacements: [
           nuevoIdOdp, 
           getTodayDate(), 
           importe, 
           observacion || '', 
           nroAsiento, 
           importe, 
           idProveedorPA6
         ],
         type: QueryTypes.INSERT,
         transaction: transaction_pa7_giama_renting
       }
    );

    return nuevoIdOdp;

  } catch (error) {
    console.log("Error al insertar ODP:", error);
    throw new Error("Error al generar la Orden de Pago en PA6");
  }
};
