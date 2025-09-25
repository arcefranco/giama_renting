import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { asientoContable } from "../../helpers/asientoContable.js";
import { getParametro } from "../../helpers/getParametro.js";
import {
  getNumeroAsiento,
  getNumeroAsientoSecundario,
} from "../../helpers/getNumeroAsiento.js";
import { handleError, acciones } from "../../helpers/handleError.js";
import { insertRecibo } from "../../helpers/insertRecibo.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { insertFactura } from "../../helpers/insertFactura.js";
import { padWithZeros } from "../../helpers/padWithZeros.js";
import {
  movimientosProveedores,
  movimientosProveedoresEgresos,
} from "../../helpers/movimientosProveedores.js";
import { toNumber } from "../../helpers/toNumber.js";

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
    genera_recibo,
    genera_factura,
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
  if (
    (ingreso_egreso == "E" && genera_recibo == 1) ||
    (ingreso_egreso == "E" && genera_factura == 1)
  ) {
    return res.send({
      status: false,
      message: "Un egreso no puede generar recibo o factura",
    });
  }
  try {
    await giama_renting.query(
      `INSERT INTO conceptos_costos (nombre, cuenta_contable, cuenta_secundaria, 
      ingreso_egreso, activable, genera_recibo, genera_factura) VALUES (?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          nombre,
          cuenta_contable,
          cuenta_secundaria,
          ingreso_egreso,
          activable,
          genera_recibo,
          genera_factura,
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
    activable,
    genera_factura,
    genera_recibo,
  } = req.body;
  if (!nombre || !cuenta_contable) {
    return res.send({ status: false, message: "Faltan datos" });
  }
  try {
    await giama_renting.query(
      `UPDATE conceptos_costos SET nombre = ?, cuenta_contable = ?, 
      cuenta_secundaria = ?, activable = ?, genera_factura = ?, genera_recibo = ? WHERE id = ?`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          nombre,
          cuenta_contable,
          cuenta_secundaria,
          activable,
          genera_factura,
          genera_recibo,
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
      `SELECT ci.*, cc.ingreso_egreso
        FROM costos_ingresos ci
        JOIN conceptos_costos cc 
        ON ci.id_concepto = cc.id
        WHERE ci.id_vehiculo = ?`,
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
  cuenta_concepto,
  cuenta_secundaria_concepto,
  cuenta_forma_cobro,
  cuenta_secundaria_forma_cobro,
  importe_neto_total_1,
  importe_neto_total_2,
  importe_neto_total_3,
  importe_iva_total_1,
  importe_iva_total_2,
  importe_iva_total_3,
  importe_tasa_IIBB_CABA,
  importe_tasa_IIBB,
  importe_tasa_IVA,
  cuenta_concepto_2,
  cuenta_secundaria_concepto_2,
  cuenta_concepto_3,
  cuenta_secundaria_concepto_3,
  cuenta_percepcion_IIBB,
  cuenta_secundaria_percepcion_IIBB,
  cuenta_percepcion_IIBB_CABA,
  cuenta_secundaria_percepcion_IIBB_CABA,
  cuenta_percepcion_IVA,
  cuenta_secundaria_percepcion_IVA,
  observacion,
  comprobante,
  ingreso_egreso,
  transaction,
  NroAsiento,
  NroAsientoSecundario,
  TipoComprobante
) => {
  let cuentaIVA;
  let cuentaSecundariaIVA;
  let importe_total_asientos =
    importe_neto_total_1 +
    importe_neto_total_2 +
    importe_neto_total_3 +
    importe_iva_total_1 +
    importe_iva_total_2 +
    importe_iva_total_3 +
    importe_tasa_IIBB +
    importe_tasa_IIBB_CABA +
    importe_tasa_IVA;

  if (!ingreso_egreso)
    throw new Error("Error al decodificar si es ingreso o egreso");
  const dhNetoEIva = ingreso_egreso === "I" ? "H" : "D";
  const dhTotal = ingreso_egreso === "I" ? "D" : "H";
  try {
    if (ingreso_egreso === "E") cuentaIVA = await getParametro("IC21");
    if (ingreso_egreso === "I") cuentaIVA = await getParametro("IV21");
    if (cuenta_secundaria_concepto) {
      if (ingreso_egreso === "E")
        cuentaSecundariaIVA = await getParametro("IC22");
      if (ingreso_egreso === "I")
        cuentaSecundariaIVA = await getParametro("IV22");
    }
  } catch (error) {
    throw error;
  }

  if (
    (importe_neto_total_1 && !cuenta_concepto) ||
    (!importe_neto_total_1 && cuenta_concepto) ||
    (importe_neto_total_2 && !cuenta_concepto_2) ||
    (!importe_neto_total_2 && cuenta_concepto_2) ||
    (importe_neto_total_3 && !cuenta_concepto_3) ||
    (!importe_neto_total_3 && cuenta_concepto_3)
  ) {
    throw new Error(
      "No puede asignar un importe sin un concepto ni un concepto sin un importe"
    );
  }

  try {
    /**EGRESOS: IMPORTES NETO DEBE */
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_concepto,
      dhNetoEIva,
      importe_neto_total_1,
      observacion,
      transaction,
      comprobante,
      Fecha,
      NroAsientoSecundario,
      TipoComprobante
    );
    if (importe_neto_total_2) {
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuenta_concepto_2,
        dhNetoEIva,
        importe_neto_total_2,
        observacion,
        transaction,
        comprobante,
        Fecha,
        NroAsientoSecundario,
        TipoComprobante
      );
    }
    if (importe_neto_total_3) {
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuenta_concepto_3,
        dhNetoEIva,
        importe_neto_total_3,
        observacion,
        transaction,
        comprobante,
        Fecha,
        NroAsientoSecundario,
        TipoComprobante
      );
    }
    if (importe_iva_total_1 > 0) {
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuentaIVA,
        dhNetoEIva,
        importe_iva_total_1,
        observacion,
        transaction,
        comprobante,
        Fecha,
        NroAsientoSecundario,
        TipoComprobante
      );
    }
    if (importe_iva_total_2 > 0) {
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuentaIVA,
        dhNetoEIva,
        importe_iva_total_2,
        observacion,
        transaction,
        comprobante,
        Fecha,
        NroAsientoSecundario,
        TipoComprobante
      );
    }
    if (importe_iva_total_3 > 0) {
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuentaIVA,
        dhNetoEIva,
        importe_iva_total_3,
        observacion,
        transaction,
        comprobante,
        Fecha,
        NroAsientoSecundario,
        TipoComprobante
      );
    }
    /**asientos de percepcion*/
    if (ingreso_egreso === "E") {
      if (importe_tasa_IIBB) {
        await asientoContable(
          "c_movimientos",
          NroAsiento,
          cuenta_percepcion_IIBB,
          "D",
          importe_tasa_IIBB,
          observacion,
          transaction,
          comprobante,
          Fecha,
          NroAsientoSecundario,
          TipoComprobante
        );
      }
      if (importe_tasa_IIBB_CABA) {
        await asientoContable(
          "c_movimientos",
          NroAsiento,
          cuenta_percepcion_IIBB_CABA,
          "D",
          importe_tasa_IIBB_CABA,
          observacion,
          transaction,
          comprobante,
          Fecha,
          NroAsientoSecundario,
          TipoComprobante
        );
      }
      if (importe_tasa_IVA) {
        await asientoContable(
          "c_movimientos",
          NroAsiento,
          cuenta_percepcion_IVA,
          "D",
          importe_tasa_IVA,
          observacion,
          transaction,
          comprobante,
          Fecha,
          NroAsientoSecundario,
          TipoComprobante
        );
      }
    }
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_forma_cobro,
      dhTotal,
      importe_total_asientos,
      observacion,
      transaction,
      comprobante,
      Fecha,
      NroAsientoSecundario,
      TipoComprobante
    );
    if (cuenta_secundaria_concepto) {
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuenta_secundaria_concepto,
        dhNetoEIva,
        importe_neto_total_1,
        observacion,
        transaction,
        comprobante,
        Fecha,
        null,
        TipoComprobante
      );
      if (importe_neto_total_2) {
        await asientoContable(
          "c2_movimientos",
          NroAsientoSecundario,
          cuenta_secundaria_concepto_2,
          dhNetoEIva,
          importe_neto_total_2,
          observacion,
          transaction,
          comprobante,
          Fecha,
          null,
          TipoComprobante
        );
      }
      if (importe_neto_total_3) {
        await asientoContable(
          "c2_movimientos",
          NroAsientoSecundario,
          cuenta_secundaria_concepto_3,
          dhNetoEIva,
          importe_neto_total_3,
          observacion,
          transaction,
          comprobante,
          Fecha,
          null,
          TipoComprobante
        );
      }
      if (importe_iva_total_1 > 0) {
        await asientoContable(
          "c2_movimientos",
          NroAsientoSecundario,
          cuentaSecundariaIVA,
          dhNetoEIva,
          importe_iva_total_1,
          observacion,
          transaction,
          comprobante,
          Fecha,
          null,
          TipoComprobante
        );
      }
      if (importe_iva_total_2 > 0) {
        await asientoContable(
          "c2_movimientos",
          NroAsientoSecundario,
          cuentaSecundariaIVA,
          dhNetoEIva,
          importe_iva_total_2,
          observacion,
          transaction,
          comprobante,
          Fecha,
          null,
          TipoComprobante
        );
      }
      if (importe_iva_total_3 > 0) {
        await asientoContable(
          "c2_movimientos",
          NroAsientoSecundario,
          cuentaSecundariaIVA,
          dhNetoEIva,
          importe_iva_total_3,
          observacion,
          transaction,
          comprobante,
          Fecha,
          null,
          TipoComprobante
        );
      }
      /**asientos de percepcion*/
      if (ingreso_egreso === "E") {
        if (importe_tasa_IIBB) {
          await asientoContable(
            "c2_movimientos",
            NroAsientoSecundario,
            cuenta_secundaria_percepcion_IIBB,
            "D",
            importe_tasa_IIBB,
            observacion,
            transaction,
            comprobante,
            Fecha,
            null,
            TipoComprobante
          );
        }
        if (importe_tasa_IIBB_CABA) {
          await asientoContable(
            "c2_movimientos",
            NroAsientoSecundario,
            cuenta_secundaria_percepcion_IIBB_CABA,
            "D",
            importe_tasa_IIBB_CABA,
            observacion,
            transaction,
            comprobante,
            Fecha,
            null,
            TipoComprobante
          );
        }
        if (importe_tasa_IVA) {
          await asientoContable(
            "c2_movimientos",
            NroAsientoSecundario,
            cuenta_secundaria_percepcion_IVA,
            "D",
            importe_tasa_IVA,
            observacion,
            transaction,
            comprobante,
            Fecha,
            null,
            TipoComprobante
          );
        }
      }
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuenta_secundaria_forma_cobro,
        dhTotal,
        importe_total_asientos,
        observacion,
        transaction,
        comprobante,
        Fecha,
        null,
        TipoComprobante
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
  importe_total,
  observacion,
  id_forma_cobro,
  cta_cte_proveedores,
  usuario,
  id_cliente,
  cod_proveedor,
  tipo_comprobante,
  numero_comprobante_1,
  numero_comprobante_2,

  id_concepto,
  neto_no_gravado,
  neto_21,
  neto_10,
  neto_27,
  id_concepto_2,
  neto_no_gravado_2,
  neto_21_2,
  neto_10_2,
  neto_27_2,
  id_concepto_3,
  neto_no_gravado_3,
  neto_21_3,
  neto_10_3,
  neto_27_3,
  importe_iva_21,
  importe_iva_10,
  importe_iva_27,

  importe_neto_total_1,
  importe_neto_total_2,
  importe_neto_total_3,
  importe_iva_total_1,
  importe_iva_total_2,
  importe_iva_total_3,
  importe_otros_impuestos_total_1,
  importe_otros_impuestos_total_2,
  importe_otros_impuestos_total_3,

  tasa_IIBB_CABA,
  tasa_IIBB,
  tasa_IVA,
  importe_tasa_IIBB_CABA,
  importe_tasa_IIBB,
  importe_tasa_IVA,
}) {
  let transaction_costos_ingresos = await giama_renting.transaction();
  let transaction_asientos = await pa7_giama_renting.transaction();
  let ingreso_egreso;
  let genera_recibo;
  let genera_factura;
  let NroAsiento;
  let NroAsientoSecundario;
  let cuenta_forma_cobro;
  let cuenta_secundaria_forma_cobro;
  let cuenta_concepto;
  let cuenta_secundaria_concepto;
  let cuenta_concepto_2;
  let cuenta_secundaria_concepto_2;
  let cuenta_concepto_3;
  let cuenta_secundaria_concepto_3;

  let nro_recibo;
  let FA_FC;
  let comprobante;
  let nro_comprobante;
  let cuenta_percepcion_IIBB;
  let cuenta_secundaria_percepcion_IIBB;
  let cuenta_percepcion_IIBB_CABA;
  let cuenta_secundaria_percepcion_IIBB_CABA;
  let cuenta_percepcion_IVA;
  let cuenta_secundaria_percepcion_IVA;
  //obtengo si es ingreso o egreso
  try {
    const result = await giama_renting.query(
      `SELECT ingreso_egreso, cuenta_contable, cuenta_secundaria, genera_recibo, genera_factura 
      FROM conceptos_costos WHERE id = :id_concepto`,
      {
        type: QueryTypes.SELECT,
        replacements: { id_concepto },
      }
    );
    if (!result.length)
      throw new Error("No se encontró el concepto especificado");
    ingreso_egreso = result[0]["ingreso_egreso"];
    cuenta_concepto = result[0]["cuenta_contable"];
    cuenta_secundaria_concepto = result[0]["cuenta_secundaria"];
    genera_recibo = result[0]["genera_recibo"];
    genera_factura = result[0]["genera_factura"];
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

  //obtengo cuentas_concepto 2 y 3 si hay
  if (id_concepto_2) {
    try {
      const result = await giama_renting.query(
        `SELECT cuenta_contable, cuenta_secundaria
      FROM conceptos_costos WHERE id = :id_concepto_2`,
        {
          type: QueryTypes.SELECT,
          replacements: { id_concepto_2 },
        }
      );
      if (!result.length)
        throw new Error("No se encontró el concepto especificado");
      cuenta_concepto_2 = result[0]["cuenta_contable"];
      cuenta_secundaria_concepto_2 = result[0]["cuenta_secundaria"];
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
  }

  if (id_concepto_3) {
    try {
      const result = await giama_renting.query(
        `SELECT cuenta_contable, cuenta_secundaria
      FROM conceptos_costos WHERE id = :id_concepto_3`,
        {
          type: QueryTypes.SELECT,
          replacements: { id_concepto_3 },
        }
      );
      if (!result.length)
        throw new Error("No se encontró el concepto especificado");
      cuenta_concepto_3 = result[0]["cuenta_contable"];
      cuenta_secundaria_concepto_3 = result[0]["cuenta_secundaria"];
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
  }

  //obtengo cuentas percepcion IIBB, IIBB CABA e IVA si hay importe
  if (ingreso_egreso === "E") {
    try {
      const result = await giama_renting.query(
        `SELECT valor_str
        FROM parametros
        WHERE codigo IN ('PIBB', 'PIB2', 'PIBC', 'PIC2', 'PIVA', 'PIV2');`,
        {
          type: QueryTypes.SELECT,
        }
      );
      if (!result.length)
        throw new Error(
          "No se encontraron los codigos de parametros de percepcion"
        );
      cuenta_percepcion_IIBB = result[0]["valor_str"];
      cuenta_secundaria_percepcion_IIBB = result[1]["valor_str"];
      cuenta_percepcion_IIBB_CABA = result[2]["valor_str"];
      cuenta_secundaria_percepcion_IIBB_CABA = result[3]["valor_str"];
      cuenta_percepcion_IVA = result[4]["valor_str"];
      cuenta_secundaria_percepcion_IVA = result[5]["valor_str"];
    } catch (error) {
      throw new Error(
        `Error al buscar parametros de percepcion ${
          error.message ? `: ${error.message}` : ""
        }`
      );
    }
  }
  //obtengo cuentas contables de la forma de cobro/pago (si es egreso y cta cte proveedores, las cuentas son PROV Y PRO2)

  if (ingreso_egreso === "E" && cta_cte_proveedores === 1) {
    try {
      const result = await giama_renting.query(
        `SELECT codigo, valor_str FROM parametros WHERE codigo = "PROV" OR codigo = "PRO2"`,
        {
          type: QueryTypes.SELECT,
        }
      );
      if (!result.length)
        throw new Error("No se encontró la forma de cobro especificada");
      cuenta_forma_cobro = result[0]["valor_str"];
      cuenta_secundaria_forma_cobro = result[1]["valor_str"];
    } catch (error) {
      throw new Error(
        `Error al buscar cuentas contables de la forma de cobro ${
          error.message ? `: ${error.message}` : ""
        }`
      );
    }
  } else {
    try {
      const result = await giama_renting.query(
        "SELECT cuenta_contable, cuenta_secundaria FROM formas_cobro WHERE id = ?",
        {
          type: QueryTypes.SELECT,
          replacements: [id_forma_cobro],
        }
      );
      if (!result.length)
        throw new Error("No se encontró la forma de cobro especificada");
      cuenta_forma_cobro = result[0]["cuenta_contable"];
      cuenta_secundaria_forma_cobro = result[0]["cuenta_secundaria"];
    } catch (error) {
      throw new Error(
        `Error al buscar cuentas contables de la forma de cobro ${
          error.message ? `: ${error.message}` : ""
        }`
      );
    }
  }
  if (ingreso_egreso === "E") {
    FA_FC = tipo_comprobante == 1 ? "FA" : tipo_comprobante == 3 ? "FC" : null;
    comprobante = `${FA_FC}-${padWithZeros(
      numero_comprobante_1,
      5
    )}-${padWithZeros(numero_comprobante_2, 8)}`;
    nro_comprobante = `${padWithZeros(numero_comprobante_1, 5)}${padWithZeros(
      numero_comprobante_2,
      8
    )}`;
  } else {
    FA_FC = null;
    comprobante = null;
  }
  //obtengo numero asiento
  try {
    NroAsiento = await getNumeroAsiento();
    NroAsientoSecundario = await getNumeroAsientoSecundario();
  } catch (error) {
    throw error;
  }
  try {
    NroAsiento = await asientos_costos_ingresos(
      fecha,
      cuenta_concepto,
      cuenta_secundaria_concepto,
      cuenta_forma_cobro,
      cuenta_secundaria_forma_cobro,
      toNumber(importe_neto_total_1),
      toNumber(importe_neto_total_2),
      toNumber(importe_neto_total_3),
      toNumber(importe_iva_total_1),
      toNumber(importe_iva_total_2),
      toNumber(importe_iva_total_3),
      toNumber(importe_tasa_IIBB_CABA),
      toNumber(importe_tasa_IIBB),
      toNumber(importe_tasa_IVA),
      cuenta_concepto_2,
      cuenta_secundaria_concepto_2,
      cuenta_concepto_3,
      cuenta_secundaria_concepto_3,
      cuenta_percepcion_IIBB,
      cuenta_secundaria_percepcion_IIBB,
      cuenta_percepcion_IIBB_CABA,
      cuenta_secundaria_percepcion_IIBB_CABA,
      cuenta_percepcion_IVA,
      cuenta_secundaria_percepcion_IVA,
      observacion,
      nro_comprobante,
      ingreso_egreso,
      transaction_asientos,
      NroAsiento,
      NroAsientoSecundario,
      FA_FC
    );
  } catch (error) {
    await transaction_asientos.rollback();
    transaction_costos_ingresos.rollback();
    throw error;
  }
  //se puede llamar solo pero retorna nroasiento para poder impactarlo en costos_ingresos
  //(solo asiento primario)
  const factor = ingreso_egreso === "E" ? -1 : 1;

  if (ingreso_egreso === "I") {
    //recibo
    if (genera_recibo === 1) {
      try {
        //inserto recibo
        nro_recibo = await insertRecibo(
          getTodayDate(),
          observacion,
          importe_total,
          usuario,
          id_cliente,
          id_vehiculo,
          null,
          null,
          id_forma_cobro,
          transaction_costos_ingresos
        );
      } catch (error) {
        console.log(error);
        throw error;
      }
    }
    //factura
    if (genera_factura === 1) {
      try {
        await insertFactura(
          id_cliente,
          importeNetoFinal,
          importeIvaFinal,
          importeTotalFinal,
          usuario,
          NroAsiento,
          NroAsientoSecundario,
          observacion,
          transaction_costos_ingresos,
          transaction_asientos
        );
      } catch (error) {
        console.log(error);
        throw error;
      }
    }
  }
  if (ingreso_egreso === "E" && cta_cte_proveedores == 1) {
    await movimientosProveedoresEgresos({
      cod_proveedor,
      tipo_comprobante,
      numero_comprobante_1,
      numero_comprobante_2,
      importe_total,
      cuenta_concepto,
      cuenta_concepto_2,
      cuenta_concepto_3,
      NroAsiento,
      NroAsientoSecundario,
      usuario,
      transaction_asientos,
      neto_no_gravado: toNumber(neto_no_gravado),
      neto_21: toNumber(neto_21),
      neto_10: toNumber(neto_10),
      neto_27: toNumber(neto_27),
      neto_no_gravado_2: toNumber(neto_no_gravado_2),
      neto_21_2: toNumber(neto_21_2),
      neto_10_2: toNumber(neto_10_2),
      neto_27_2: toNumber(neto_27_2),
      neto_no_gravado_3: toNumber(neto_no_gravado_3),
      neto_21_3: toNumber(neto_21_3),
      neto_10_3: toNumber(neto_10_3),
      neto_27_3: toNumber(neto_27_3),
      importe_iva_21: toNumber(importe_iva_21),
      importe_iva_10: toNumber(importe_iva_10),
      importe_iva_27: toNumber(importe_iva_27),
      tasa_IIBB_CABA,
      tasa_IIBB,
      tasa_IVA,
      importe_tasa_IIBB_CABA: toNumber(importe_tasa_IIBB_CABA),
      importe_tasa_IIBB: toNumber(importe_tasa_IIBB),
      importe_tasa_IVA: toNumber(importe_tasa_IVA),
    });
  }
  const importeNetoFinal_1 = toNumber(importe_neto_total_1) * factor;
  const importeIvaFinal_1 = importe_iva_total_1
    ? toNumber(importe_iva_total_1) * factor
    : 0;
  const importeOtrosImpuestosFinal_1 = importe_otros_impuestos_total_1
    ? toNumber(importe_otros_impuestos_total_1) * factor
    : 0;
  const suma_importes_1 =
    importeNetoFinal_1 + importeIvaFinal_1 + importeOtrosImpuestosFinal_1;
  const importeTotalFinal_1 = suma_importes_1;

  const importeNetoFinal_2 = toNumber(importe_neto_total_2) * factor;
  const importeIvaFinal_2 = importe_iva_total_2
    ? toNumber(importe_iva_total_2) * factor
    : 0;
  const importeOtrosImpuestosFinal_2 = importe_otros_impuestos_total_2
    ? toNumber(importe_otros_impuestos_total_2) * factor
    : 0;
  const suma_importes_2 =
    importeNetoFinal_2 + importeIvaFinal_2 + importeOtrosImpuestosFinal_2;
  const importeTotalFinal_2 = suma_importes_2;

  const importeNetoFinal_3 = toNumber(importe_neto_total_3) * factor;
  const importeIvaFinal_3 = importe_iva_total_3
    ? toNumber(importe_iva_total_3) * factor
    : 0;
  const importeOtrosImpuestosFinal_3 = importe_otros_impuestos_total_3
    ? toNumber(importe_otros_impuestos_total_3) * factor
    : 0;
  const suma_importes_3 =
    importeNetoFinal_3 + importeIvaFinal_3 + importeOtrosImpuestosFinal_3;
  const importeTotalFinal_3 = suma_importes_3;
  try {
    await giama_renting.query(
      `INSERT INTO costos_ingresos 
      (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva, importe_otros_impuestos,
      importe_total, observacion, nro_asiento, id_forma_cobro, id_cliente, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          fecha,
          id_concepto,
          comprobante ? comprobante : null,
          importeNetoFinal_1,
          importeIvaFinal_1,
          importeOtrosImpuestosFinal_1,
          importeTotalFinal_1,
          observacion,
          NroAsiento,
          id_forma_cobro ? id_forma_cobro : null,
          id_cliente ? id_cliente : null,
          nro_recibo ? nro_recibo : null,
        ],
        transaction: transaction_costos_ingresos,
      }
    );
    if (id_concepto_2) {
      await giama_renting.query(
        `INSERT INTO costos_ingresos 
        (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva, importe_otros_impuestos,
        importe_total, observacion, nro_asiento, id_forma_cobro, id_cliente, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            id_vehiculo,
            fecha,
            id_concepto_2,
            comprobante ? comprobante : null,
            importeNetoFinal_2,
            importeIvaFinal_2,
            importeOtrosImpuestosFinal_2,
            importeTotalFinal_2,
            observacion,
            NroAsiento,
            id_forma_cobro ? id_forma_cobro : null,
            id_cliente ? id_cliente : null,
            nro_recibo ? nro_recibo : null,
          ],
          transaction: transaction_costos_ingresos,
        }
      );
    }
    if (id_concepto_3) {
      await giama_renting.query(
        `INSERT INTO costos_ingresos 
        (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva, importe_otros_impuestos,
        importe_total, observacion, nro_asiento, id_forma_cobro, id_cliente, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            id_vehiculo,
            fecha,
            id_concepto_3,
            comprobante ? comprobante : null,
            importeNetoFinal_3,
            importeIvaFinal_3,
            importeOtrosImpuestosFinal_3,
            importeTotalFinal_3,
            observacion,
            NroAsiento,
            id_forma_cobro ? id_forma_cobro : null,
            id_cliente ? id_cliente : null,
            nro_recibo ? nro_recibo : null,
          ],
          transaction: transaction_costos_ingresos,
        }
      );
    }
    await transaction_costos_ingresos.commit();
    await transaction_asientos.commit();
    return {
      nro_recibo: nro_recibo ? nro_recibo : null,
      genera_factura: genera_factura,
    };
  } catch (error) {
    await transaction_costos_ingresos.rollback();
    await transaction_asientos.rollback();
    throw new Error(error.message);
  }
}

