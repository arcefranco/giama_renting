import { insertVehiculo } from "./../src/controllers/vehiculosController.js";
import * as XLSX from "xlsx";

function normalizeVehiculoData(row, usuario) {
  return {
    modelo: row.modelo || null,
    nro_chasis: row.nro_chasis || null,
    nro_motor: row.nro_motor || null,
    kilometros: row.km_iniciales || 0,
    costo: row.precio_inicial, // este es obligatorio
    color: row.color || null,
    sucursal: row.sucursal,
    numero_comprobante_1: row.punto_de_venta || null,
    numero_comprobante_2: row.nro_comprobante || null,
    usuario: usuario || "import_excel", // <<<< acá inyectamos el que vino del front
    cuenta_secundaria: row.cuenta_secundaria || null,
    proveedor_vehiculo: row.proveedor_vehiculo, // obligatorio
    meses_amortizacion: row.meses_amortizacion || null,
    dominio: row.dominio || null,
    dominio_provisorio: row.dominio_provisorio || null,
  };
}

export const importVehiculosFromExcel = async (bufferExcel, usuario) => {
  const workbook = XLSX.read(bufferExcel, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const results = [];
  for (const [i, row] of rows.entries()) {
    const vehiculoData = normalizeVehiculoData(row, usuario);

    try {
      const result = await insertVehiculo(vehiculoData, []);
      results.push({ fila: i + 2, ...result });
    } catch (error) {
      results.push({
        fila: i + 2,
        status: false,
        message: error.message || "Error inesperado",
      });
    }
  }

  return results;
};
