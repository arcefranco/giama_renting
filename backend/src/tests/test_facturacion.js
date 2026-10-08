import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { giama_renting, pa7_giama_renting } from '../../helpers/connection.js';
import { postFacturacionMasiva } from '../controllers/alquileresController.js';

describe('Facturación Masiva', () => {

  it('Debe devolver mensaje de exito', async () => {
    
    // Obtenemos los ids reales del contrato 577 que pasaste:
    const contratoDb = await giama_renting.query(
      `SELECT id_cliente, id_vehiculo FROM contratos_alquiler WHERE id = 577`,
      { type: giama_renting.QueryTypes.SELECT }
    );
    const id_cliente_real = contratoDb[0].id_cliente;
    const id_vehiculo_real = contratoDb[0].id_vehiculo;

    const req = {
      body: {
        alquileres: [
          {
            id_contrato: 577,
            id_cliente: id_cliente_real, 
            id_vehiculo: id_vehiculo_real,
            fecha_desde_alquiler: "2026-10-01T00:00:00.000Z",
            fecha_hasta_alquiler: "2026-10-31T00:00:00.000Z",
            fecha_factura_alquiler: "2026-10-01",
            debe_alquiler: 33333.33,       
            debe_alquiler_neto: 27548.20,  
            debe_alquiler_iva: 5785.13,    
            observacion: "Facturación Unidad Test"
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

    // Assert responses
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