export const postCostos_Ingresos = async (req, res) => {
  let message;
  try {
    let { nro_recibo, genera_factura } = await registrarCostoIngresoIndividual(
      req.body
    );
    if (nro_recibo && genera_factura == 0) {
      message = "Ingresado correctamente. Se generó el recibo.";
    } else if (!nro_recibo && genera_factura == 1) {
      message = "Ingresado correctamente. Se generó la factura.";
    } else if (nro_recibo && genera_factura == 1) {
      message = "Ingresado correctamente. Se generó la factura y el recibo.";
    } else if (!nro_recibo && genera_factura == 0) {
      message = "Ingresado correctamente";
    }
    return res.send({
      status: true,
      message: message,
      nro_recibo_ingreso: nro_recibo ? nro_recibo : null,
    });
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
    importe_neto,
    importe_iva,
    importe_total,
    importe_otros_impuestos,
    observacion,
    id_forma_cobro,
    cta_cte_proveedores,
    cod_proveedor,
    tipo_comprobante,
    numero_comprobante_1,
    numero_comprobante_2,
    usuario,
    neto_no_gravado,
    neto_21,
    neto_10,
    neto_27,
    importe_iva_21,
    importe_iva_10,
    importe_iva_27,
    tasa_IIBB_CABA,
    tasa_IIBB,
    tasa_IVA,
    importe_tasa_IIBB_CABA,
    importe_tasa_IIBB,
    importe_tasa_IVA,
  } = req.body;
  let NroAsiento;
  let NroAsientoSecundario;
  let cuentaIVA;
  let cuentaSecundariaIVA;
  let cuenta_concepto;
  let cuenta_secundaria_concepto;
  let cuenta_forma_cobro;
  let cuenta_secundaria_forma_cobro;
  let transaction_costos_ingresos = await giama_renting.transaction();
  let transaction_asientos = await pa7_giama_renting.transaction();
  let FA_FC =
    tipo_comprobante == 1 ? "FA" : tipo_comprobante == 3 ? "FC" : null;
  let numero_comprobante = `${padWithZeros(
    numero_comprobante_1,
    5
  )}${padWithZeros(numero_comprobante_2, 8)}`;
  let comprobante = `${FA_FC}-${padWithZeros(
    numero_comprobante_1,
    5
  )}-${padWithZeros(numero_comprobante_2, 8)}`;
  if (!arrayVehiculos?.length) {
    return res.send({
      status: false,
      message: "No hay vehículos seleccionados",
    });
  }
  //busco nro asiento/nro asiento secundario
  try {
    NroAsiento = await getNumeroAsiento();
    NroAsientoSecundario = await getNumeroAsientoSecundario();
  } catch (error) {
    return res.send({ status: false, message: error.message });
  }
  //obtengo cuentas contables
  try {
    const result = await giama_renting.query(
      `SELECT cuenta_contable, cuenta_secundaria FROM conceptos_costos WHERE id = :id_concepto`,
      {
        type: QueryTypes.SELECT,
        replacements: { id_concepto },
      }
    );
    if (!result.length)
      return res.send({
        status: false,
        message: "No se encontró el concepto especificado",
      });
    cuenta_concepto = result[0]["cuenta_contable"];
    cuenta_secundaria_concepto = result[0]["cuenta_secundaria"];
  } catch (error) {
    return res.send({
      status: false,
      message: "Hubo un problema al buscar las cuentas contables",
    });
  }
  //obtengo cuentas contables de la forma de cobro/pago para el TOTAL (si es cta cte proveedores, se usan esas en su lugar)
  if (cta_cte_proveedores == 1) {
    try {
      const result = await giama_renting.query(
        `SELECT codigo, valor_str FROM parametros WHERE codigo = "PROV" OR codigo = "PRO2"`,
        {
          type: QueryTypes.SELECT,
        }
      );
      if (!result.length)
        throw new Error("No se encontró la forma de cobro especificada");
      cuenta_forma_cobro = result[0]["valor_str"];
      cuenta_secundaria_forma_cobro = result[1]["valor_str"];
    } catch (error) {
      throw new Error(
        `Error al buscar cuentas contables de la forma de cobro ${
          error.message ? `: ${error.message}` : ""
        }`
      );
    }
  } else {
    try {
      const result = await giama_renting.query(
        "SELECT cuenta_contable, cuenta_secundaria FROM formas_cobro WHERE id = ?",
        {
          type: QueryTypes.SELECT,
          replacements: [id_forma_cobro],
        }
      );
      if (!result.length)
        return res.send({
          status: false,
          message: "No se encontró la forma de cobro especificada",
        });
      cuenta_forma_cobro = result[0]["cuenta_contable"];
      cuenta_secundaria_forma_cobro = result[0]["cuenta_secundaria"];
    } catch (error) {
      return res.send({
        status: false,
        message: `Error al buscar cuentas contables de la forma de cobro ${
          error.message ? `: ${error.message}` : ""
        }`,
      });
    }
  }
  //obtengo cuentas IVA
  try {
    cuentaIVA = await getParametro("IC21");
    cuentaSecundariaIVA = await getParametro("IC22");
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "Parámetro", acciones.get);
    return res.send(body);
  }
  const cantidad = arrayVehiculos.length;
  const netoDividido = Math.floor((importe_neto / cantidad) * 100) / 100;
  //insert movimientos fijos (TOTAL e IVA)
  try {
    asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaIVA,
      "D",
      importe_iva,
      observacion,
      transaction_asientos,
      numero_comprobante,
      getTodayDate(),
      NroAsientoSecundario,
      FA_FC
    );
    asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaSecundariaIVA,
      "D",
      importe_iva,
      observacion,
      transaction_asientos,
      numero_comprobante,
      getTodayDate(),
      null,
      FA_FC
    );
    asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_forma_cobro,
      "H",
      importe_total,
      observacion,
      transaction_asientos,
      numero_comprobante,
      getTodayDate(),
      NroAsientoSecundario,
      FA_FC
    );
    asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_forma_cobro,
      "H",
      importe_total,
      observacion,
      transaction_asientos,
      numero_comprobante,
      getTodayDate(),
      null,
      FA_FC
    );
  } catch (error) {
    return res.send({ status: false, message: error.message });
  }

  const diferencia = importe_neto - netoDividido * cantidad;
  const totalDividido = importe_total / cantidad;
  const ivaDividido = importe_iva / cantidad;
  const otrosImpuestosDividido = importe_otros_impuestos / cantidad;
  if (cta_cte_proveedores == 1) {
    try {
      await movimientosProveedoresEgresos({
        cod_proveedor,
        tipo_comprobante,
        numero_comprobante_1,
        numero_comprobante_2,
        importe_total,
        cuenta_concepto: cuenta_forma_cobro,
        NroAsiento,
        NroAsientoSecundario,
        usuario,
        transaction_asientos,
        neto_no_gravado,
        neto_21,
        neto_10,
        neto_27,
        importe_iva_21,
        importe_iva_10,
        importe_iva_27,
        tasa_IIBB_CABA,
        tasa_IIBB,
        tasa_IVA,
        importe_tasa_IIBB_CABA,
        importe_tasa_IIBB,
        importe_tasa_IVA,
      });
    } catch (error) {
      console.log(error);
      transaction_costos_ingresos.rollback();
      const { body } = handleError(
        error,
        "Movimientos proveedores",
        acciones.post
      );
      return res.send(body);
    }
  }
  for (const [index, id_vehiculo] of arrayVehiculos.entries()) {
    let importeAUsar = netoDividido;
    let importeTotalAusar = totalDividido;
    let dominio;
    if (index === cantidad - 1) {
      importeAUsar += diferencia;
      importeTotalAusar = importeAUsar + ivaDividido;
    }
    //obtengo dominio del vehiculo
    try {
      let result = await giama_renting.query(
        "SELECT dominio, dominio_provisorio FROM vehiculos WHERE id = ?",
        {
          type: QueryTypes.SELECT,
          replacements: [id_vehiculo],
        }
      );
      if (!result.length) dominio = "SIN DOMINIO";
      if (result[0]["dominio"]) dominio = result[0]["dominio"];
      if (result[0]["dominio_provisorio"] && !result[0]["dominio"])
        dominio = result[0]["dominio_provisorio"];
    } catch (error) {
      console.log(error);
      const { body } = handleError(error, "Dominios", acciones.get);
      return res.send(body);
    }
    //inserto asientos
    try {
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuenta_concepto,
        "D",
        importeAUsar,
        observacion + ` (${dominio})`,
        transaction_asientos,
        numero_comprobante,
        getTodayDate(),
        NroAsientoSecundario,
        FA_FC
      );
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuenta_secundaria_concepto,
        "D",
        importeAUsar,
        observacion + ` (${dominio})`,
        transaction_asientos,
        numero_comprobante,
        getTodayDate(),
        null,
        FA_FC
      );
    } catch (error) {
      transaction_costos_ingresos.rollback();
      console.log(error);
      const { body } = handleError(
        error,
        "registrar costo/ingreso",
        acciones.post
      );
      return res.send(body);
    }
    const factor = -1;

    //inserto en costos_ingresos
    try {
      await giama_renting.query(
        `INSERT INTO costos_ingresos 
      (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva, importe_otros_impuestos,
      importe_total, observacion, nro_asiento, id_forma_cobro, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            id_vehiculo,
            fecha,
            id_concepto,
            comprobante,
            importeAUsar * factor,
            ivaDividido * factor,
            otrosImpuestosDividido * factor,
            importeTotalAusar * factor,
            observacion + ` (${dominio})`,
            NroAsiento,
            id_forma_cobro ? id_forma_cobro : null,
            null,
          ],
          transaction: transaction_costos_ingresos,
        }
      );
    } catch (error) {
      transaction_asientos.rollback();
      console.log(error);
      const { body } = handleError(
        error,
        "registrar costo/ingreso",
        acciones.post
      );
      return res.send(body);
    }
  }

  await transaction_costos_ingresos.commit();
  await transaction_asientos.commit();
  //registro en costos_ingresos
  return res.send({
    status: true,
    message: "Se ingresaron los egresos correctamente",
  });
};
