import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { giama_renting, pa7_giama_renting } from '../../helpers/connection.js';
import { postFacturacionMasiva } from '../controllers/alquileresController.js';

describe('Facturación Masiva — Backend Integration Test', () => {

  it('Debe devolver mensaje de exito y generar asientos contables balanceados (Debe === Haber)', async () => {
    
    // Obtenemos contrato activo de prueba
    const contratoDb = await giama_renting.query(
      `SELECT id, id_cliente, id_vehiculo FROM contratos_alquiler WHERE fecha_hasta >= CURDATE() LIMIT 1`,
      { type: giama_renting.QueryTypes.SELECT }
    );

    if (!contratoDb || contratoDb.length === 0) {
      console.warn("No hay contratos activos para ejecutar el test de facturación.");
      return;
    }

    const { id: id_contrato_real, id_cliente: id_cliente_real, id_vehiculo: id_vehiculo_real } = contratoDb[0];

    const req = {
      body: {
        alquileres: [
          {
            id_contrato: id_contrato_real,
            id_cliente: id_cliente_real, 
            id_vehiculo: id_vehiculo_real,
            fecha_desde_alquiler: "2026-10-01T00:00:00.000Z",
            fecha_hasta_alquiler: "2026-10-31T00:00:00.000Z",
            fecha_factura_alquiler: new Date().toISOString().split('T')[0],
            debe_alquiler: 33333.33,       
            debe_alquiler_neto: 27548.20,  
            debe_alquiler_iva: 5785.13,    
            observacion: "Facturación Unidad Test Automatizado"
          }
        ]
      },
      user: { user: 'testUser' }
    };

    let sendResponse;
    const res = {
      send: (data) => {
        sendResponse = data;
      }
    };

    await postFacturacionMasiva(req, res);

    if (!sendResponse.status) {
      console.log("Error del controlador:", sendResponse);
    }
    
    assert.strictEqual(sendResponse.status, true, "El status debe ser true");
    assert.strictEqual(sendResponse.data.length, 1, "Deben procesarse 1 contratos");
    
    // Check account movements
    const facturaAsignada = sendResponse.data[0].nro_factura;
    
    const movimientos = await pa7_giama_renting.query(
      `SELECT debe, haber, cuenta FROM c_movimientos WHERE concepto LIKE '%FACTURA: ${facturaAsignada}%'`,
      { type: giama_renting.QueryTypes.SELECT }
    );
    
    let totalDebe = 0;
    let totalHaber = 0;
    for (const mov of movimientos) {
      totalDebe += parseFloat(mov.debe || 0);
      totalHaber += parseFloat(mov.haber || 0);
    }

    assert.strictEqual(Math.abs(totalDebe - totalHaber) < 0.01, true, `Debe (${totalDebe}) debe ser igual a Haber (${totalHaber})`);
    
    // Cleanup generated data from testing DB to not pollute
    await pa7_giama_renting.query(`DELETE FROM c_movimientos WHERE concepto LIKE '%FACTURA: ${facturaAsignada}%'`);
    await pa7_giama_renting.query(`DELETE FROM c2_movimientos WHERE concepto LIKE '%FACTURA: ${facturaAsignada}%'`);
    await giama_renting.query(`DELETE FROM facturas WHERE NroFactura = ${facturaAsignada}`);
    await giama_renting.query(`DELETE FROM alquileres WHERE id_factura_pa6 = ${facturaAsignada}`);
  });

});
