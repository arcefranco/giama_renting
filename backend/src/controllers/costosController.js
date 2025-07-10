import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { handleSqlError } from "../../helpers/handleSqlError.js";

export const getCuentasContables = async (req, res) => {
  try {
    const resultado = await pa7_giama_renting.query(
      "SELECT Codigo, Nombre, CuentaSecundaria FROM c_plancuentas",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

//CONCEPTOS
export const postConceptoCostos = async (req, res) => {
  const {
    nombre,
    cuenta_contable,
    cuenta_secundaria,
    ingreso_egreso,
    activable,
  } = req.body;
  if (!nombre || !cuenta_contable || !ingreso_egreso) {
    return res.send({ status: false, message: "Faltan datos" });
  }
  if (ingreso_egreso == "I" && activable == 1) {
    return res.send({
      status: false,
      message: "Un ingreso no puede ser un gasto activable",
    });
  }
  try {
    await giama_renting.query(
      "INSERT INTO conceptos_costos (nombre, cuenta_contable, cuenta_secundaria, ingreso_egreso, activable) VALUES (?,?,?,?,?)",
      {
        type: QueryTypes.INSERT,
        replacements: [
          nombre,
          cuenta_contable,
          cuenta_secundaria,
          ingreso_egreso,
          activable,
        ],
      }
    );
    return res.send({ status: true, message: "Concepto ingresado con éxito" });
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};

export const getConceptosCostos = async (req, res) => {
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM conceptos_costos",
      {
        type: QueryTypes.SELECT,
      }
    );
    console.log(resultado);
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

export const getConceptosCostosById = async (req, res) => {
  const { id } = req.body;
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM conceptos_costos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

export const deleteConceptosCostos = async (req, res) => {
  const { id } = req.body;
  try {
    await giama_renting.query("DELETE FROM conceptos_costos WHERE id = ?", {
      type: QueryTypes.DELETE,
      replacements: [id],
    });
    return res.send({
      status: true,
      message: "Concepto eliminado correctamente",
    });
  } catch (error) {
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};

export const updateConceptoCostos = async (req, res) => {
  const {
    id,
    nombre,
    cuenta_contable,
    cuenta_secundaria,
    ingreso_egreso,
    activable,
  } = req.body;
  if (!nombre || !cuenta_contable || !ingreso_egreso) {
    return res.send({ status: false, message: "Faltan datos" });
  }
  try {
    await giama_renting.query(
      "UPDATE conceptos_costos SET nombre = ?, cuenta_contable = ?, cuenta_secundaria = ?, ingreso_egreso = ?, activable = ? WHERE id = ?",
      {
        type: QueryTypes.INSERT,
        replacements: [
          nombre,
          cuenta_contable,
          cuenta_secundaria,
          ingreso_egreso,
          activable,
          id,
        ],
      }
    );
    return res.send({
      status: true,
      message: "Concepto actualizado con éxito",
    });
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};
//CONCEPTOS

export const getCostosIngresosByIdVehiculo = async (req, res) => {
  const { id } = req.body;
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM costos_ingresos WHERE id_vehiculo = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};
//FUNCION AUXILIAR
const asiento_costos_ingresos = async (
  //FUNCION AUXILIAR
  Fecha,
  Cuenta,
  CuentaSecundaria,
  importe_neto,
  importe_iva,
  importe_total,
  observacion,
  comprobante,
  ingreso_egreso,
  transaction
) => {
  let cuentaIC21;
  let cuentaIV21;
  let cuentaTOTC;
  let cuentaIC22;
  let cuentaIV22;
  let cuentaTOT2;
  let NroAsiento;
  let NroAsientoSecundario;
  const dhNetoEIva = ingreso_egreso === "I" ? "H" : "D";
  const dhTotal = ingreso_egreso === "I" ? "D" : "H";
  //OBTENGO CUENTA IC21 Y TOTC
  if (ingreso_egreso === "E") {
    try {
      const result = await giama_renting.query(
        `SELECT valor_str FROM parametros WHERE codigo = "IC21"`,
        {
          type: QueryTypes.SELECT,
        }
      );
      cuentaIC21 = result[0]["valor_str"];
    } catch (error) {
      console.log(error);
      throw "Error al buscar un parámetro";
    }
  }
  if (ingreso_egreso === "I") {
    try {
      const result = await giama_renting.query(
        `SELECT valor_str FROM parametros WHERE codigo = "IV21"`,
        {
          type: QueryTypes.SELECT,
        }
      );
      cuentaIV21 = result[0]["valor_str"];
    } catch (error) {
      console.log(error);
      throw "Error al buscar un parámetro";
    }
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "TOTC"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaTOTC = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    throw new Error("Error al buscar un parámetro");
  }
  //OBTENGO  CUENTA IC22/IV22 Y TOT2 SI HAY CUENTA SECUNDARIA
  if (CuentaSecundaria) {
    if (ingreso_egreso === "E") {
      try {
        const result = await giama_renting.query(
          `SELECT valor_str FROM parametros WHERE codigo = "IC21"`,
          {
            type: QueryTypes.SELECT,
          }
        );
        cuentaIC22 = result[0]["valor_str"];
      } catch (error) {
        console.log(error);
        throw new Error("Error al buscar un parámetro");
      }
    }
    if (ingreso_egreso === "I") {
      try {
        const result = await giama_renting.query(
          `SELECT valor_str FROM parametros WHERE codigo = "IV21"`,
          {
            type: QueryTypes.SELECT,
          }
        );
        cuentaIV22 = result[0]["valor_str"];
      } catch (error) {
        console.log(error);
        throw new Error("Error al buscar un parámetro");
      }
    }
    if (!ingreso_egreso)
      throw new Error("Error al decodificar si es ingreso o egreso");
    try {
      const result = await giama_renting.query(
        `SELECT valor_str FROM parametros WHERE codigo = "TOT2"`,
        {
          type: QueryTypes.SELECT,
        }
      );
      cuentaTOT2 = result[0]["valor_str"];
    } catch (error) {
      console.log(error);
      throw new Error("Error al buscar un parámetro");
    }
  }
  //OBTENGO Y GUARDO NUMERO DE ASIENTO
  try {
    const result = await pa7_giama_renting.query(
      `
        SET @nro_asiento = 0;
        CALL net_getnumeroasiento(@nro_asiento);
        SELECT @nro_asiento AS nroAsiento;
      `,
      { type: QueryTypes.SELECT }
    );
    NroAsiento = result[2][0].nroAsiento;
  } catch (error) {
    throw new Error(`Error al obtener número de asiento: ${error}`);
  }
  //OBTENGO Y GUARDO NUMERO DE ASIENTO SECUNDARIO SI HAY CUENTA SECUNDARIA
  if (CuentaSecundaria) {
    try {
      const result = await pa7_giama_renting.query(
        `
        SET @nro_asiento = 0;
        CALL net_getnumeroasientosecundario(@nro_asiento);
        SELECT @nro_asiento AS nroAsiento;
      `,
        { type: QueryTypes.SELECT }
      );
      NroAsientoSecundario = result[2][0].nroAsiento;
    } catch (error) {
      throw new Error(`Error al obtener número de asiento: ${error}`);
    }
  }
  //MOVIMIENTO 1
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movimientos 
      (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante) VALUES (?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          Fecha,
          NroAsiento,
          Cuenta,
          dhNetoEIva,
          importe_neto,
          observacion,
          comprobante,
        ],
        transaction: transaction,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(`Hubo un error en la inserción del asiento: ${error}`);
  }
  //MOVIMIENTO 2
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movimientos 
      (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante) VALUES (?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          Fecha,
          NroAsiento,
          ingreso_egreso === "E"
            ? cuentaIC21
            : ingreso_egreso === "I"
            ? cuentaIV21
            : "",
          dhNetoEIva,
          importe_iva,
          observacion,
          comprobante,
        ],
        transaction: transaction,
      }
    );
  } catch (error) {
    throw new Error(`Hubo un error en la inserción del asiento: ${error}`);
  }
  //MOVIMIENTO 3
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movimientos 
      (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante) VALUES (?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          Fecha,
          NroAsiento,
          cuentaTOTC,
          dhTotal,
          importe_total,
          observacion,
          comprobante,
        ],
        transaction: transaction,
      }
    );
  } catch (error) {
    throw new Error(`Hubo un error en la inserción del asiento: ${error}`);
  }
  //movimientos si hay cuenta secundaria
  if (CuentaSecundaria) {
    //MOVIMIENTO 1
    try {
      await pa7_giama_renting.query(
        `INSERT INTO c2_movimientos 
      (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante) VALUES (?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            Fecha,
            NroAsientoSecundario,
            CuentaSecundaria,
            dhNetoEIva,
            importe_neto,
            observacion,
            comprobante,
          ],
          transaction: transaction,
        }
      );
    } catch (error) {
      console.log(error);
      throw new Error(`Hubo un error en la inserción del asiento: ${error}`);
    }
    //MOVIMIENTO 2
    try {
      await pa7_giama_renting.query(
        `INSERT INTO c2_movimientos 
      (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante) VALUES (?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            Fecha,
            NroAsientoSecundario,
            ingreso_egreso === "E"
              ? cuentaIC22
              : ingreso_egreso === "I"
              ? cuentaIV22
              : "",
            dhNetoEIva,
            importe_iva,
            observacion,
            comprobante,
          ],
          transaction: transaction,
        }
      );
    } catch (error) {
      throw new Error(`Hubo un error en la inserción del asiento: ${error}`);
    }
    //MOVIMIENTO 3
    try {
      await pa7_giama_renting.query(
        `INSERT INTO c2_movimientos 
      (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto, NroComprobante) VALUES (?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            Fecha,
            NroAsientoSecundario,
            cuentaTOT2,
            dhTotal,
            importe_total,
            observacion,
            comprobante,
          ],
          transaction: transaction,
        }
      );
    } catch (error) {
      throw new Error(`Hubo un error en la inserción del asiento: ${error}`);
    }
  }
  return NroAsiento;
};
//FUNCION AUXILIAR
async function registrarCostoIngresoIndividual({
  id_vehiculo,
  fecha,
  id_concepto,
  comprobante,
  importe_neto,
  importe_iva,
  importe_total,
  observacion,
  cuenta,
  cuenta_secundaria,
}) {
  let transaction_costos_ingresos = await giama_renting.transaction();
  let transaction_asientos = await pa7_giama_renting.transaction();
  let ingreso_egreso;
  let NroAsiento;
  try {
    const result = await giama_renting.query(
      `SELECT ingreso_egreso FROM conceptos_costos WHERE cuenta_contable = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [cuenta],
      }
    );
    ingreso_egreso = result[0]["ingreso_egreso"];
  } catch (error) {
    console.log(error);
    await transaction_asientos.rollback();
    await transaction_costos_ingresos.rollback();
    throw new Error("Error al buscar cuenta contable");
  }
  try {
    NroAsiento = await asiento_costos_ingresos(
      fecha,
      cuenta,
      cuenta_secundaria,
      importe_neto,
      importe_iva,
      importe_total,
      observacion,
      comprobante,
      ingreso_egreso,
      transaction_asientos
    );
  } catch (error) {
    await transaction_asientos.rollback();
    transaction_costos_ingresos.rollback();
    throw new Error(error.message);
  }
  //se puede llamar solo pero retorna nroasiento para poder impactarlo en costos_ingresos
  //(solo asiento primario)
  const factor = ingreso_egreso === "E" ? -1 : 1;
  const importeNetoFinal = importe_neto * factor;
  const importeIvaFinal = importe_iva * factor;
  const importeTotalFinal = importe_total * factor;

  try {
    await giama_renting.query(
      `INSERT INTO costos_ingresos 
      (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva,
      importe_total, observacion, nro_asiento) VALUES (?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          fecha,
          id_concepto,
          comprobante,
          importeNetoFinal,
          importeIvaFinal,
          importeTotalFinal,
          observacion,
          NroAsiento,
        ],
        transaction: transaction_costos_ingresos,
      }
    );
    await transaction_costos_ingresos.commit();
    await transaction_asientos.commit();
  } catch (error) {
    await transaction_costos_ingresos.rollback();
    await transaction_asientos.rollback();
    throw new Error(error.message);
  }
}

export const postCostos_Ingresos = async (req, res) => {
  try {
    await registrarCostoIngresoIndividual(req.body);
    return res.send({ status: true, message: "Ingresado correctamente" });
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: error.message });
  }
};

export const prorrateoIE = async (req, res) => {
  const {
    arrayVehiculos,
    fecha,
    id_concepto,
    comprobante,
    importe_neto,
    importe_iva,
    importe_total,
    observacion,
    cuenta,
  } = req.body;

  if (!arrayVehiculos?.length) {
    return res.send({
      status: false,
      message: "No hay vehículos seleccionados",
    });
  }

  const cantidad = arrayVehiculos.length;

  const netoDividido = importe_neto / cantidad;
  const ivaDividido = importe_iva / cantidad;
  const totalDividido = importe_total / cantidad;

  for (const id_vehiculo of arrayVehiculos) {
    try {
      await registrarCostoIngresoIndividual({
        id_vehiculo,
        fecha,
        id_concepto,
        comprobante,
        importe_neto: netoDividido,
        importe_iva: ivaDividido,
        importe_total: totalDividido,
        observacion,
        cuenta,
      });
    } catch (error) {
      return res.send({ status: false, message: JSON.stringify(error) });
    }
  }

  return res.send({
    status: true,
    message: "Se prorratearon los costos/ingresos correctamente",
  });
};
