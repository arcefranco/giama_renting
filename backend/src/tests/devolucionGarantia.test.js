import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import {
  postDevolucionGarantia,
  anulacionDevolucionGarantia,
  ctaCteCliente,
} from "../controllers/ctacteController.js";

/**
 * Fixtures corporativos de Giama Renting para pruebas de Devolución de Garantía (Informativo)
 */
export const MOCK_FIXTURES_GIAMA = {
  cliente: {
    id_cliente: 576,
    razon_social: "SERVICIOS Y MARKETING AGROPECUARIO SRL",
    cuit: "30715489231",
  },
  vehiculo: {
    id_vehiculo: 65,
    modelo: "Fiat Cronos",
    dominio: "AH645XB",
  },
  contrato: {
    id_contrato: 329,
    id_cliente: 576,
    id_vehiculo: 65,
    deposito_garantia: "150000.00",
    garantia_devuelta: "35184.10",
  },
  devolucionValida: {
    id_cliente: 576,
    id_contrato: 329,
    fecha: "2026-11-24",
    importe: 114815.9,
    observacion: "Devolución registrada por OPV en PA6",
    usuario_alta_registro: "qa.automation@giama.com.ar",
  },
};

const createMockRes = () => {
  const res = {
    body: null,
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

const createMockTx = () => {
  let committed = false;
  let rolledBack = false;
  return {
    get committed() {
      return committed;
    },
    get rolledBack() {
      return rolledBack;
    },
    async commit() {
      committed = true;
    },
    async rollback() {
      rolledBack = true;
    },
  };
};

describe("Devolución de Garantía (Informativo) — Suite QA Giama Renting", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  // =========================================================================
  // 1. postDevolucionGarantia — Happy path, precisión decimal y cero impacto PA6
  // =========================================================================
  describe("1. postDevolucionGarantia — Registro informativo y aislamiento contable", () => {
    it("registra en devoluciones_garantia y actualiza garantia_devuelta sin tocar PA6 ni pagos/costos", async () => {
      const tx = createMockTx();
      const queriesEjecutadas = [];

      mock.method(giama_renting, "transaction", async () => tx);
      mock.method(giama_renting, "query", async (sql, options) => {
        queriesEjecutadas.push({ sql, options });
        if (sql.includes("FROM clientes")) {
          return [{ id: MOCK_FIXTURES_GIAMA.cliente.id_cliente }];
        }
        if (sql.includes("FROM contratos_alquiler")) {
          return [
            {
              id: MOCK_FIXTURES_GIAMA.contrato.id_contrato,
              deposito_garantia: MOCK_FIXTURES_GIAMA.contrato.deposito_garantia,
              garantia_devuelta: MOCK_FIXTURES_GIAMA.contrato.garantia_devuelta,
              id_vehiculo: MOCK_FIXTURES_GIAMA.vehiculo.id_vehiculo,
            },
          ];
        }
        return [1, 1];
      });

      const pa7QuerySpy = mock.method(pa7_giama_renting, "query", async () => {
        throw new Error("NO debe consultar ni escribir en pa7_giama_renting");
      });
      const pa7TxSpy = mock.method(pa7_giama_renting, "transaction", async () => {
        throw new Error("NO debe abrir transacción en pa7_giama_renting");
      });

      const req = { body: { ...MOCK_FIXTURES_GIAMA.devolucionValida } };
      const res = createMockRes();

      await postDevolucionGarantia(req, res);

      assert.equal(res.body.status, true);
      assert.equal(tx.committed, true, "Debe hacer commit de la transacción");
      assert.equal(tx.rolledBack, false, "No debe hacer rollback");
      assert.equal(pa7QuerySpy.mock.callCount(), 0, "No debe ejecutar queries en PA6/PA7");
      assert.equal(pa7TxSpy.mock.callCount(), 0, "No debe abrir transacciones en PA6/PA7");

      const insertDev = queriesEjecutadas.find((q) =>
        q.sql.includes("INSERT INTO devoluciones_garantia")
      );
      const updateContrato = queriesEjecutadas.find((q) =>
        q.sql.includes("UPDATE contratos_alquiler SET garantia_devuelta")
      );
      const touchedPagos = queriesEjecutadas.some((q) =>
        q.sql.includes("pagos_clientes")
      );
      const touchedCostos = queriesEjecutadas.some((q) =>
        q.sql.includes("costos_ingresos")
      );

      assert.ok(insertDev, "Debe insertar en devoluciones_garantia");
      assert.equal(insertDev.options.transaction, tx, "INSERT debe usar options.transaction");
      assert.ok(updateContrato, "Debe actualizar contratos_alquiler.garantia_devuelta");
      assert.equal(updateContrato.options.transaction, tx, "UPDATE debe usar options.transaction");
      assert.equal(touchedPagos, false, "NO debe insertar en pagos_clientes");
      assert.equal(touchedCostos, false, "NO debe insertar en costos_ingresos");

      // Precisión decimal exacta del caso real: 35184.10 + 114815.90 === 150000.00
      const montoRegistrado = insertDev.options.replacements[4];
      assert.ok(
        Math.abs(montoRegistrado - 114815.9) < 0.005,
        `Monto registrado esperado ~114815.90, recibido ${montoRegistrado}`
      );
    });

    it("rechaza importes inválidos (0, negativo, NaN, null) sin abrir transacción", async () => {
      const txSpy = mock.method(giama_renting, "transaction", async () => {
        throw new Error("No debería abrir transacción ante importe inválido");
      });
      mock.method(giama_renting, "query", async (sql) => {
        if (sql.includes("FROM clientes")) return [{ id: 576 }];
        if (sql.includes("FROM contratos_alquiler")) {
          return [{ id: 329, deposito_garantia: "150000.00", garantia_devuelta: "0.00", id_vehiculo: 65 }];
        }
        return [];
      });

      for (const importeInvalido of [0, -100, "abc", null, ""]) {
        const req = {
          body: { ...MOCK_FIXTURES_GIAMA.devolucionValida, importe: importeInvalido },
        };
        const res = createMockRes();
        await postDevolucionGarantia(req, res);
        assert.equal(res.body.status, false, `Debe rechazar importe=${importeInvalido}`);
      }
      assert.equal(txSpy.mock.callCount(), 0);
    });

    it("rechaza devolución que excede el saldo restante de la garantía", async () => {
      const txSpy = mock.method(giama_renting, "transaction", async () => {
        throw new Error("No debe abrir transacción si excede la garantía");
      });
      mock.method(giama_renting, "query", async (sql) => {
        if (sql.includes("FROM clientes")) return [{ id: 576 }];
        if (sql.includes("FROM contratos_alquiler")) {
          return [{ id: 329, deposito_garantia: "150000.00", garantia_devuelta: "35184.10", id_vehiculo: 65 }];
        }
        return [];
      });

      const req = {
        body: { ...MOCK_FIXTURES_GIAMA.devolucionValida, importe: 114815.95 },
      };
      const res = createMockRes();

      await postDevolucionGarantia(req, res);

      assert.equal(res.body.status, false);
      assert.match(res.body.message, /No puede devolver más del total de la garantía/);
      assert.equal(txSpy.mock.callCount(), 0);
    });

    it("ejecuta ROLLBACK completo si falla el UPDATE de contratos_alquiler", async () => {
      const tx = createMockTx();
      mock.method(giama_renting, "transaction", async () => tx);
      mock.method(giama_renting, "query", async (sql) => {
        if (sql.includes("FROM clientes")) return [{ id: 576 }];
        if (sql.includes("FROM contratos_alquiler")) {
          return [{ id: 329, deposito_garantia: "150000.00", garantia_devuelta: "0.00", id_vehiculo: 65 }];
        }
        if (sql.includes("INSERT INTO devoluciones_garantia")) return [10, 1];
        if (sql.includes("UPDATE contratos_alquiler")) {
          throw new Error("Simulated deadlock on contratos_alquiler");
        }
        return [];
      });

      const req = { body: { ...MOCK_FIXTURES_GIAMA.devolucionValida, importe: 50000 } };
      const res = createMockRes();

      await postDevolucionGarantia(req, res);

      assert.equal(res.body.status, false);
      assert.equal(tx.rolledBack, true, "Debe ejecutar rollback ante fallo parcial");
      assert.equal(tx.committed, false, "Nunca debe hacer commit si falló el UPDATE");
    });
  });

  // =========================================================================
  // 2. anulacionDevolucionGarantia — Reversión limpia y sin impacto en PA6
  // =========================================================================
  describe("2. anulacionDevolucionGarantia — Anulación solo informativa", () => {
    it("rechaza anulación sin motivo o con espacios en blanco", async () => {
      const txSpy = mock.method(giama_renting, "transaction", async () => {
        throw new Error("No debe abrir transacción sin motivo");
      });

      for (const motivo of ["", "   ", null, undefined]) {
        const res = createMockRes();
        await anulacionDevolucionGarantia({ body: { id_registro: 1, motivo } }, res);
        assert.equal(res.body.status, false);
        assert.match(res.body.message, /motivo/i);
      }
      assert.equal(txSpy.mock.callCount(), 0);
    });

    it("anula devoluciones_garantia, descuenta contratos_alquiler y registra auditoría sin tocar PA6", async () => {
      const tx = createMockTx();
      const queriesEjecutadas = [];

      mock.method(giama_renting, "transaction", async () => tx);
      mock.method(giama_renting, "query", async (sql, options) => {
        queriesEjecutadas.push({ sql, options });
        if (sql.includes("FROM devoluciones_garantia")) {
          return [
            {
              id: 1,
              id_contrato: 329,
              importe: "114815.90",
              anulado: 0,
              observacion: "OPV PA6",
            },
          ];
        }
        return [1, 1];
      });

      const pa7QuerySpy = mock.method(pa7_giama_renting, "query", async () => {
        throw new Error("Anular devolución informativa NO debe tocar PA6");
      });

      const req = {
        body: { id_registro: 1, motivo: "Cargado por error en contrato equivocado" },
        user: { id: 9, email: "qa.automation@giama.com.ar" },
      };
      const res = createMockRes();

      await anulacionDevolucionGarantia(req, res);

      assert.equal(res.body.status, true);
      assert.equal(tx.committed, true);
      assert.equal(tx.rolledBack, false);
      assert.equal(pa7QuerySpy.mock.callCount(), 0);

      const updDev = queriesEjecutadas.find((q) =>
        q.sql.includes("UPDATE devoluciones_garantia SET anulado = 1")
      );
      const updContrato = queriesEjecutadas.find((q) =>
        q.sql.includes("GREATEST(0, IFNULL(garantia_devuelta, 0) - ?)")
      );
      const insHist = queriesEjecutadas.find((q) =>
        q.sql.includes("INSERT INTO historial_anulaciones")
      );

      assert.ok(updDev, "Debe marcar anulado = 1 en devoluciones_garantia");
      assert.equal(updDev.options.transaction, tx);
      assert.ok(updContrato, "Debe descontar garantia_devuelta con piso en 0");
      assert.equal(updContrato.options.transaction, tx);
      assert.ok(insHist, "Debe registrar motivo en historial_anulaciones");
    });

    it("impide doble anulación si el registro ya tiene anulado = 1", async () => {
      const tx = createMockTx();
      mock.method(giama_renting, "transaction", async () => tx);
      mock.method(giama_renting, "query", async (sql) => {
        if (sql.includes("FROM devoluciones_garantia")) {
          return [{ id: 1, id_contrato: 329, importe: "114815.90", anulado: 1, observacion: "" }];
        }
        return [];
      });

      const res = createMockRes();
      await anulacionDevolucionGarantia({ body: { id_registro: 1, motivo: "Reintento" } }, res);

      assert.equal(res.body.status, false);
      assert.match(res.body.message, /ya fue anulada/i);
      assert.equal(tx.rolledBack, true);
      assert.equal(tx.committed, false);
    });
  });

  // =========================================================================
  // 3. ctaCteCliente — Invariante matemático (tipo = 5 excluido de @saldo)
  // =========================================================================
  describe("3. ctaCteCliente — Invariante de saldo y visibilidad de anulados", () => {
    it("excluye tipo = 5 del cálculo de @saldo en SQL y filtra anulados según ver_anulados", async () => {
      let capturedSql = "";
      let capturedReplacements = [];

      mock.method(giama_renting, "query", async (sql, options) => {
        capturedSql = sql;
        capturedReplacements = options.replacements;
        return [
          { fecha: "2026-08-27", tipo: 4, debe: null, haber: "35184.10", saldo: 0, anulado: 0 },
          {
            fecha: "2026-11-24",
            tipo: 5,
            debe: null,
            haber: null,
            garantia_devuelta: "114815.90",
            saldo: 0,
            anulado: 0,
          },
          {
            fecha: "2026-11-24",
            tipo: 5,
            debe: null,
            haber: null,
            garantia_devuelta: "10000.00",
            saldo: 0,
            anulado: 1,
          },
        ];
      });

      const resSinAnulados = createMockRes();
      await ctaCteCliente({ body: { id_cliente: 576, ver_anulados: false } }, resSinAnulados);

      assert.match(
        capturedSql,
        /CASE WHEN m\.anulado = 1 OR m\.tipo = 5 THEN 0 ELSE IFNULL\(m\.debe, 0\) - IFNULL\(m\.haber, 0\) END/,
        "La query debe excluir explícitamente m.tipo = 5 del cálculo de @saldo"
      );
      assert.match(capturedSql, /FROM devoluciones_garantia dg/, "Debe incluir el UNION ALL de devoluciones_garantia");
      assert.equal(capturedReplacements.length, 6, "Debe pasar exactamente 6 placeholders id_cliente");
      assert.equal(resSinAnulados.body.length, 2, "Sin ver_anulados debe ocultar las filas anuladas");
      assert.equal(resSinAnulados.body[resSinAnulados.body.length - 1].saldo, 0);

      const resConAnulados = createMockRes();
      await ctaCteCliente({ body: { id_cliente: 576, ver_anulados: true } }, resConAnulados);
      assert.equal(resConAnulados.body.length, 3, "Con ver_anulados=true debe incluir la devolución anulada");
    });
  });
});

