import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { asientoContable } from "../../helpers/asientoContable.js";
import { getParametro } from "../../helpers/getParametro.js";
import {
  getNumeroAsiento,
  getNumeroAsientoSecundario,
} from "../../helpers/getNumeroAsiento.js";
import { handleError, acciones } from "../../helpers/handleError.js";

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
    const { body } = handleError(error, "cuentas contables", acciones.get);
    return res.send(body);
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
    const { body } = handleError(error, "Concepto de costo", acciones.post);
    return res.send(body);
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
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Conceptos de costos", acciones.get);
    return res.send(body);
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
    const { body } = handleError(error, "Conceptos de costos", acciones.get);
    return res.send(body);
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
    const { body } = handleError(error, "Conceptos de costos", acciones.update);
    return res.send(body);
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
    const { body } = handleError(error, "costo/ingreso", acciones.get);
    return res.send(body);
  }
};
//FUNCION AUXILIAR
const asientos_costos_ingresos = async (
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
  let cuentaIVA;
  let cuentaSecundariaIVA;
  let cuentaTOTC;
  let cuentaTOT2;
  let NroAsiento;
  let NroAsientoSecundario;
  if (!ingreso_egreso)
    throw new Error("Error al decodificar si es ingreso o egreso");
  const dhNetoEIva = ingreso_egreso === "I" ? "H" : "D";
  const dhTotal = ingreso_egreso === "I" ? "D" : "H";
  try {
    if (ingreso_egreso === "E") cuentaIVA = await getParametro("IC21");
    if (ingreso_egreso === "I") cuentaIVA = await getParametro("IV21");
    cuentaTOTC = await getParametro("TOTC");
    //OBTENGO  CUENTA IC22/IV22 Y TOT2 SI HAY CUENTA SECUNDARIA
    if (CuentaSecundaria) {
      if (ingreso_egreso === "E")
        cuentaSecundariaIVA = await getParametro("IC22");
      if (ingreso_egreso === "I")
        cuentaSecundariaIVA = await getParametro("IV22");
      cuentaTOT2 = await getParametro("TOT2");
    }
  } catch (error) {
    throw error;
  }
  //OBTENGO CUENTA IC21 Y TOTC
  try {
    NroAsiento = await getNumeroAsiento();
    if (CuentaSecundaria)
      NroAsientoSecundario = await getNumeroAsientoSecundario();
  } catch (error) {
    throw error;
  }
  try {
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      Cuenta,
      dhNetoEIva,
      importe_neto,
      observacion,
      transaction,
      comprobante,
      Fecha
    );
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaIVA,
      dhNetoEIva,
      importe_iva,
      observacion,
      transaction,
      comprobante,
      Fecha
    );
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaTOTC,
      dhTotal,
      importe_total,
      observacion,
      transaction,
      comprobante,
      Fecha
    );
    if (CuentaSecundaria) {
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        CuentaSecundaria,
        dhNetoEIva,
        importe_neto,
        observacion,
        transaction,
        comprobante,
        Fecha
      );
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuentaSecundariaIVA,
        dhNetoEIva,
        importe_iva,
        observacion,
        transaction,
        comprobante,
        Fecha
      );
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuentaTOT2,
        dhTotal,
        importe_total,
        observacion,
        transaction,
        comprobante,
        Fecha
      );
    }
  } catch (error) {
    console.log(error);
    throw error;
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
      `SELECT ingreso_egreso FROM conceptos_costos WHERE cuenta_contable = :cuenta`,
      {
        type: QueryTypes.SELECT,
        replacements: { cuenta },
      }
    );
    if (!result.length)
      throw new Error("No se encontró el concepto especificado");
    ingreso_egreso = result[0]["ingreso_egreso"];
  } catch (error) {
    console.log(error);
    await transaction_asientos.rollback();
    await transaction_costos_ingresos.rollback();
    throw new Error(
      `Error al buscar una cuenta contable ${
        error.message ? `${" :"}${error.message}` : ""
      }`
    );
  }
  try {
    NroAsiento = await asientos_costos_ingresos(
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
    throw error;
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
    const { body } = handleError(
      error,
      "Costo/ingreso del vehículo",
      acciones.post
    );
    return res.send(body);
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
      const { body } = handleError(
        error,
        "registrar costo/ingreso",
        acciones.post
      );
      return res.send(body);
    }
  }

  return res.send({
    status: true,
    message: "Se prorratearon los costos/ingresos correctamente",
  });
};
