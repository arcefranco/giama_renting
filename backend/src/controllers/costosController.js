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
import { insertPago } from "../../helpers/insertPago.js";

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

const asientos_ingresos = async (
  //FUNCION AUXILIAR
  debe_ingreso,
  fecha_deuda,
  fecha_pago,
  cuenta_concepto,
  cuenta_secundaria_concepto,
  cuenta_forma_cobro_1,
  cuenta_secundaria_forma_cobro_1,
  cuenta_forma_cobro_2,
  cuenta_secundaria_forma_cobro_2,
  cuenta_forma_cobro_3,
  cuenta_secundaria_forma_cobro_3,
  total_cobro_1,
  total_cobro_2,
  total_cobro_3,
  importe_neto_total_1,
  importe_neto_total_2,
  importe_neto_total_3,
  iva_total_deuda,
  cuenta_concepto_2,
  cuenta_secundaria_concepto_2,
  cuenta_concepto_3,
  cuenta_secundaria_concepto_3,
  observacion_asientos_deuda,
  observacion_asientos_pago,
  comprobante, /**nro recibo ??? */
  transaction,
  NroAsiento_deuda,
  NroAsientoSecundario_deuda,
  NroAsiento_pago,
  NroAsientoSecundario_pago
) => {
  let cuentaIVA;
  let cuentaSecundariaIVA;
  let total_cobro_1_formateado = total_cobro_1 ? parseFloat(total_cobro_1) : 0
  let total_cobro_2_formateado = total_cobro_2 ? parseFloat(total_cobro_2) : 0 
  let total_cobro_3_formateado = total_cobro_3 ? parseFloat(total_cobro_3) : 0

  const importe_total_cobro = (total_cobro_1_formateado + total_cobro_2_formateado + total_cobro_3_formateado).toFixed(2)

/*   let importe_total_asientos =
    importe_neto_total_1 +
    importe_neto_total_2 +
    importe_neto_total_3 +
    importe_iva_total_1 +
    importe_iva_total_2 +
    importe_iva_total_3;
 */
  try {
    cuentaIVA = await getParametro("IV21");
    if (cuenta_secundaria_concepto) {
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
    //DEUDA
    await asientoContable(
      "c_movimientos",
      NroAsiento_deuda,
      110308,//cuenta_nueva,
      "D",
      debe_ingreso,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      NroAsientoSecundario_deuda,
      null
    )
    await asientoContable(
      "c_movimientos",
      NroAsiento_deuda,
      cuenta_concepto,
      "H",
      importe_neto_total_1,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      NroAsientoSecundario_deuda,
      null
    )
    if(cuenta_concepto_2){
    await asientoContable(
      "c_movimientos",
      NroAsiento_deuda,
      cuenta_concepto_2,
      "H",
      importe_neto_total_2,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      NroAsientoSecundario_deuda,
      null
    )
    }
    if(cuenta_concepto_3){
    await asientoContable(
      "c_movimientos",
      NroAsiento_deuda,
      cuenta_concepto_3,
      "H",
      importe_neto_total_3,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      NroAsientoSecundario_deuda,
      null
    )
    }
    await asientoContable(
      "c_movimientos",
      NroAsiento_deuda,
      cuentaIVA,
      "H",
      iva_total_deuda,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      NroAsientoSecundario_deuda,
      null
    )
    //DEUDA (secundarios)
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario_deuda,
      110308,//"cuenta_nueva_secundaria",
      "D",
      debe_ingreso,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      null,
      null
    )
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario_deuda,
      cuenta_secundaria_concepto,
      "H",
      importe_neto_total_1,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      null,
      null
    )
    if(cuenta_concepto_2){
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario_deuda,
      cuenta_secundaria_concepto_2,
      "H",
      importe_neto_total_2,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      null,
      null
    )
    }
    if(cuenta_concepto_3){
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario_deuda,
      cuenta_secundaria_concepto_3,
      "H",
      importe_neto_total_3,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      null,
      null
    )
    }
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario_deuda,
      cuentaSecundariaIVA,
      "H",
      iva_total_deuda,
      observacion_asientos_deuda,
      transaction,
      comprobante,
      fecha_deuda,
      null,
      null
    )


    //PAGO
    if(total_cobro_1 > 0 && cuenta_forma_cobro_1){
      await asientoContable(
      "c_movimientos",
      NroAsiento_pago,
      cuenta_forma_cobro_1,
      "D",
      total_cobro_1,
      observacion_asientos_pago,
      transaction,
      comprobante,
      fecha_pago,
      NroAsientoSecundario_pago
      )
    }
    if(total_cobro_2 > 0 && cuenta_forma_cobro_2){
      await asientoContable(
      "c_movimientos",
      NroAsiento_pago,
      cuenta_forma_cobro_2,
      "D",
      total_cobro_2,
      observacion_asientos_pago,
      transaction,
      comprobante,
      fecha_pago,
      NroAsientoSecundario_pago
      )
    }
    if(total_cobro_3 > 0 && cuenta_forma_cobro_3){
      await asientoContable(
      "c_movimientos",
      NroAsiento_pago,
      cuenta_forma_cobro_3,
      "D",
      total_cobro_3,
      observacion_asientos_pago,
      transaction,
      comprobante,
      fecha_pago,
      NroAsientoSecundario_pago
      )
    }
    if(importe_total_cobro > 0){
    await asientoContable(
      "c_movimientos",
      NroAsiento_pago,
      110308,//"cuenta_nueva",
      "H",
      importe_total_cobro,
      observacion_asientos_pago,
      transaction,
      comprobante,
      fecha_pago,
      NroAsientoSecundario_pago
      )
    }

    //PAGO (secundarios)
    if(total_cobro_1 > 0 && cuenta_forma_cobro_1){
      await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario_pago,
      cuenta_secundaria_forma_cobro_1,
      "D",
      total_cobro_1,
      observacion_asientos_pago,
      transaction,
      comprobante,
      fecha_pago,
      null
      )
    }
    if(total_cobro_2 > 0 && cuenta_forma_cobro_2){
      await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario_pago,
      cuenta_secundaria_forma_cobro_2,
      "D",
      total_cobro_2,
      observacion_asientos_pago,
      transaction,
      comprobante,
      fecha_pago,
      null
      )
    }
    if(total_cobro_3 > 0 && cuenta_forma_cobro_3){
      await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario_pago,
      cuenta_secundaria_forma_cobro_3,
      "D",
      total_cobro_3,
      observacion_asientos_pago,
      transaction,
      comprobante,
      fecha_pago,
      null
      )
    }
    if(importe_total_cobro > 0){
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario_pago,
      110308,//"cuenta_nueva_secundaria",
      "H",
      importe_total_cobro,
      observacion_asientos_pago,
      transaction,
      comprobante,
      fecha_pago,
      null
      )
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
  return;
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


  tasa_IIBB_CABA,
  tasa_IIBB,
  tasa_IVA,
  importe_tasa_IIBB_CABA,
  importe_tasa_IIBB,
  importe_tasa_IVA,
  transaction_costos_ingresos,
  transaction_asientos
}) {
  let ingreso_egreso;
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
  let total_conceptos = 0;

  let nombre_proveedor;
  let dominio;
  let observacion_asientos;
  if(id_concepto) total_conceptos = total_conceptos + 1
  if(id_concepto_2) total_conceptos = total_conceptos + 1
  if(id_concepto_3) total_conceptos = total_conceptos + 1
  //obtengo si es ingreso o egreso
  try {
    const result = await giama_renting.query(
      `SELECT ingreso_egreso, cuenta_contable, cuenta_secundaria
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
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al buscar una cuenta contable ${
        error.message ? `${" :"}${error.message}` : ""
      }`
    );
  }
  //busco el dominio del vehiculo para observacion asientos
  try {
    const result = await giama_renting.query(
      "SELECT  dominio, dominio_provisorio FROM vehiculos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_vehiculo],
      }
    );

    if (result[0]["dominio"]) dominio = result[0]["dominio"];
    else if (result[0]["dominio_provisorio"] && !result[0]["dominio"])
      dominio = result[0]["dominio_provisorio"];
    else dominio = "SIN DOMINIO";
  } catch (error) {
    throw new Error(
      `Error al buscar un dominio ${
        error.message ? `${" :"}${error.message}` : ""
      }`
    );
  }
  //si hay proveedor, busco el nombre para la observacion asientos
   try {
    const result = await pa7_giama_renting.query(
      "SELECT RazonSocial FROM c_proveedores WHERE Codigo = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [cod_proveedor],
      }
    );

    if (result[0]["RazonSocial"]) nombre_proveedor = result[0]["RazonSocial"];
    else nombre_proveedor = "SIN NOMBRE PROVEEDOR";
  } catch (error) {
    throw new Error(
      `Error al buscar razon social del proveedor:  ${
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
/*       await transaction_asientos.rollback();
      await transaction_costos_ingresos.rollback(); */
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
      throw new Error(
        `Error al buscar una cuenta contable ${
          error.message ? `${" :"}${error.message}` : ""
        }`
      );
    }
  }

  //obtengo cuentas percepcion IIBB, IIBB CABA e IVA si hay importe

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

  //obtengo cuentas contables de la forma de cobro/pago (si es egreso y cta cte proveedores, las cuentas son PROV Y PRO2)

  if (cta_cte_proveedores === 1) {
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
    
    observacion_asientos = `${observacion} DOMINIO: ${dominio} PROVEEDOR: ${nombre_proveedor} FACTURA: ${comprobante}`
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
      observacion_asientos,
      nro_comprobante,
      ingreso_egreso,
      transaction_asientos,
      NroAsiento,
      NroAsientoSecundario,
      FA_FC
    );
  } catch (error) {
    throw error;
  }
  const factor =  -1;

  if (ingreso_egreso === "E" && cta_cte_proveedores == 1) {
    await movimientosProveedoresEgresos({
      fecha,
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

  const importe_otros_impuestos_dividido = ((toNumber(importe_tasa_IIBB) + toNumber(importe_tasa_IIBB_CABA) + toNumber(importe_tasa_IVA)) / total_conceptos) * factor
  console.log("OTROS IMPUESTOS: ", importe_otros_impuestos_dividido)
  const importeNetoFinal_1 = toNumber(importe_neto_total_1) * factor;
  const importeIvaFinal_1 = importe_iva_total_1
    ? toNumber(importe_iva_total_1) * factor
    : 0;
  const suma_importes_1 =
    importeNetoFinal_1 + importeIvaFinal_1 + importe_otros_impuestos_dividido;
  console.log("SUMA: ", importeNetoFinal_1, importeIvaFinal_1, importe_otros_impuestos_dividido)
  console.log("RESULTADO: ", suma_importes_1)
  const importeTotalFinal_1 = suma_importes_1;


  const importeNetoFinal_2 = toNumber(importe_neto_total_2) * factor;
  const importeIvaFinal_2 = importe_iva_total_2
    ? toNumber(importe_iva_total_2) * factor
    : 0;
  const suma_importes_2 =
    importeNetoFinal_2 + importeIvaFinal_2 + importe_otros_impuestos_dividido;
  const importeTotalFinal_2 = suma_importes_2;

  const importeNetoFinal_3 = toNumber(importe_neto_total_3) * factor;
  const importeIvaFinal_3 = importe_iva_total_3
    ? toNumber(importe_iva_total_3) * factor
    : 0;
  const suma_importes_3 =
    importeNetoFinal_3 + importeIvaFinal_3 + importe_otros_impuestos_dividido;
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
          importe_otros_impuestos_dividido,
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
            importe_otros_impuestos_dividido,
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
            importe_otros_impuestos_dividido,
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
    return {
      nro_recibo: null,
      genera_factura: 0,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}



async function registrarIngresoIndividual({
  debe_ingreso,
  id_vehiculo,
  fecha_deuda,
  fecha_pago,
  id_forma_cobro_1,
  id_forma_cobro_2,
  id_forma_cobro_3,
  total_cobro_1,
  total_cobro_2,
  total_cobro_3,
  id_cliente,
  observacion,
  usuario,
  id_concepto,
  importe_neto, //(21)
  importe_iva,
  importe_total,
  id_concepto_2,
  importe_neto_2, //(22)
  importe_iva_2,
  importe_total_2,
  id_concepto_3,
  importe_neto_3, //(23)
  importe_iva_3,
  importe_total_3,
  transaction_costos_ingresos,
  transaction_asientos
}) {
  let genera_recibo;
  let genera_factura;
  let genera_recibo_2;
  let genera_factura_2;
  let genera_recibo_3;
  let genera_factura_3;
  let NroAsiento_pago;
  let NroAsientoSecundario_pago;
  let NroAsiento_deuda;
  let NroAsientoSecundario_deuda;
  let CUIT;
  let cuenta_forma_cobro_1;
  let cuenta_secundaria_forma_cobro_1;
  let cuenta_forma_cobro_2;
  let cuenta_secundaria_forma_cobro_2;
  let cuenta_forma_cobro_3;
  let cuenta_secundaria_forma_cobro_3;
  let cuenta_concepto;
  let cuenta_secundaria_concepto;
  let cuenta_concepto_2;
  let cuenta_secundaria_concepto_2;
  let cuenta_concepto_3;
  let cuenta_secundaria_concepto_3;
  let nro_recibo;
  let nro_factura;
  let genera_recibo_final;
  let genera_factura_final;
  let conceptos_recibo = [];
  let dominio;
  let nombre_completo_cliente;
  let observacion_asientos_deuda;
  let observacion_asientos_pago;
  let importe_iva_formateado = importe_iva ? parseFloat(importe_iva) : 0
  let importe_iva_2_formateado = importe_iva_2 ? parseFloat(importe_iva_2) : 0 
  let importe_iva_3_formateado = importe_iva_3 ? parseFloat(importe_iva_3) : 0
  const iva_total_deuda = (importe_iva_formateado + importe_iva_2_formateado + importe_iva_3_formateado).toFixed(2)
  //buscar CUIT del cliente
    try {
    const result = await giama_renting.query(
      "SELECT nro_documento, nombre, apellido, razon_social FROM clientes WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_cliente],
      }
    );
    if (result[0]["nro_documento"]){
      CUIT = result[0]["nro_documento"]
    } 
    if(result[0]["nombre"] && result[0]["apellido"]){
      nombre_completo_cliente = `${result[0]["nombre"]} ${result[0]["apellido"]}`
    }else if(result[0]["razon_social"]){
      nombre_completo_cliente = `${result[0]["razon_social"]}`
    }else{
      nombre_completo_cliente = "SIN NOMBRE"
    }
    } catch (error) {
    const { body } = handleError(
      error,
      "documento del cliente",
      acciones.get
    );
    return res.send(body);
  }
  //busco el dominio del vehiculo para observacion asientos
  try {
    const result = await giama_renting.query(
      "SELECT  dominio, dominio_provisorio FROM vehiculos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_vehiculo],
      }
    );

    if (result[0]["dominio"]) dominio = result[0]["dominio"];
    else if (result[0]["dominio_provisorio"] && !result[0]["dominio"])
      dominio = result[0]["dominio_provisorio"];
    else dominio = "SIN DOMINIO";
  } catch (error) {
    const { body } = handleError(
      error,
      "dominio del vehiculo",
      acciones.get
    );
    return res.send(body);
  }

  try {
    const result = await giama_renting.query(
      `SELECT nombre, cuenta_contable, cuenta_secundaria, genera_recibo, genera_factura 
      FROM conceptos_costos WHERE id = :id_concepto`,
      {
        type: QueryTypes.SELECT,
        replacements: { id_concepto },
      }
    );
    if (!result.length)
      throw new Error("No se encontró el concepto especificado");
    cuenta_concepto = result[0]["cuenta_contable"];
    cuenta_secundaria_concepto = result[0]["cuenta_secundaria"];
    genera_recibo = result[0]["genera_recibo"];
    genera_factura = result[0]["genera_factura"];
    if (result[0]["genera_recibo"] === 1) {
    conceptos_recibo.push(result[0]["nombre"]);
    }
  } catch (error) {
    console.log(error);
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
        `SELECT nombre, cuenta_contable, cuenta_secundaria, genera_recibo, genera_factura
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
      genera_recibo_2 = result[0]["genera_recibo"];
      genera_factura_2 = result[0]["genera_factura"];
      if (result[0]["genera_recibo"] === 1) {
      conceptos_recibo.push(result[0]["nombre"]);
    }
    } catch (error) {
      console.log(error);
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
        `SELECT nombre, cuenta_contable, cuenta_secundaria, genera_recibo, genera_factura
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
      genera_recibo_3 = result[0]["genera_recibo"];
      genera_factura_3 = result[0]["genera_factura"];
      if (result[0]["genera_recibo"] === 1) {
      conceptos_recibo.push(result[0]["nombre"]);
    }
    } catch (error) {
      console.log(error);
      throw new Error(
        `Error al buscar una cuenta contable ${
          error.message ? `${" :"}${error.message}` : ""
        }`
      );
    }
  }
  if (genera_recibo === 1 || genera_recibo_2 === 1 || genera_recibo_3 === 1) {
    genera_recibo_final = true;
  } else {
    genera_recibo_final = false;
  }
  //para el string que se devuelve al usuario, chequeamos tambien si se generó factura o no
  if (genera_factura === 1 || genera_factura_2 === 1 || genera_factura_3 === 1) {
    genera_factura_final = true;
  } else {
    genera_factura_final = false;
  }
    //obtengo numeros de asiento
  try {
    NroAsiento_pago = await getNumeroAsiento();
    NroAsientoSecundario_pago = await getNumeroAsiento();
    NroAsiento_deuda = await getNumeroAsiento();
    NroAsientoSecundario_deuda = await getNumeroAsientoSecundario();
  } catch (error) {
    throw error;
  }

  //suma de importes_totales que generan recibo
  const importe_total_recibo = 
  (genera_recibo   ? toNumber(total_cobro_1)   : 0) +
  (genera_recibo_2 ? toNumber(total_cobro_2) : 0) +
  (genera_recibo_3 ? toNumber(total_cobro_3) : 0);

  //suma de importes para facturas
  const importe_neto_factura = 
  (genera_factura   ? toNumber(importe_neto)   : 0) +
  (genera_factura_2 ? toNumber(importe_neto_2) : 0) +
  (genera_factura_3 ? toNumber(importe_neto_3) : 0);
  const importe_iva_factura = 
  (genera_factura   ? toNumber(importe_iva)   : 0) +
  (genera_factura_2 ? toNumber(importe_iva_2) : 0) +
  (genera_factura_3 ? toNumber(importe_iva_3) : 0);
  const importe_total_factura = 
  (genera_factura   ? toNumber(importe_total)   : 0) +
  (genera_factura_2 ? toNumber(importe_total_2) : 0) +
  (genera_factura_3 ? toNumber(importe_total_3) : 0);

  if((parseFloat(importe_neto_factura) + parseFloat(importe_iva_factura)).toFixed(2) != parseFloat(importe_total_factura)){
    return res.send({status: false, message: "La suma de los importes no coincide"})
  }

  //obtengo cuentas de forma_cobro
  if(id_forma_cobro_1){
  try {
    const result = await giama_renting.query(
      "SELECT cuenta_contable, cuenta_secundaria FROM formas_cobro WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_forma_cobro_1],
      }
    );
    if (!result.length)
      throw new Error("No se encontró la forma de cobro especificada");
    cuenta_forma_cobro_1 = result[0]["cuenta_contable"];
    cuenta_secundaria_forma_cobro_1 = result[0]["cuenta_secundaria"];
  } catch (error) {
    throw new Error(
      `Error al buscar cuentas contables de la forma de cobro ${
        error.message ? `: ${error.message}` : ""
      }`
    );
  }
  }
  if (id_forma_cobro_2){
  try {
    const result = await giama_renting.query(
      "SELECT cuenta_contable, cuenta_secundaria FROM formas_cobro WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_forma_cobro_2],
      }
    );
    if (!result.length)
      throw new Error("No se encontró la forma de cobro especificada");
    cuenta_forma_cobro_2 = result[0]["cuenta_contable"];
    cuenta_secundaria_forma_cobro_2 = result[0]["cuenta_secundaria"];
  } catch (error) {
    throw new Error(
      `Error al buscar cuentas contables de la forma de cobro ${
        error.message ? `: ${error.message}` : ""
      }`
    );
  }
  }
  if (id_forma_cobro_3){
  try {
    const result = await giama_renting.query(
      "SELECT cuenta_contable, cuenta_secundaria FROM formas_cobro WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_forma_cobro_3],
      }
    );
    if (!result.length)
      throw new Error("No se encontró la forma de cobro especificada");
    cuenta_forma_cobro_3 = result[0]["cuenta_contable"];
    cuenta_secundaria_forma_cobro_3 = result[0]["cuenta_secundaria"];
  } catch (error) {
    throw new Error(
      `Error al buscar cuentas contables de la forma de cobro ${
        error.message ? `: ${error.message}` : ""
      }`
    );
  }
  }
  //armo el detalle del recibo segun nombres de concepto que generen recibo.
  const detalle_recibo = conceptos_recibo.join(" + ").concat(` CUIT/CUIL: ${CUIT} - ASIENTO: ${NroAsiento_pago}`);
  const detalle_factura = conceptos_recibo.join(" + ").concat(` CUIT/CUIL: ${CUIT} - ASIENTO: ${NroAsiento_deuda}`);
 
  //factura
  if (genera_factura_final) {
      try {
        nro_factura = await insertFactura(
          id_cliente,
          importe_neto_factura,
          importe_iva_factura,
          importe_total_factura,
          usuario,
          NroAsiento_deuda,
          NroAsientoSecundario_deuda,
          detalle_factura,
          transaction_costos_ingresos,
          transaction_asientos,
          fecha_deuda
        );
      } catch (error) {
        await transaction_asientos.rollback();
        await transaction_costos_ingresos.rollback();
        console.log(error);
        throw error;
      }
    }
    //recibo
    if (genera_recibo_final && importe_total_recibo > 0) {
      try {
        //inserto recibo
        nro_recibo = await insertRecibo(
          fecha_pago,
          detalle_recibo,
          importe_total_recibo,
          usuario,
          id_cliente,
          id_vehiculo,
          null,
          null,
          id_forma_cobro_1,
          id_forma_cobro_2,
          id_forma_cobro_3,
          nro_factura,
          transaction_costos_ingresos,
          total_cobro_2,
          total_cobro_3,
          total_cobro_1
        );
      } catch (error) {
        console.log(error);
        throw error;
      }
    }
    observacion_asientos_deuda = `${observacion} (${dominio}) Nombre: ${nombre_completo_cliente} CUIT/CUIL: ${CUIT} FACTURA: ${nro_factura}`
    observacion_asientos_pago = `${observacion} (${dominio}) Nombre: ${nombre_completo_cliente} CUIT/CUIL: ${CUIT} RECIBO: ${nro_recibo}`
      //realizo el asiento 
  try {
    await asientos_ingresos(
      debe_ingreso,
      fecha_deuda,
      fecha_pago,
      cuenta_concepto,
      cuenta_secundaria_concepto,
      cuenta_forma_cobro_1,
      cuenta_secundaria_forma_cobro_1,
      cuenta_forma_cobro_2,
      cuenta_secundaria_forma_cobro_2,
      cuenta_forma_cobro_3,
      cuenta_secundaria_forma_cobro_3,
      toNumber(total_cobro_1),
      toNumber(total_cobro_2),
      toNumber(total_cobro_3),
      toNumber(importe_neto),
      toNumber(importe_neto_2),
      toNumber(importe_neto_3),
      iva_total_deuda,
      cuenta_concepto_2,
      cuenta_secundaria_concepto_2,
      cuenta_concepto_3,
      cuenta_secundaria_concepto_3,
      observacion_asientos_deuda,
      observacion_asientos_pago,
      nro_recibo ? nro_recibo : null,
      transaction_asientos,
      NroAsiento_deuda,
      NroAsientoSecundario_deuda,
      NroAsiento_pago,
      NroAsientoSecundario_pago,

    );
  } catch (error) {
    throw error;
  }
  //realizo los pagos (si hay)
  try {
    if(id_forma_cobro_1){
      await insertPago(id_cliente, fecha_pago, usuario, id_forma_cobro_1, total_cobro_1, 
        nro_recibo, observacion, NroAsiento_pago, transaction_costos_ingresos
      )
    }
    if(id_forma_cobro_2){
      await insertPago(id_cliente, fecha_pago, usuario, id_forma_cobro_2, total_cobro_2, 
        nro_recibo, observacion, NroAsiento_pago, transaction_costos_ingresos
      )
    }
    if(id_forma_cobro_3){
      await insertPago(id_cliente, fecha_pago, usuario, id_forma_cobro_3, total_cobro_3, 
        nro_recibo, observacion, NroAsiento_pago, transaction_costos_ingresos
      )
    }
  } catch (error) {
    throw error
  }
  //inserto en tabla costos_ingresos
    try {
    await giama_renting.query(
      `INSERT INTO costos_ingresos 
      (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva, importe_otros_impuestos,
      importe_total, observacion, nro_asiento, id_forma_cobro, id_cliente, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          fecha_deuda,
          id_concepto,
          null,
          importe_neto,
          importe_iva,
          null,
          importe_total,
          observacion,
          NroAsiento_deuda,
          null,
          id_cliente ? id_cliente : null,
          null,
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
            fecha_deuda,
            id_concepto_2,
            null,
            importe_neto_2,
            importe_iva_2,
            null,
            importe_total_2,
            observacion,
            NroAsiento_deuda,
            null,
            id_cliente ? id_cliente : null,
            null,
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
            fecha_deuda,
            id_concepto_3,
            null,
            importe_neto_3,
            importe_iva_3,
            null,
            importe_total_3,
            observacion,
            NroAsiento_deuda,
            null,
            id_cliente ? id_cliente : null,
            null,
          ],
          transaction: transaction_costos_ingresos,
        }
      );
    }
  }catch(error){
    throw new Error(error.message);
  }
    return {
      nro_recibo: nro_recibo ? nro_recibo : null,
      genera_factura: genera_factura_final,
    };

  
}


