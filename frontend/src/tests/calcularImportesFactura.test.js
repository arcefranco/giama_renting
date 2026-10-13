import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcularImportesDesdeTotal, calcularImportesDesdeNeto } from '../helpers/calcularImportesFactura.js';

describe('Cálculo de Importes de Facturación y Validación AFIP', () => {

  it('Caso crítico reportado: $19.700.000 con 21% IVA debe cerrar exacto al centavo', () => {
    const result = calcularImportesDesdeTotal({
      total: 19700000,
      porcentajeIva: 21,
      tasaPercepcion: 0
    });

    assert.equal(result.total, '19700000.00');
    assert.equal(result.neto, '16280991.74');
    assert.equal(result.iva, '3419008.26'); // Absorbe el centavo de redondeo
    assert.equal(result.percepcion, '');

    // Validación estricta AFIP: ImpTotal == ImpNeto + ImpIVA
    const sumaAfip = parseFloat((parseFloat(result.neto) + parseFloat(result.iva)).toFixed(2));
    assert.equal(sumaAfip, parseFloat(result.total));
  });

  it('Cálculo desde Total con IVA 10.5%', () => {
    const result = calcularImportesDesdeTotal({
      total: 15000000,
      porcentajeIva: 10.5,
      tasaPercepcion: 0
    });

    assert.equal(result.total, '15000000.00');
    const sumaAfip = parseFloat((parseFloat(result.neto) + parseFloat(result.iva)).toFixed(2));
    assert.equal(sumaAfip, parseFloat(result.total));
  });

  it('Cálculo desde Total con IVA 21% y Percepción IIBB 3%', () => {
    const result = calcularImportesDesdeTotal({
      total: 25000000,
      porcentajeIva: 21,
      tasaPercepcion: 3
    });

    const sumaAfip = parseFloat((
      parseFloat(result.neto) +
      parseFloat(result.iva) +
      parseFloat(result.percepcion)
    ).toFixed(2));

    assert.equal(sumaAfip, parseFloat(result.total));
  });

  it('Cálculo desde Total Exento (0% IVA)', () => {
    const result = calcularImportesDesdeTotal({
      total: 5000000,
      porcentajeIva: 0,
      tasaPercepcion: 0
    });

    assert.equal(result.neto, '5000000.00');
    assert.equal(result.iva, '0.00');
    assert.equal(result.total, '5000000.00');
  });

  it('Cálculo inverso desde Neto debe cerrar la partida doble', () => {
    const result = calcularImportesDesdeNeto({
      neto: 16280991.74,
      porcentajeIva: 21,
      tasaPercepcion: 0
    });

    assert.equal(result.neto, '16280991.74');
    assert.equal(result.iva, '3419008.27');
    assert.equal(result.total, '19700000.01');

    const suma = parseFloat((parseFloat(result.neto) + parseFloat(result.iva)).toFixed(2));
    assert.equal(suma, parseFloat(result.total));
  });

  it('Manejo seguro de valores nulos o vacíos', () => {
    const result = calcularImportesDesdeTotal({ total: '' });
    assert.equal(result.neto, '');
    assert.equal(result.iva, '');
    assert.equal(result.total, '');
  });
});
