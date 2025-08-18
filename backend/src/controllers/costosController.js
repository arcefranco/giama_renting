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

//FUNCION AUXILIAR
const movimientosProveedores = async ({
  cod_proveedor,
  tipo_comprobante,
  numero_comprobante_1,
  numero_comprobante_2,
  importe_neto,
  importe_total,
  cuenta_concepto,
  NroAsiento,
  NroAsientoSecundario,
  usuario,
  transaction_asientos,
}) => {
  let FA_FC =
    tipo_comprobante == 1 ? "FA" : tipo_comprobante == 3 ? "FC" : null;
  let numero_comprobante_1_formateado = padWithZeros(numero_comprobante_1, 5);
  let numero_comprobante_2_formateado = padWithZeros(numero_comprobante_2, 8);
  console.log(
    "ESTO ES NUMERO COMPROBANTE FORMATEADO: ",
    numero_comprobante_2_formateado
  );
  let NroComprobante = `${numero_comprobante_1_formateado}${numero_comprobante_2_formateado}`;
  let insertMovProv;
  //c_movprov
  try {
    const result = await pa7_giama_renting.query(
      `INSERT INTO c_movprov (Fecha, Proveedor, 
      TipoComprobante, NroComprobante, Vencimiento, NetoGravado1, 
      TasaIva1, Total) VALUES (?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          cod_proveedor,
          FA_FC,
          NroComprobante,
          getTodayDate(),
          importe_neto,
          21,
          importe_total,
        ],
        transaction: transaction_asientos,
      }
    );
    insertMovProv = result[0];
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c2_movprov
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c2_movprov (Fecha, Proveedor, 
      TipoComprobante, NroComprobante, Vencimiento, NetoGravado1, 
      TasaIva1, Total) VALUES (?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          cod_proveedor,
          FA_FC,
          NroComprobante,
          getTodayDate(),
          importe_neto,
          21,
          importe_total,
        ],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c_movprovdetalles
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movprovdetalles (IdMovProveedor, IdTipoImporteComprobante,
      CtaContable, Importe) VALUES (?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [insertMovProv, 3, cuenta_concepto, importe_neto],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c_movprovctacte
  try {
    let A_C = tipo_comprobante == 1 ? "A" : tipo_comprobante == 3 ? "C" : null;
    let DenomComprobante =
      tipo_comprobante == 1 ? "FPA" : tipo_comprobante == 3 ? "FPC" : null;
    let ConceptoComprobante = `Factura "${A_C}" N° ${numero_comprobante_1_formateado}-${numero_comprobante_2_formateado}`;
    await pa7_giama_renting.query(
      `INSERT INTO c_movprovctacte (IdProveedor, ConceptoComprobante,
      DenomComprobante, NroComprobante, Fecha, TipoComprobante, IdComprobante, 
      TipoAplicacion, IdAplicacion, Importe, NroAsiento, ConceptoAplicacion,
      DenomAplicacion, NroAplicacion, ImporteTotalComprobante, ImporteTotalAplicacion, 
      FechaAltaRegistro, UsuarioAltaRegistro) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          cod_proveedor,
          ConceptoComprobante,
          DenomComprobante,
          NroComprobante,
          getTodayDate(),
          tipo_comprobante,
          insertMovProv,
          tipo_comprobante,
          insertMovProv,
          importe_total,
          NroAsiento,
          ConceptoComprobante,
          DenomComprobante,
          NroComprobante,
          importe_total,
          importe_total,
          `${getTodayDate()} 00:00:00`,
          usuario,
        ],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
  //c_movprovrelaasiento
  try {
    await pa7_giama_renting.query(
      `INSERT INTO c_movprovrelaasiento (IdMovProveedor, NroAsiento1, NroAsiento2) VALUES (?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          insertMovProv,
          NroAsiento,
          NroAsientoSecundario ? NroAsientoSecundario : null,
        ],
        transaction: transaction_asientos,
      }
    );
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar registro en proveedores ${
        error.message ? ` :${error.message}` : ""
      }`
    );
  }
};

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
  cuenta_concepto,
  cuenta_secundaria_concepto,
  cuenta_forma_cobro,
  cuenta_secundaria_forma_cobro,
  importe_neto,
  importe_iva,
  importe_total,
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

  try {
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_concepto,
      dhNetoEIva,
      importe_neto,
      observacion,
      transaction,
      comprobante,
      Fecha,
      NroAsientoSecundario,
      TipoComprobante
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
      Fecha,
      NroAsientoSecundario,
      TipoComprobante
    );
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_forma_cobro,
      dhTotal,
      importe_total,
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
        importe_neto,
        observacion,
        transaction,
        comprobante,
        Fecha,
        null,
        TipoComprobante
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
        Fecha,
        null,
        TipoComprobante
      );
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuenta_secundaria_forma_cobro,
        dhTotal,
        importe_total,
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
  id_concepto,
  importe_neto,
  importe_iva,
  importe_total,
  observacion,
  id_forma_cobro,
  genera_recibo,
  cta_cte_proveedores,
  usuario,
  id_cliente,
  cod_proveedor,
  tipo_comprobante,
  numero_comprobante_1,
  numero_comprobante_2,
}) {
  let transaction_costos_ingresos = await giama_renting.transaction();
  let transaction_asientos = await pa7_giama_renting.transaction();
  let ingreso_egreso;
  let NroAsiento;
  let NroAsientoSecundario;
  let cuenta_forma_cobro;
  let cuenta_secundaria_forma_cobro;
  let cuenta_concepto;
  let cuenta_secundaria_concepto;
  let nro_recibo;
  let FA_FC;
  let comprobante;
  //obtengo si es ingreso o egreso
  try {
    const result = await giama_renting.query(
      `SELECT ingreso_egreso, cuenta_contable, cuenta_secundaria FROM conceptos_costos WHERE id = :id_concepto`,
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
    await transaction_asientos.rollback();
    await transaction_costos_ingresos.rollback();
    throw new Error(
      `Error al buscar una cuenta contable ${
        error.message ? `${" :"}${error.message}` : ""
      }`
    );
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
      importe_neto,
      importe_iva,
      importe_total,
      observacion,
      comprobante,
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
  const importeNetoFinal = importe_neto * factor;
  const importeIvaFinal = importe_iva * factor;
  const importeTotalFinal = importe_total * factor;
  if (ingreso_egreso === "I" && genera_recibo == 1) {
    //recibo
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
    //factura
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
  if (ingreso_egreso === "E" && cta_cte_proveedores == 1) {
    await movimientosProveedores({
      cod_proveedor,
      tipo_comprobante,
      numero_comprobante_1,
      numero_comprobante_2,
      importe_neto,
      importe_total,
      cuenta_concepto,
      NroAsiento,
      NroAsientoSecundario,
      usuario,
      transaction_asientos,
    });
  }
  try {
    await giama_renting.query(
      `INSERT INTO costos_ingresos 
      (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva,
      importe_total, observacion, nro_asiento, id_forma_cobro, id_cliente, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          fecha,
          id_concepto,
          comprobante ? comprobante : null,
          importeNetoFinal,
          importeIvaFinal,
          importeTotalFinal,
          observacion,
          NroAsiento,
          id_forma_cobro ? id_forma_cobro : null,
          id_cliente ? id_cliente : null,
          nro_recibo ? nro_recibo : null,
        ],
        transaction: transaction_costos_ingresos,
      }
    );
    await transaction_costos_ingresos.commit();
    await transaction_asientos.commit();
    return nro_recibo ? nro_recibo : null;
  } catch (error) {
    await transaction_costos_ingresos.rollback();
    await transaction_asientos.rollback();
    throw new Error(error.message);
  }
}

export const postCostos_Ingresos = async (req, res) => {
  try {
    let nro_recibo_ingreso = await registrarCostoIngresoIndividual(req.body);
    return res.send({
      status: true,
      message: "Ingresado correctamente",
      nro_recibo_ingreso: nro_recibo_ingreso ? nro_recibo_ingreso : null,
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
    observacion,
    id_forma_cobro,
    cta_cte_proveedores,
    cod_proveedor,
    tipo_comprobante,
    numero_comprobante_1,
    numero_comprobante_2,
    usuario,
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
  if (cta_cte_proveedores == 1) {
    try {
      await movimientosProveedores({
        cod_proveedor,
        tipo_comprobante,
        numero_comprobante_1,
        numero_comprobante_2,
        importe_neto,
        importe_total,
        cuenta_concepto: cuenta_forma_cobro,
        NroAsiento,
        NroAsientoSecundario,
        usuario,
        transaction_asientos,
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

    //inserto en costos_ingresos
    try {
      await giama_renting.query(
        `INSERT INTO costos_ingresos 
      (id_vehiculo, fecha, id_concepto, comprobante, importe_neto, importe_iva,
      importe_total, observacion, nro_asiento, id_forma_cobro, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            id_vehiculo,
            fecha,
            id_concepto,
            comprobante,
            importeAUsar,
            ivaDividido,
            importeTotalAusar,
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
