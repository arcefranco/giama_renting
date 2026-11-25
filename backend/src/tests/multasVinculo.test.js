import { describe, it, afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { giama_renting } from "../../helpers/connection.js";
import { resolverCostosIngresosMultas } from "../../helpers/multasVinculo.js";

const multa = (datos) => ({
  dominio: "AH645XB",
  acta_nro: "",
  motivo_infraccion: "Exceso de velocidad",
  id_costo_ingreso: null,
  ...datos,
});

const costo = (datos) => ({
  nro_asiento: 1000 + datos.id,
  anulado: 0,
  id_factura_pa6: null,
  ...datos,
});

describe("resolverCostosIngresosMultas", () => {
  afterEach(() => mock.restoreAll());

  it("usa el vínculo explícito id_costo_ingreso cuando existe", async () => {
    mock.method(giama_renting, "query", async (sql) => {
      assert.match(sql, /FROM costos_ingresos WHERE id IN/);
      return [costo({ id: 50, observacion: "cualquier cosa" })];
    });

    const vinculos = await resolverCostosIngresosMultas([multa({ id: 1, id_costo_ingreso: 50 })]);

    assert.equal(vinculos.get(1).id, 50);
    assert.equal(vinculos.get(1).nro_asiento, 1050);
  });

  it("cruza por observación con el acta y descarta deudas de otra acta", async () => {
    mock.method(giama_renting, "query", async () => [
      costo({ id_multa: 1, id: 10, observacion: "Dominio: AH645XB - MULTA - Acta: 999 - Motivo: Exceso de velocidad" }),
      costo({ id_multa: 1, id: 11, observacion: "Dominio: AH645XB - MULTA - Acta: 123 - Motivo: Exceso de velocidad" }),
    ]);

    const vinculos = await resolverCostosIngresosMultas([multa({ id: 1, acta_nro: "123" })]);

    assert.equal(vinculos.get(1).id, 11);
    assert.equal(vinculos.get(1).id_multa, undefined);
  });

  it("asigna 1 a 1 por orden de id cuando las observaciones son idénticas (acta vacía guardada como 'undefined')", async () => {
    const observacion = "Dominio: AH645XB - MULTA - Acta: undefined - Motivo: Exceso de velocidad";
    mock.method(giama_renting, "query", async () => [
      costo({ id_multa: 1, id: 20, observacion }),
      costo({ id_multa: 1, id: 21, observacion }),
      costo({ id_multa: 2, id: 20, observacion }),
      costo({ id_multa: 2, id: 21, observacion }),
    ]);

    const vinculos = await resolverCostosIngresosMultas([multa({ id: 2 }), multa({ id: 1 })]);

    assert.equal(vinculos.get(1).id, 20);
    assert.equal(vinculos.get(2).id, 21);
  });

  it("acepta la observación truncada por la columna", async () => {
    mock.method(giama_renting, "query", async () => [
      costo({ id_multa: 1, id: 30, observacion: "Dominio: AH645XB - MULTA - Acta: 123 - Motivo: Exceso de vel" }),
    ]);

    const vinculos = await resolverCostosIngresosMultas([multa({ id: 1, acta_nro: "123" })]);

    assert.equal(vinculos.get(1).id, 30);
  });

  it("no vincula si no hay deuda que coincida", async () => {
    mock.method(giama_renting, "query", async () => [
      costo({ id_multa: 1, id: 40, observacion: "Dominio: AA111AA - MULTA - Acta: 123 - Motivo: Exceso de velocidad" }),
    ]);

    const vinculos = await resolverCostosIngresosMultas([multa({ id: 1, acta_nro: "123" })]);

    assert.equal(vinculos.has(1), false);
  });
});
