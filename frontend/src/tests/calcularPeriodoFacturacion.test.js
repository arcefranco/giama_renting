import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPeriodoFacturacion } from '../helpers/calcularPeriodoFacturacion.js';

describe('Suite de Pruebas: Cálculo de Período para Facturación Masiva', () => {

  // =========================================================================
  // 1. Contratos iniciados en el mes corriente
  // =========================================================================
  describe('1. Contratos que inician en el mes corriente', () => {
    it('debe tomar la fecha de inicio del contrato si inició después del día 1 (ej: 8 de octubre)', () => {
      const fechaRef = new Date(2026, 9, 15); // Octubre 2026
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion('2026-10-08', '2027-10-08', fechaRef);

      assert.equal(fechaDesde, '2026-10-08');
      assert.equal(fechaHasta, '2026-10-31');
    });

    it('debe tomar 01 del mes si el contrato inició exactamente el día 1 del mes corriente', () => {
      const fechaRef = new Date(2026, 9, 20); // Octubre 2026
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion('2026-10-01', '2027-10-01', fechaRef);

      assert.equal(fechaDesde, '2026-10-01');
      assert.equal(fechaHasta, '2026-10-31');
    });

    it('debe soportar contrato que empieza y termina en el mismo mes corriente (ej: 5 al 20 de octubre)', () => {
      const fechaRef = new Date(2026, 9, 10); // Octubre 2026
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion('2026-10-05', '2026-10-20', fechaRef);

      assert.equal(fechaDesde, '2026-10-05');
      assert.equal(fechaHasta, '2026-10-20');
    });
  });

  // =========================================================================
  // 2. Contratos preexistentes (iniciados en meses anteriores)
  // =========================================================================
  describe('2. Contratos preexistentes (iniciados en meses anteriores)', () => {
    it('debe facturar del 1 al último día del mes para contrato iniciado el mes previo (ej: nov facturando contrato de oct)', () => {
      const fechaRef = new Date(2026, 10, 5); // Noviembre 2026
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion('2026-10-08', '2027-10-08', fechaRef);

      assert.equal(fechaDesde, '2026-11-01');
      assert.equal(fechaHasta, '2026-11-30');
    });

    it('debe facturar del 1 al último día para contrato iniciado años atrás', () => {
      const fechaRef = new Date(2026, 9, 8); // Octubre 2026
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion('2024-01-15', '2028-01-15', fechaRef);

      assert.equal(fechaDesde, '2026-10-01');
      assert.equal(fechaHasta, '2026-10-31');
    });
  });

  // =========================================================================
  // 3. Acotación por fecha de fin de contrato
  // =========================================================================
  describe('3. Acotación por fecha de fin de contrato', () => {
    it('debe recortar fechaHasta si el contrato vence a mitad del mes facturado (ej: vence 15 de octubre)', () => {
      const fechaRef = new Date(2026, 9, 2); // Octubre 2026
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion('2025-10-15', '2026-10-15', fechaRef);

      assert.equal(fechaDesde, '2026-10-01');
      assert.equal(fechaHasta, '2026-10-15');
    });

    it('no debe recortar si el contrato vence en un mes posterior', () => {
      const fechaRef = new Date(2026, 9, 2); // Octubre 2026
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion('2025-10-15', '2026-12-31', fechaRef);

      assert.equal(fechaHasta, '2026-10-31');
    });

    it('debe comportarse correctamente si fechaHastaContrato es null o undefined', () => {
      const fechaRef = new Date(2026, 9, 1); // Octubre 2026
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion('2026-05-10', null, fechaRef);

      assert.equal(fechaDesde, '2026-10-01');
      assert.equal(fechaHasta, '2026-10-31');
    });
  });

  // =========================================================================
  // 4. Duración variable de meses (28, 29, 30, 31 días)
  // =========================================================================
  describe('4. Precisión de fin de mes en distintos meses y años', () => {
    it('debe calcular día 28 en febrero no bisiesto (2025)', () => {
      const fechaRef = new Date(2025, 1, 10); // Febrero 2025
      const { fechaHasta } = calcularPeriodoFacturacion('2024-01-01', '2026-01-01', fechaRef);
      assert.equal(fechaHasta, '2025-02-28');
    });

    it('debe calcular día 29 en febrero bisiesto (2024)', () => {
      const fechaRef = new Date(2024, 1, 10); // Febrero 2024
      const { fechaHasta } = calcularPeriodoFacturacion('2023-01-01', '2025-01-01', fechaRef);
      assert.equal(fechaHasta, '2024-02-29');
    });

    it('debe calcular día 30 en meses de 30 días (abril 2026)', () => {
      const fechaRef = new Date(2026, 3, 10); // Abril 2026
      const { fechaHasta } = calcularPeriodoFacturacion('2025-01-01', '2027-01-01', fechaRef);
      assert.equal(fechaHasta, '2026-04-30');
    });
  });

  // =========================================================================
  // 5. Sanitización de formatos de entrada (ISO / Timestamps)
  // =========================================================================
  describe('5. Sanitización de formatos de entrada (ISO y objetos Date)', () => {
    it('debe procesar cadenas ISO con zona horaria (YYYY-MM-DDTHH:mm:ss.sssZ)', () => {
      const fechaRef = new Date(2026, 9, 10);
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion(
        '2026-10-08T14:30:00.000Z',
        '2026-10-25T23:59:59.000Z',
        fechaRef
      );

      assert.equal(fechaDesde, '2026-10-08');
      assert.equal(fechaHasta, '2026-10-25');
    });

    it('debe procesar objetos Date nativos', () => {
      const fechaRef = new Date(2026, 9, 10);
      const { fechaDesde, fechaHasta } = calcularPeriodoFacturacion(
        new Date(2026, 9, 8),
        new Date(2027, 9, 8),
        fechaRef
      );

      assert.equal(fechaDesde, '2026-10-08');
      assert.equal(fechaHasta, '2026-10-31');
    });
  });

});