export const postCostos_Ingresos = async (req, res) => {
  let message;
  const { ingreso_egreso } = req.body;
  const transaction_costos_ingresos = await giama_renting.transaction();
  const transaction_asientos = await pa7_giama_renting.transaction();
  let nro_recibo_ingreso; 
  let genera_factura_ingreso;
  try {
    if (ingreso_egreso === "E") {
      await registrarCostoIngresoIndividual({...req.body, 
        transaction_costos_ingresos: transaction_costos_ingresos, transaction_asientos: transaction_asientos});
    } else if (ingreso_egreso === "I") {
      let { nro_recibo, genera_factura } = await registrarIngresoIndividual({...req.body, 
        transaction_costos_ingresos: transaction_costos_ingresos, transaction_asientos: transaction_asientos});
      nro_recibo_ingreso = nro_recibo;
      genera_factura_ingreso = genera_factura;
    }

    if(ingreso_egreso === "I"){
      if (nro_recibo_ingreso && genera_factura_ingreso == 0) {
        message = "Ingresado correctamente. Se generó el recibo.";
      } else if (!nro_recibo_ingreso && genera_factura_ingreso == 1) {
        message = "Ingresado correctamente. Se generó la factura.";
      } else if (nro_recibo_ingreso && genera_factura_ingreso == 1) {
        message = "Ingresado correctamente. Se generó la factura y el recibo.";
      } else if (!nro_recibo_ingreso && genera_factura_ingreso == 0) {
        message = "Ingresado correctamente";
      }
    }else if(ingreso_egreso === "E"){
      message = "Ingresado correctamente"
    }
    await transaction_costos_ingresos.commit()
    await transaction_asientos.commit()
    return res.send({
      status: true,
      message: message,
      nro_recibo_ingreso: nro_recibo_ingreso ? nro_recibo_ingreso : null,
    });
  } catch (error) {
    console.log(error);
    transaction_asientos.rollback()
    transaction_costos_ingresos.rollback()
    const { body } = handleError(
      error,
      "Costo/ingreso del vehículo",
      acciones.post
    );
    return res.send(body);
  }
};



