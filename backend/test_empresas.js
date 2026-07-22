import dotenv from "dotenv";
dotenv.config();
import { giama_renting, pa7_giama_renting } from "./helpers/connection.js";
import { registrarIngresoIndividual } from "./src/controllers/costosController.js";

// Desactivar SQL logging ruidoso para los tests
giama_renting.options.logging = false;
pa7_giama_renting.options.logging = false;

async function asegurarPlanCuentas() {
  await pa7_giama_renting.query(
    `INSERT INTO c_rubros (Codigo, Nombre) VALUES ('4105', 'Ingresos Operativos - Empresas') ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre)`
  );
  await pa7_giama_renting.query(
    `INSERT INTO c2_rubros (Codigo, Nombre) VALUES ('4105', 'Ingresos Operativos - Empresas') ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre)`
  );

  const cuentasNuevas = [
    ["410501", "Ingresos por alquileres empresa"],
    ["410502", "Ingresos por km extra empresas"],
    ["410503", "Ingresos por siniestros empresas"],
    ["410504", "Ingresos por franquicias empresa"],
    ["410505", "Ingresos por penalidades empresa"],
    ["410506", "Ingresos telepases empresas"],
    ["410507", "Intereses por financiamiento empresas"],
  ];

  for (const [codigo, nombre] of cuentasNuevas) {
    await pa7_giama_renting.query(
      `INSERT INTO c2_plancuentas (Codigo, Rubro, Nombre) VALUES (?, '4105', ?) ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre)`,
      { replacements: [codigo, nombre] }
    );
    await pa7_giama_renting.query(
      `INSERT INTO c_plancuentas (Codigo, Rubro, Nombre, CuentaSecundaria) VALUES (?, '4105', ?, ?) ON DUPLICATE KEY UPDATE Nombre = VALUES(Nombre)`,
      { replacements: [codigo, nombre, codigo] }
    );
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("   EJECUTANDO PRUEBAS DE EMPRESAS Y CONCEPTOS   ");
  console.log("=================================================\n");

  await asegurarPlanCuentas();

  const clienteEmpresaId = 381; // LABORATORIOS BURNET S A C I F I Y A (Empresa)
  const clienteNormalId = 179;  // Daniel Esteban Godoy (Persona Física)
  const vehiculoId = 6;         // AH087VQ

  const conceptosATestar = [
    { id: 33, nombre: "Franquicia G1", generaFactura: 0, cuentaEmpresaEsperada: "410504", cuentaNormalEsperada: "210116" },
    { id: 34, nombre: "Franquicia G2", generaFactura: 0, cuentaEmpresaEsperada: "410504", cuentaNormalEsperada: "210116" },
    { id: 35, nombre: "Telepase", generaFactura: 0, cuentaEmpresaEsperada: "410506", cuentaNormalEsperada: "110303" },
    { id: 39, nombre: "Km Extra", generaFactura: 1, cuentaEmpresaEsperada: "410502", cuentaNormalEsperada: "410102" },
    { id: 41, nombre: "Recargo Medio de Pago", generaFactura: 1, cuentaEmpresaEsperada: "410505", cuentaNormalEsperada: "410106" },
    { id: 42, nombre: "Recargo Pago Atrasado", generaFactura: 1, cuentaEmpresaEsperada: "410505", cuentaNormalEsperada: "410106" },
    { id: 46, nombre: "Indemnizaciones por seguros", generaFactura: 0, cuentaEmpresaEsperada: "410401", cuentaNormalEsperada: "410401" },
  ];

  const resultados = [];

  for (const cte of [{ id: clienteEmpresaId, tipo: "EMPRESA" }, { id: clienteNormalId, tipo: "PERSONA FÍSICA" }]) {
    for (const conc of conceptosATestar) {
      const transaction_costos_ingresos = await giama_renting.transaction();
      const transaction_asientos = await pa7_giama_renting.transaction();

      try {
        await registrarIngresoIndividual({
          id_vehiculo: vehiculoId,
          fecha_deuda: "2026-07-22",
          id_cliente: cte.id,
          observacion: `Prueba ${conc.nombre} - ${cte.tipo}`,
          usuario: "test_user",
          id_concepto: conc.id,
          importe_neto: 1000,
          importe_iva: 210,
          importe_total: 1210,
          debe_ingreso: 1210,
          transaction_costos_ingresos,
          transaction_asientos,
        });

        // Consultar registro insertado en costos_ingresos
        const [costos] = await giama_renting.query(
          "SELECT nro_asiento, id_factura_pa6 FROM costos_ingresos ORDER BY id DESC LIMIT 1",
          { transaction: transaction_costos_ingresos }
        );
        const nroAsiento = costos[0]?.nro_asiento;
        const idFactura = costos[0]?.id_factura_pa6;

        let factura = null;
        if (idFactura) {
          const [facturas] = await pa7_giama_renting.query(
            "SELECT Id, PuntoVenta, Tipo, NroAsiento FROM facturas WHERE Id = ?",
            { replacements: [idFactura], transaction: transaction_asientos }
          );
          factura = facturas[0];
        }

        // Consultar movimientos contables generados en PA7
        const [movs] = await pa7_giama_renting.query(
          "SELECT NroAsiento, Cuenta, DH, Importe FROM c_movimientos WHERE NroAsiento = ?",
          { replacements: [nroAsiento || 0], transaction: transaction_asientos }
        );

        const movConcepto = movs.find((m) => m.DH === "H" && m.Cuenta !== "110310" && m.Cuenta !== "210201");

        const pvOk = conc.generaFactura === 0 || (factura?.PuntoVenta === (cte.tipo === "EMPRESA" ? 4 : 2));
        const cuentaOk = movConcepto?.Cuenta == (cte.tipo === "EMPRESA" ? conc.cuentaEmpresaEsperada : conc.cuentaNormalEsperada);

        resultados.push({
          Cliente: cte.tipo,
          Concepto: conc.nombre,
          Factura: conc.generaFactura ? "Genera Factura" : "No genera Factura",
          PV: factura ? factura.PuntoVenta : "N/A",
          PV_Esperado: conc.generaFactura ? (cte.tipo === "EMPRESA" ? 4 : 2) : "N/A",
          CuentaAsiento: movConcepto ? movConcepto.Cuenta : "N/A",
          CuentaEsperada: cte.tipo === "EMPRESA" ? conc.cuentaEmpresaEsperada : conc.cuentaNormalEsperada,
          Resultado: (pvOk && cuentaOk) ? "PASÓ ✅" : "FALLÓ ❌"
        });

        await transaction_costos_ingresos.rollback();
        await transaction_asientos.rollback();
      } catch (err) {
        console.error(`Error en ${conc.nombre} (${cte.tipo}):`, err.message);
        await transaction_costos_ingresos.rollback();
        await transaction_asientos.rollback();
      }
    }
  }

  console.table(resultados);
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Error general en ejecutor de tests:", err);
  process.exit(1);
});
