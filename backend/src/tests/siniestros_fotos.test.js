import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { postSiniestro } from '../controllers/siniestrosController.js';

describe('Siniestros / Inspecciones — Validación de Fotos Obligatorias', () => {

  const basePayload = {
    id_contrato: 9999,
    id_vehiculo: 101,
    id_cliente: 50,
    tipo: 'Devolución',
    fecha_hora: '2026-10-21 16:00:00',
    verificador: 'Gaston Tester',
    kilometraje: 45000,
    fotos_adicionales: []
  };

  it('🚨 Debe rechazar la inspección si fotos_guiadas no se envía o es nulo', async () => {
    const req = {
      body: {
        ...basePayload,
        fotos_guiadas: null
      }
    };

    let sendResponse;
    const res = {
      send: (data) => {
        sendResponse = data;
      }
    };

    await postSiniestro(req, res);

    assert.strictEqual(sendResponse.status, false, 'El status debe ser false');
    assert.match(
      sendResponse.message,
      /foto/i,
      'El mensaje de error debe indicar la falta de fotos obligatorias'
    );
  });

  it('🚨 Debe rechazar la inspección si fotos_guiadas tiene menos de 8 fotos o contiene elementos vacíos/nulos', async () => {
    // Array con solo 3 fotos cargadas y el resto null
    const fotosIncompletas = [
      'data:image/jpeg;base64,frente...',
      'data:image/jpeg;base64,lat_izq...',
      'data:image/jpeg;base64,trasera...',
      null,
      null,
      null,
      null,
      null
    ];

    const req = {
      body: {
        ...basePayload,
        fotos_guiadas: fotosIncompletas
      }
    };

    let sendResponse;
    const res = {
      send: (data) => {
        sendResponse = data;
      }
    };

    await postSiniestro(req, res);

    assert.strictEqual(sendResponse.status, false, 'El status debe ser false');
    assert.match(
      sendResponse.message,
      /8 fotos|fotos obligatorias|completas/i,
      'Debe exigir las 8 fotos guiadas requeridas'
    );
  });

  it('🚨 Debe rechazar la inspección si un elemento de fotos_guiadas es string vacío o espacio en blanco', async () => {
    const fotosConBlancos = Array(8).fill('data:image/jpeg;base64,valida');
    fotosConBlancos[4] = '   '; // Baúl vacío

    const req = {
      body: {
        ...basePayload,
        fotos_guiadas: fotosConBlancos
      }
    };

    let sendResponse;
    const res = {
      send: (data) => {
        sendResponse = data;
      }
    };

    await postSiniestro(req, res);

    assert.strictEqual(sendResponse.status, false, 'El status debe ser false si hay fotos en blanco');
  });

});
