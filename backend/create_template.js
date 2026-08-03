import * as xlsx from 'xlsx';
import fs from 'fs';

const data = [
  {
    "FECHA": "2026-08-01",
    "PATENTE": "AH252TY",
    "CHOFER": "Juan Perez",
    "TARIFA": 1500,
    "BONIFICACION": 0,
    "AUTOPISTA": "AUBASA"
  },
  {
    "FECHA": "2026-08-02",
    "PATENTE": "AH205QU",
    "CHOFER": "LABORATORIOS BURNET",
    "TARIFA": 2300.50,
    "BONIFICACION": 0,
    "AUTOPISTA": "AUSA"
  }
];

const ws = xlsx.utils.json_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "PASADAS");

xlsx.writeFile(wb, "../frontend/public/Plantilla_Telepases.xlsx");
console.log("Plantilla creada correctamente");
