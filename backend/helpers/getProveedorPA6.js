import { pa7_giama_renting } from "./connection.js";
import { QueryTypes } from "sequelize";

export const getProveedorPA6 = async (cuitCliente, nombreParaPA6) => {
  // 1. Cruzamos el CUIT contra el PA6 para ver si ya es "Proveedor"
  const [proveedorPA6] = await pa7_giama_renting.query(
    `SELECT Codigo FROM c_proveedores WHERE Cuit = ?`,
    {
      replacements: [cuitCliente],
      type: QueryTypes.SELECT
    }
  );

  let idProveedorPA6 = null;

  if (proveedorPA6) {
    idProveedorPA6 = proveedorPA6.Codigo;
    console.log("El chofer ya existe como proveedor en PA6. ID:", idProveedorPA6);
  } else {
    console.log("El chofer no existe en PA6. Insertando uno a modo de prueba...");
    const [result] = await pa7_giama_renting.query(
      `INSERT INTO c_proveedores (RazonSocial, Cuit, TipoResponsable) VALUES (?, ?, 1)`,
      {
        replacements: [nombreParaPA6 || 'PROVEEDOR DE PRUEBA RENTING', cuitCliente],
        type: QueryTypes.INSERT
      }
    );
    idProveedorPA6 = result; // En Sequelize con MySQL, result devuelve el ID autoincremental
    console.log("Proveedor de prueba insertado con ID:", idProveedorPA6);
  }

  return idProveedorPA6;
};