export const prorrateo = async (req, res) => {

  const {
    arrayVehiculos,
    fecha,
    id_forma_cobro,
    /**PARA MOSTRAR EN FORM (NETOS PARA CALCULAR TAMBIEN TOTAL C/NETO A MOVPROV)*/
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
    tasa_IIBB_CABA,
    tasa_IIBB,
    tasa_IVA,
    importe_tasa_IIBB_CABA,
    importe_tasa_IIBB,
    importe_tasa_IVA,
    /**PARA MOSTRAR EN FORM */
    importe_total,
    importe_neto,
    importe_iva,
    importe_otros_impuestos,
    /**MOVIMIENTOS CONTABLES Y COSTOS_INGRESOS */
    importe_neto_total_1,
    importe_neto_total_2,
    importe_neto_total_3,
    importe_iva_total_1,
    importe_iva_total_2,
    importe_iva_total_3,

    /**MOVIMIENTOS CONTABLES Y COSTOS_INGRESOS */
    observacion,
    cuenta,
    ingreso_egreso,
    cta_cte_proveedores,
    cuenta_secundaria,
    tipo_comprobante,
    numero_comprobante_1,
    numero_comprobante_2,
    cod_proveedor,
    usuario,
  } = req.body
  let NroAsiento;
  let NroAsientoSecundario;
  let cuentaIVA;
  let cuentaSecundariaIVA;
  let cuenta_concepto;
  let cuenta_secundaria_concepto;
  let cuenta_concepto_2;
  let cuenta_secundaria_concepto_2;
  let cuenta_concepto_3;
  let cuenta_secundaria_concepto_3;
  let cuenta_forma_cobro;
  let cuenta_secundaria_forma_cobro;
  let transaction_costos_ingresos = await giama_renting.transaction();
  let transaction_asientos = await pa7_giama_renting.transaction();
  let cuenta_percepcion_IIBB;
  let cuenta_secundaria_percepcion_IIBB;
  let cuenta_percepcion_IIBB_CABA;
  let cuenta_secundaria_percepcion_IIBB_CABA;
  let cuenta_percepcion_IVA;
  let cuenta_secundaria_percepcion_IVA;


  let importe_neto_1_formateado = importe_neto_total_1 ? parseFloat(importe_neto_total_1) : 0;
  let importe_neto_2_formateado = importe_neto_total_2 ? parseFloat(importe_neto_total_2) : 0;
  let importe_neto_3_formateado = importe_neto_total_3 ? parseFloat(importe_neto_total_3) : 0;
  let importe_iva_1_formateado =  importe_iva_total_1 ? parseFloat(importe_iva_total_1) : 0;
  let importe_iva_2_formateado =  importe_iva_total_2 ? parseFloat(importe_iva_total_2) : 0;
  let importe_iva_3_formateado =  importe_iva_total_3 ? parseFloat(importe_iva_total_3) : 0;

  let importe_total_1 = importe_neto_1_formateado + importe_iva_1_formateado;
  let importe_total_2 = importe_neto_2_formateado + importe_iva_2_formateado;
  let importe_total_3 = importe_neto_3_formateado + importe_iva_3_formateado;

  let total_conceptos = 0;
  
  if(id_concepto) total_conceptos ++
  if(id_concepto_2) total_conceptos ++
  if(id_concepto_3) total_conceptos ++
  
  if(total_conceptos === 0){
    return res.send({status: false, message: "Debe seleccionar al menos un concepto"})
  }

  if(importe_total <= 0 || !importe_total){
    transaction_asientos.rollback();
    transaction_costos_ingresos.rollback();
    return res.send({status: false, message: "No se puede ingresar con importes vacíos"})
    
  }

  let FA_FC =  tipo_comprobante == 1 ? "FA" : tipo_comprobante == 3 ? "FC" : null;



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
  //obtengo cuentas contables de los tres conceptos
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
  if(id_concepto_2){
    try {
      const result = await giama_renting.query(
        `SELECT cuenta_contable, cuenta_secundaria FROM conceptos_costos WHERE id = :id_concepto_2`,
        {
          type: QueryTypes.SELECT,
          replacements: { id_concepto_2 },
        }
      );
      if (!result.length)
        return res.send({
          status: false,
          message: "No se encontró el concepto especificado",
        });
      cuenta_concepto_2 = result[0]["cuenta_contable"];
      cuenta_secundaria_concepto_2 = result[0]["cuenta_secundaria"];
    } catch (error) {
      return res.send({
        status: false,
        message: "Hubo un problema al buscar las cuentas contables",
      });
    }
  }
  if(id_concepto_3){
    try {
      const result = await giama_renting.query(
        `SELECT cuenta_contable, cuenta_secundaria FROM conceptos_costos WHERE id = :id_concepto_3`,
        {
          type: QueryTypes.SELECT,
          replacements: { id_concepto_3 },
        }
      );
      if (!result.length)
        return res.send({
          status: false,
          message: "No se encontró el concepto especificado",
        });
      cuenta_concepto_3 = result[0]["cuenta_contable"];
      cuenta_secundaria_concepto_3 = result[0]["cuenta_secundaria"];
    } catch (error) {
      return res.send({
        status: false,
        message: "Hubo un problema al buscar las cuentas contables",
      });
    }
  }
    //obtengo cuentas percepcion IIBB, IIBB CABA e IVA si hay importe

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
    if(importe_tasa_IIBB_CABA){
    asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_percepcion_IIBB_CABA,
      "D",
      importe_tasa_IIBB_CABA,
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
      cuenta_secundaria_percepcion_IIBB_CABA,
      "D",
      importe_tasa_IIBB_CABA,
      observacion,
      transaction_asientos,
      numero_comprobante,
      getTodayDate(),
      null,
      FA_FC
    );
    }
    if(importe_tasa_IIBB){
    asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_percepcion_IIBB,
      "D",
      importe_tasa_IIBB,
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
      cuenta_secundaria_percepcion_IIBB,
      "D",
      importe_tasa_IIBB,
      observacion,
      transaction_asientos,
      numero_comprobante,
      getTodayDate(),
      null,
      FA_FC
    );
    }
    if(importe_tasa_IVA){
    asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_percepcion_IVA,
      "D",
      importe_tasa_IVA,
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
      cuenta_secundaria_percepcion_IVA,
      "D",
      importe_tasa_IVA,
      observacion,
      transaction_asientos,
      numero_comprobante,
      getTodayDate(),
      null,
      FA_FC
    );
    }
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
  if (cta_cte_proveedores == 1) {
    try {
      await movimientosProveedoresEgresos({
        fecha,
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
        neto_no_gravado,
        neto_21,
        neto_10,
        neto_27,
        neto_no_gravado_2,
        neto_21_2,
        neto_10_2,
        neto_27_2,
        neto_no_gravado_3,
        neto_21_3,
        neto_10_3,
        neto_27_3,
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
  const cantidad = arrayVehiculos.length;


  for (const [index, id_vehiculo] of arrayVehiculos.entries()) {
  let netoDividido_1 = Math.floor((importe_neto_total_1 / cantidad) * 100) / 100;
  let netoDividido_2 = Math.floor((importe_neto_total_2 / cantidad) * 100) / 100;
  let netoDividido_3 = Math.floor((importe_neto_total_3 / cantidad) * 100) / 100;
  let diferencia_1 = importe_neto_total_1 - netoDividido_1 * cantidad;
  let diferencia_2 = importe_neto_total_2 - netoDividido_2 * cantidad;
  let diferencia_3 = importe_neto_total_3 - netoDividido_3 * cantidad;
  let totalDividido_1 = importe_total_1 / cantidad;
  let totalDividido_2 = importe_total_2 / cantidad;
  let totalDividido_3 = importe_total_3 / cantidad;
  let ivaDividido_1 = importe_iva_total_1 / cantidad;
  let ivaDividido_2 = importe_iva_total_2 / cantidad;
  let ivaDividido_3 = importe_iva_total_3 / cantidad;
  let otrosImpuestosDividido = importe_otros_impuestos / cantidad;
  let otrosImpuestosIndividual = otrosImpuestosDividido / total_conceptos
    let importeAUsar_1 = netoDividido_1;
    let importeAUsar_2 = netoDividido_2;
    let importeAUsar_3 = netoDividido_3;
    let importeTotalAusar_1 = totalDividido_1;
    let importeTotalAusar_2 = totalDividido_2;
    let importeTotalAusar_3 = totalDividido_3;
    
    let dominio;
    if (index === cantidad - 1) {
      importeAUsar_1 += diferencia_1;
      importeTotalAusar_1 = importeAUsar_1 + ivaDividido_1;

      importeAUsar_2 += diferencia_2;
      importeTotalAusar_2 = importeAUsar_2 + ivaDividido_2;

      importeAUsar_3 += diferencia_3;
      importeTotalAusar_3 = importeAUsar_3 + ivaDividido_3;
    }
    console.log(importeAUsar_1)
    console.log(importeAUsar_2)
    console.log(importeAUsar_3)
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
        importeAUsar_1,
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
        importeAUsar_1,
        observacion + ` (${dominio})`,
        transaction_asientos,
        numero_comprobante,
        getTodayDate(),
        null,
        FA_FC
      );
      if(id_concepto_2){
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuenta_concepto_2,
        "D",
        importeAUsar_2,
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
        cuenta_secundaria_concepto_2,
        "D",
        importeAUsar_2,
        observacion + ` (${dominio})`,
        transaction_asientos,
        numero_comprobante,
        getTodayDate(),
        null,
        FA_FC
      );
      }
      if(id_concepto_3){
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuenta_concepto_3,
        "D",
        importeAUsar_3,
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
        cuenta_secundaria_concepto_3,
        "D",
        importeAUsar_3,
        observacion + ` (${dominio})`,
        transaction_asientos,
        numero_comprobante,
        getTodayDate(),
        null,
        FA_FC
      );
      }
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
            importeAUsar_1 * factor,
            ivaDividido_1 * factor,
            otrosImpuestosIndividual * factor,
            importeTotalAusar_1 * factor,
            observacion + ` (${dominio})`,
            NroAsiento,
            id_forma_cobro ? id_forma_cobro : null,
            null,
          ],
          transaction: transaction_costos_ingresos,
        }
      );
      if(id_concepto_2){
      await giama_renting.query(
        `INSERT INTO costos_ingresos 
      (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva, importe_otros_impuestos,
      importe_total, observacion, nro_asiento, id_forma_cobro, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            id_vehiculo,
            fecha,
            id_concepto_2,
            comprobante,
            importeAUsar_2 * factor,
            ivaDividido_2 * factor,
            otrosImpuestosIndividual * factor,
            importeTotalAusar_2 * factor,
            observacion + ` (${dominio})`,
            NroAsiento,
            id_forma_cobro ? id_forma_cobro : null,
            null,
          ],
          transaction: transaction_costos_ingresos,
        }
      );
      }
      if(id_concepto_3){
      await giama_renting.query(
        `INSERT INTO costos_ingresos 
      (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva, importe_otros_impuestos,
      importe_total, observacion, nro_asiento, id_forma_cobro, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            id_vehiculo,
            fecha,
            id_concepto_3,
            comprobante,
            importeAUsar_3 * factor,
            ivaDividido_3 * factor,
            otrosImpuestosIndividual * factor,
            importeTotalAusar_3 * factor,
            observacion + ` (${dominio})`,
            NroAsiento,
            id_forma_cobro ? id_forma_cobro : null,
            null,
          ],
          transaction: transaction_costos_ingresos,
        }
      );
      }
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
    message: "Prorrateo realizado correctamente",
  });
};
