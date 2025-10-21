import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { esAnteriorAHoy } from "../../helpers/esAnteriorAHoy.js";
import {
  formatearFechaISO,
  formatearFechaISOText,
} from "../../helpers/formatearFechaISO.js";
import { addDays, subDays, parseISO } from "date-fns";
import { asientoContable } from "../../helpers/asientoContable.js";
import { getParametro } from "../../helpers/getParametro.js";
import {
  getNumeroAsiento,
  getNumeroAsientoSecundario,
} from "../../helpers/getNumeroAsiento.js";
import { verificarCliente } from "../../helpers/verificarCliente.js";
import { handleError, acciones } from "../../helpers/handleError.js";
import { validateArray } from "../../helpers/handleError.js";
import { verificarCamposObligatorios } from "../../helpers/verificarCampoObligatorio.js";
import { insertRecibo } from "../../helpers/insertRecibo.js";
import { verificarEstadoVehiculo } from "../../helpers/verificarEstadoVehiculo.js";
import { insertFactura } from "../../helpers/insertFactura.js";

const insertAlquiler = async (body) => {
  const {
    id_vehiculo,
    id_cliente,
    fecha_desde_alquiler,
    fecha_hasta_alquiler,
    importe_neto,
    importe_iva,
    importe_total,
    id_forma_cobro_alquiler,
    NroAsiento,
    observacion,
    id_contrato,
    nro_recibo,
    transaction,
  } = body;
  try {
    await giama_renting.query(
      `INSERT INTO alquileres 
    (id_vehiculo,
    id_cliente,
    fecha_desde,
    fecha_hasta,
    importe_neto,
    importe_iva,
    importe_total,
    id_forma_cobro,
    fecha_cobro,
    nro_asiento,
    observacion,
    id_contrato,
    nro_recibo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          id_cliente,
          fecha_desde_alquiler,
          fecha_hasta_alquiler,
          importe_neto,
          importe_iva,
          importe_total,
          id_forma_cobro_alquiler,
          getTodayDate(),
          NroAsiento,
          observacion ? observacion : "",
          id_contrato,
          nro_recibo,
        ],
        transaction: transaction,
      }
    );
    return true;
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error al insertar alquiler${
        error.message ? `${" :"}${error.message}` : ""
      }`
    );
  }
};

export const getFormasCobro = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM formas_cobro", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Formas de cobro", acciones.get);
    return res.send(body);
  }
};

export const postFormaCobro = async (req, res) => {
  const { nombre, cuenta_contable, cuenta_secundaria } = req.body;
  try {
    await giama_renting.query(
      "INSERT INTO formas_cobro (nombre, cuenta_contable, cuenta_secundaria) VALUES (?,?,?)",
      {
        replacements: [nombre, cuenta_contable, cuenta_secundaria],
        type: QueryTypes.INSERT,
      }
    );
    return res.send({
      status: true,
      message: "Forma de cobro insertada correctamente!",
    });
  } catch (error) {
    const { body } = handleError(error, "Formas de cobro", acciones.post);
    return res.send(body);
  }
};

export const postAlquiler = async (req, res) => {
  const {
    id_contrato,
    //datos del cliente para el concepto:
    apellido_cliente,
    //no incluye fecha_cobro, hasta ahora se coloca fecha de hoy
    usuario,
    id_vehiculo,
    id_cliente,
    fecha_desde_alquiler,
    fecha_hasta_alquiler,
    importe_neto,
    importe_iva,
    importe_total,
    id_forma_cobro_alquiler,
    observacion,
    cuenta_contable_forma_cobro_alquiler,
    cuenta_secundaria_forma_cobro_alquiler,
  } = req.body;
  console.log(fecha_desde_alquiler);
  console.log(fecha_hasta_alquiler);
  let fechaDesdeSplit = fecha_desde_alquiler.split("-");
  let fechaHastaSplit = fecha_hasta_alquiler.split("-");
  let alquileresVigentes;
  let NroAsiento;
  let NroAsientoSecundario;
  let cuentaIV21;
  let cuentaIV21_2;
  let cuentaALQU;
  let cuentaALQU_2;
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  let nro_recibo;
  let estadoCliente;
  let dominio;
  let concepto;
  //buscar el estado del cliente
  try {
    estadoCliente = await verificarCliente(id_cliente);
    if (estadoCliente)
      return res.send({ status: false, message: estadoCliente });
  } catch (error) {
    const { body } = handleError(error, "Estado del cliente", acciones.get);
    return res.send(body);
  }

  //buscar si el vehiculo está vendido // dominio
  try {
    const result = await giama_renting.query(
      "SELECT fecha_venta, dominio, dominio_provisorio FROM vehiculos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_vehiculo],
      }
    );
    if (result[0]["fecha_venta"]) {
      return res.send({
        status: false,
        message: "El vehículo se encuentra vendido",
      });
    }
    if (result[0]["dominio"]) dominio = result[0]["dominio"];
    else if (result[0]["dominio_provisorio"] && !result[0]["dominio"])
      dominio = result[0]["dominio_provisorio"];
    else dominio = "SIN DOMINIO";
  } catch (error) {
    const { body } = handleError(
      error,
      "Fecha de venta del vehiculo",
      acciones.get
    );
    return res.send(body);
  }
  //buscar si las fechas se exceden del limite permitido
  try {
    let contrato = await giama_renting.query(
      "SELECT fecha_desde, fecha_hasta FROM contratos_alquiler WHERE id = ?",
      {
        replacements: [id_contrato],
        type: QueryTypes.SELECT,
      }
    );
    const { fecha_desde, fecha_hasta } = contrato[0];
    if (fecha_desde_alquiler < fecha_desde) {
      return res.send({
        status: false,
        message: "La fecha desde del alquiler es anterior a la del contrato.",
      });
    }

    if (fecha_hasta_alquiler > fecha_hasta) {
      return res.send({
        status: false,
        message: "La fecha hasta del alquiler es posterior a la del contrato.",
      });
    }
  } catch (error) {
    const { body } = handleError(error, "Fechas del contrato", acciones.get);
    return res.send(body);
  }
  //buscar si el vehiculo está alquilado (en la tabla alquileres por id) en las fechas seleccionadas
  try {
    const result = await giama_renting.query(
      "SELECT fecha_desde, fecha_hasta FROM alquileres WHERE id_vehiculo = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_vehiculo],
      }
    );
    alquileresVigentes = result;
    const parseDate = (str) => new Date(str);
    const nuevaDesde = parseDate(fecha_desde_alquiler);
    const nuevaHasta = parseDate(fecha_hasta_alquiler);
    console.log(nuevaDesde);
    console.log(nuevaHasta);
    // Recorremos los alquileres existentes y verificamos si se superponen
    const hayConflicto = alquileresVigentes?.some(
      ({ fecha_desde, fecha_hasta }) => {
        const desdeExistente = parseDate(fecha_desde);
        const hastaExistente = parseDate(fecha_hasta);

        return nuevaDesde <= hastaExistente && desdeExistente <= nuevaHasta;
      }
    );

    if (hayConflicto) {
      return res.send({
        status: false,
        message:
          "El vehículo ya está alquilado en alguna de las fechas seleccionadas.",
      });
    }
  } catch (error) {
    console.log(error);
    const { body } = handleError(
      error,
      "Alquileres del vehiculo",
      acciones.get
    );
    return res.send(body);
  }
  //OBTENGO NUMEROS DE CUENTA IV21, IV21_2, ALQU Y ALQU_2(cuenta secundaria)
  try {
    cuentaIV21 = await getParametro("IV21");
    cuentaIV21_2 = await getParametro("IV22");
    cuentaALQU = await getParametro("ALQU");
    cuentaALQU_2 = await getParametro("ALQ2");
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "parámetro");
    return res.send(body);
  }
  try {
    NroAsiento = await getNumeroAsiento();
    NroAsientoSecundario = await getNumeroAsientoSecundario();
  } catch (error) {
    console.log("THIS: ", error);
    const { body } = handleError(error, "número de asiento");
    return res.send(body);
  }
  concepto = `Alquiler - ${apellido_cliente} - desde: ${fechaDesdeSplit[2]}/${fechaDesdeSplit[1]}/${fechaDesdeSplit[0]} 
  hasta: ${fechaHastaSplit[2]}/${fechaHastaSplit[1]}/${fechaHastaSplit[0]} Dominio: ${dominio}`;
  //inserto recibo
  try {
    nro_recibo = await insertRecibo(
      getTodayDate(),
      concepto,
      importe_total,
      usuario,
      id_cliente,
      id_vehiculo,
      id_contrato,
      null,
      id_forma_cobro_alquiler,
      null,
      transaction_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    const { body } = handleError(error, "Recibo de alquiler", acciones.post);
    return res.send(body);
  }
  //inserto factura
  try {
    await insertFactura(
      id_cliente,
      importe_neto,
      importe_iva,
      importe_total,
      usuario,
      NroAsiento,
      NroAsientoSecundario,
      concepto,
      transaction_giama_renting,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    const { body } = handleError(error, "Factura", acciones.post);
    return res.send(body);
  }
  //inserto alquiler
  try {
    await insertAlquiler({
      id_vehiculo: id_vehiculo,
      id_cliente: id_cliente,
      fecha_desde_alquiler: fecha_desde_alquiler,
      fecha_hasta_alquiler: fecha_hasta_alquiler,
      importe_neto: importe_neto,
      importe_iva: importe_iva,
      importe_total: importe_total,
      id_forma_cobro_alquiler: id_forma_cobro_alquiler,
      NroAsiento: NroAsiento,
      observacion: observacion,
      id_contrato: id_contrato,
      transaction: transaction_giama_renting,
      nro_recibo: nro_recibo,
    });
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    const { body } = handleError(
      error,
      "Semana adelantada de alquiler",
      acciones.post
    );
    return res.send(body);
  }
  //movimientos contables
  try {
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_contable_forma_cobro_alquiler,
      "D",
      importe_total,
      concepto,
      transaction_pa7_giama_renting,
      null,
      getTodayDate(),
      NroAsientoSecundario,
      null
    );
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaALQU,
      "H",
      importe_neto,
      concepto,
      transaction_pa7_giama_renting,
      null,
      getTodayDate(),
      NroAsientoSecundario,
      null
    );
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaIV21,
      "H",
      importe_iva,
      concepto,
      transaction_pa7_giama_renting,
      null,
      getTodayDate(),
      NroAsientoSecundario,
      null
    );
    //asientos secundarios
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_forma_cobro_alquiler,
      "D",
      importe_total,
      concepto,
      transaction_pa7_giama_renting
    );
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaALQU_2,
      "H",
      importe_neto,
      concepto,
      transaction_pa7_giama_renting,
      null,
      getTodayDate(),
      null,
      null
    );
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaIV21_2,
      "H",
      importe_iva,
      concepto,
      transaction_pa7_giama_renting,
      null,
      getTodayDate(),
      null,
      null
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    const { body } = handleError(error);
    return res.send(body);
  }
  transaction_giama_renting.commit();
  transaction_pa7_giama_renting.commit();
  return res.send({
    status: true,
    message: "Alquiler ingresado con éxito",
    data: nro_recibo,
  });
};

export const postContratoAlquiler = async (req, res) => {
  const {
    usuario,
    //datos del cliente para el concepto:
    apellido_cliente,
    //contrato
    id_vehiculo,
    id_cliente,
    fecha_desde_contrato,
    fecha_hasta_contrato,
    deposito,
    ingresa_deposito,
    id_forma_cobro_contrato,
    sucursal_vehiculo,
    //alquiler
    ingresa_alquiler,
    fecha_desde_alquiler,
    fecha_hasta_alquiler,
    importe_neto,
    importe_iva,
    importe_total,
    id_forma_cobro_alquiler,
    observacion,
    cuenta_contable_forma_cobro_alquiler,
    cuenta_contable_forma_cobro_contrato,
    cuenta_secundaria_forma_cobro_contrato,
    cuenta_secundaria_forma_cobro_alquiler,
  } = req.body;
  console.log(req.body);
  let alquileresVigentes;
  let NroAsiento;
  let NroAsientoSecundario;
  let cuentaIV21;
  let cuentaIV21_2;
  let cuentaALQU;
  let cuentaALQU_2;
  let cuentaDEPO;
  let cuentaDEP2;
  let idContrato;
  let id_factura;
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  let concepto = `Alquiler - ${apellido_cliente} - desde: ${formatearFechaISOText(
    fecha_desde_alquiler
  )} hasta: ${formatearFechaISOText(fecha_hasta_alquiler)}`;
  let contratosVigentes;
  let nro_recibo_alquiler;
  let nro_recibo_deposito;
  let fecha_desde_alquiler_parseada = formatearFechaISO(fecha_desde_alquiler);
  let fecha_hasta_alquiler_parseada = formatearFechaISO(fecha_hasta_alquiler);
  let fecha_desde_contrato_parseada = formatearFechaISO(fecha_desde_contrato);
  let fecha_hasta_contrato_parseada = formatearFechaISO(fecha_hasta_contrato);
  //verificar campos obligatorios
  const camposObligatorios = ["fecha_desde_contrato", "fecha_hasta_contrato"];
  const campoFaltante = verificarCamposObligatorios(
    req.body,
    camposObligatorios,
    "cliente"
  );
  let dominio;
  if (campoFaltante) {
    return res.send({
      status: false,
      message: `Falta completar el campo obligatorio: ${campoFaltante}`,
    });
  }
  //buscar el estado del cliente
  try {
    let estadoCliente = await verificarCliente(id_cliente);
    if (estadoCliente?.length)
      return res.send({ status: false, message: estadoCliente });
  } catch (error) {
    const { body } = handleError(error, "Estado del cliente", acciones.get);
    return res.send(body);
  }
  //buscar el estado del vehículo
  try {
    let estadoVehiculo = await verificarEstadoVehiculo(id_vehiculo);
    if (estadoVehiculo?.length)
      return res.send({ status: false, message: estadoVehiculo });
  } catch (error) {
    const { body } = handleError(error, "Estado del vehículo", acciones.get);
    return res.send(body);
  }
  //buscar si el cliente tiene un contrato vigente en fechas seleccionadas
  try {
    const result = await giama_renting.query(
      `
  SELECT fecha_desde, fecha_hasta 
  FROM contratos_alquiler 
  WHERE id_cliente = ?
    AND fecha_desde <= ? 
    AND fecha_hasta >= ? 
  `,
      {
        type: QueryTypes.SELECT,
        replacements: [
          id_cliente,
          fecha_hasta_contrato_parseada,
          fecha_desde_contrato_parseada,
        ],
      }
    );
    if (result.length > 0) {
      return res.send({
        status: false,
        message: "El cliente ya tiene un contrato en las fechas seleccionadas",
      });
    }
  } catch (error) {
    const { body } = handleError(error, "Contratos del cliente", acciones.get);
    return res.send(body);
  }
  //buscar si el vehiculo está vendido // dominio del vehiculo
  try {
    const result = await giama_renting.query(
      "SELECT fecha_venta, dominio, dominio_provisorio FROM vehiculos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_vehiculo],
      }
    );
    if (result[0]["fecha_venta"]) {
      return res.send({
        status: false,
        message: "El vehículo se encuentra vendido",
      });
    }
    if (result[0]["dominio"]) dominio = result[0]["dominio"];
    else if (result[0]["dominio_provisorio"] && !result[0]["dominio"])
      dominio = result[0]["dominio_provisorio"];
    else dominio = "SIN DOMINIO";
  } catch (error) {
    console.log(error);
    const { body } = handleError(
      error,
      "Fecha de venta del vehiculo",
      acciones.get
    );
    return res.send(body);
  }
  //buscar si el vehiculo está reservado (en la tabla contratos por id) en las fechas seleccionadas
  try {
    const result = await giama_renting.query(
      "SELECT fecha_desde, fecha_hasta FROM contratos_alquiler WHERE id_vehiculo = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_vehiculo],
      }
    );
    contratosVigentes = result;
    const parseDate = (str) => new Date(str);
    const nuevaDesde = parseDate(fecha_desde_contrato);
    const nuevaHasta = parseDate(fecha_hasta_contrato);

    // Recorremos los contratos existentes y verificamos si se superponen
    const hayConflicto = contratosVigentes?.some(
      ({ fecha_desde, fecha_hasta }) => {
        const desdeExistente = parseDate(fecha_desde);
        const hastaExistente = parseDate(fecha_hasta);

        return nuevaDesde <= hastaExistente && desdeExistente <= nuevaHasta;
      }
    );

    if (hayConflicto) {
      return res.send({
        status: false,
        message:
          "El vehículo se encuentra reservado en alguna de las fechas seleccionadas.",
      });
    }
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "Reservas del vehiculo", acciones.get);
    return res.send(body);
  }
  //chequear que se explicite el no ingreso del deposito/alquiler
  if (ingresa_deposito == 1 && !deposito) {
    return res.send({
      status: false,
      message:
        "Debe especificar que no ingresa depósito en garantía. Faltan datos para el ingreso del mismo.",
    });
  }
  if (
    ingresa_alquiler == 1 &&
    (!fecha_desde_alquiler ||
      !fecha_hasta_alquiler ||
      !id_forma_cobro_alquiler ||
      !importe_neto ||
      !importe_iva ||
      !importe_total)
  ) {
    return res.send({
      status: false,
      message:
        "Debe especificar que no ingresa alquiler. Faltan datos para el ingreso del mismo.",
    });
  }
  //OBTENGO NUMEROS DE CUENTA IV21, IV21_2, ALQU, ALQU_2, DEPO Y DEP2
  try {
    cuentaIV21 = await getParametro("IV21");
    cuentaIV21_2 = await getParametro("IV22");
    cuentaALQU = await getParametro("ALQU");
    cuentaALQU_2 = await getParametro("ALQ2");
    cuentaDEPO = await getParametro("DEPO");
    cuentaDEP2 = await getParametro("DEP2");
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "parámetro");
    return res.send(body);
  }
  if (ingresa_alquiler == 1) {
    //buscar si el vehiculo está alquilado (en la tabla alquileres por id) en las fechas seleccionadas
    try {
      const result = await giama_renting.query(
        "SELECT fecha_desde, fecha_hasta FROM alquileres WHERE id_vehiculo = ?",
        {
          type: QueryTypes.SELECT,
          replacements: [id_vehiculo],
        }
      );
      alquileresVigentes = result;
      const parseDate = (str) => new Date(str);
      const nuevaDesde = parseDate(fecha_desde_alquiler);
      const nuevaHasta = parseDate(fecha_hasta_alquiler);

      // Recorremos los alquileres existentes y verificamos si se superponen
      const hayConflicto = alquileresVigentes?.some(
        ({ fecha_desde, fecha_hasta }) => {
          const desdeExistente = parseDate(fecha_desde);
          const hastaExistente = parseDate(fecha_hasta);

          return nuevaDesde <= hastaExistente && desdeExistente <= nuevaHasta;
        }
      );

      if (hayConflicto) {
        return res.send({
          status: false,
          message:
            "El vehículo ya está alquilado en alguna de las fechas seleccionadas.",
        });
      }
    } catch (error) {
      console.log(error);
      const { body } = handleError(
        error,
        "Alquileres del vehiculo",
        acciones.get
      );
      return res.send(body);
    }
  }
  if (ingresa_deposito == 1 || ingresa_alquiler == 1) {
    try {
      NroAsiento = await getNumeroAsiento();
      NroAsientoSecundario = await getNumeroAsientoSecundario();
    } catch (error) {
      console.log(error);

      const { body } = handleError(error, "número de asiento");
      return res.send(body);
    }
  }
  const detalle_alquiler = `Alquiler desde ${formatearFechaISOText(
    fecha_desde_alquiler
  )} hasta ${formatearFechaISOText(fecha_hasta_alquiler)} Dominio: ${dominio}`;
  //inserto recibo alquiler
  if (ingresa_alquiler == 1) {
    try {
        id_factura = await insertFactura(
        id_cliente,
        importe_neto,
        importe_iva,
        importe_total,
        usuario,
        NroAsiento,
        NroAsientoSecundario,
        detalle_alquiler,
        transaction_giama_renting,
        transaction_pa7_giama_renting
      );
      nro_recibo_alquiler = await insertRecibo(
        getTodayDate(),
        detalle_alquiler,
        importe_total,
        usuario,
        id_cliente,
        id_vehiculo,
        null,
        null,
        id_forma_cobro_alquiler,
        id_factura,
        transaction_giama_renting
      );
    } catch (error) {
      console.log(error);
      transaction_pa7_giama_renting.rollback()
      transaction_giama_renting.rollback()
      const { body } = handleError(error, "Recibo de alquiler", acciones.post);
      return res.send(body);
    }
  }
  const conceptoDeposito = `Deposito en garantía - Dominio: ${dominio}`;
  //inserto recibo del depósito del contrato
  if (ingresa_deposito == 1) {
    try {
      nro_recibo_deposito = await insertRecibo(
        getTodayDate(),
        conceptoDeposito,
        deposito,
        usuario,
        id_cliente,
        id_vehiculo,
        null,
        null,
        id_forma_cobro_contrato,
        null,
        transaction_giama_renting
      );
    } catch (error) {
      console.log(error);
      const { body } = handleError(error, "Recibo de alquiler", acciones.post);
      return res.send(body);
    }
  }
  //inserto contrato
  try {
    const [result] = await giama_renting.query(
      `INSERT INTO contratos_alquiler 
      (id_vehiculo, id_cliente, fecha_desde, fecha_hasta, deposito_garantia,
      id_forma_cobro, fecha_cobro, nro_asiento, nro_recibo) VALUES (?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          id_cliente,
          fecha_desde_contrato_parseada,
          fecha_hasta_contrato_parseada,
          deposito ? deposito : null,
          id_forma_cobro_contrato ? id_forma_cobro_contrato : null,
          getTodayDate(),
          NroAsiento ? NroAsiento : null,
          nro_recibo_deposito ? nro_recibo_deposito : null,
        ],
        transaction: transaction_giama_renting,
      }
    );
    idContrato = result;
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    const { body } = handleError(error, "Contrato de alquiler", acciones.post);
    return res.send(body);
  }
  //cambio el estado del vehiculo a "sin preparar" (1)
  try {
    await giama_renting.query(
      "UPDATE vehiculos SET estado_actual = 1 WHERE id = ?",
      {
        type: QueryTypes.UPDATE,
        replacements: [id_vehiculo],
        transaction: transaction_giama_renting,
      }
    );
  } catch (error) {
    const { body } = handleError(error, "Estado del vehiculo", acciones.update);
    return res.send(body);
  }
  //inserto alquiler
  if (ingresa_alquiler == 1) {
    try {
      await insertAlquiler({
        id_vehiculo: id_vehiculo,
        id_cliente: id_cliente,
        fecha_desde_alquiler: fecha_desde_alquiler_parseada,
        fecha_hasta_alquiler: fecha_hasta_alquiler_parseada,
        importe_neto: importe_neto,
        importe_iva: importe_iva,
        importe_total: importe_total,
        id_forma_cobro_alquiler: id_forma_cobro_alquiler,
        NroAsiento: NroAsiento,
        observacion: observacion,
        id_contrato: idContrato,
        nro_recibo: nro_recibo_alquiler ? nro_recibo_alquiler : null,
        transaction: transaction_giama_renting,
      });
    } catch (error) {
      console.log(error);
      const { body } = handleError(
        error,
        "Semana adelantada de alquiler",
        acciones.post
      );
      return res.send(body);
    }
  }
  //movimientos contables
  if (ingresa_alquiler == 1) {
    try {
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuenta_contable_forma_cobro_alquiler,
        "D",
        importe_total,
        concepto,
        transaction_pa7_giama_renting
      );
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuentaALQU,
        "H",
        importe_neto,
        concepto,
        transaction_pa7_giama_renting
      );
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuentaIV21,
        "H",
        importe_iva,
        concepto,
        transaction_pa7_giama_renting
      );
      //movimientos contables secundarios
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuenta_secundaria_forma_cobro_alquiler,
        "D",
        importe_total,
        concepto,
        transaction_pa7_giama_renting
      );
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuentaALQU_2,
        "H",
        importe_neto,
        concepto,
        transaction_pa7_giama_renting
      );
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuentaIV21_2,
        "H",
        importe_iva,
        concepto,
        transaction_pa7_giama_renting
      );
    } catch (error) {
      console.log(error);

      const { body } = handleError(error);
      return res.send(body);
    }
  }
  if (ingresa_deposito == 1) {
    try {
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuenta_contable_forma_cobro_contrato,
        "D",
        deposito,
        conceptoDeposito,
        transaction_pa7_giama_renting
      );
      await asientoContable(
        "c_movimientos",
        NroAsiento,
        cuentaDEPO,
        "H",
        deposito,
        conceptoDeposito,
        transaction_pa7_giama_renting
      );
      //movimientos contables secundarios
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuenta_secundaria_forma_cobro_contrato,
        "D",
        deposito,
        conceptoDeposito,
        transaction_pa7_giama_renting
      );
      await asientoContable(
        "c2_movimientos",
        NroAsientoSecundario,
        cuentaDEP2,
        "H",
        deposito,
        conceptoDeposito,
        transaction_pa7_giama_renting
      );
    } catch (error) {
      console.log(error);
      transaction_giama_renting.rollback();
      transaction_pa7_giama_renting.rollback();
      const { body } = handleError(error);
      return res.send(body);
    }
  }

  transaction_giama_renting.commit();
  transaction_pa7_giama_renting.commit();
  return res.send({
    nro_recibo_alquiler: nro_recibo_alquiler,
    nro_recibo_deposito: nro_recibo_deposito,
    status: true,
    message: "Contrato y alquiler ingresados con éxito",
  });
};

export const getAlquileresByIdVehiculo = async (req, res) => {
  const { id } = req.body;
  if (!id)
    return res.send({
      statuts: false,
      message: "No se encontró el id del vehículo",
    });
  try {
    const result = await giama_renting.query(
      "SELECT * FROM alquileres WHERE id_vehiculo = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(result);
  } catch (error) {
    const { body } = handleError(
      error,
      "Alquileres del vehículo",
      acciones.get
    );
    return res.send(body);
  }
};

export const getContratosByIdVehiculo = async (req, res) => {
  const { id } = req.body;
  if (!id)
    return res.send({
      statuts: false,
      message: "No se encontró el id del vehículo",
    });
  try {
    const result = await giama_renting.query(
      `SELECT * 
      FROM contratos_alquiler 
      WHERE id_vehiculo = ? 
      AND fecha_hasta >= CURDATE();`,
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(result);
  } catch (error) {
    const { body } = handleError(error, "Contratos del vehículo", acciones.get);
    return res.send(body);
  }
};

export const getAlquilerByIdContrato = async (req, res) => {
  const { id } = req.body;
  if (!id)
    return res.send({
      statuts: false,
      message: "No se encontró el id del alquiler",
    });
  try {
    const result = await giama_renting.query(
      "SELECT * FROM alquileres WHERE id_contrato = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(result);
  } catch (error) {
    const { body } = handleError(
      error,
      "Alquileres del contrato",
      acciones.get
    );
    return res.send(body);
  }
};

export const getAlquileres = async (req, res) => {
  const { fecha_desde, fecha_hasta } = req.body;
  if (!fecha_desde || !fecha_hasta) {
    try {
      const result = await giama_renting.query("SELECT * FROM alquileres", {
        type: QueryTypes.SELECT,
      });
      return res.send(result);
    } catch (error) {
      const { body } = handleError(error, "Alquileres", acciones.get);
      return res.send(body);
    }
  }
  if (fecha_desde && fecha_hasta) {
    try {
      const result = await giama_renting.query(
        "SELECT * FROM alquileres WHERE fecha_desde >= ? AND fecha_hasta <= ?",
        {
          type: QueryTypes.SELECT,
          replacements: [fecha_desde, fecha_hasta],
        }
      );
      return res.send(result);
    } catch (error) {
      const { body } = handleError(error, "Alquileres", acciones.get);
      return res.send(body);
    }
  }
};

export const getContratos = async (req, res) => {
  const { fecha_desde, fecha_hasta, vigentes } = req.body;
/*   if (!fecha_desde || !fecha_hasta) { */
    if(vigentes){
      try {
      const result = await giama_renting.query(
        `SELECT 
  c.*, 
  a.id AS ultimo_alquiler_id, 
  a.fecha_desde AS ultima_fecha_desde, 
  a.fecha_hasta AS ultima_fecha_hasta
FROM contratos_alquiler c
LEFT JOIN alquileres a 
  ON a.id = (
    SELECT MAX(id)
    FROM alquileres
    WHERE alquileres.id_contrato = c.id
  )
WHERE (a.fecha_hasta < c.fecha_hasta)
ORDER BY a.id;`,
        {
          type: QueryTypes.SELECT,
        }
      );
      return res.send(result);
    } catch (error) {
      const { body } = handleError(error, "Contratos", acciones.get);
      return res.send(body);
    }
    }else{
      try {
        const result = await giama_renting.query(
          "SELECT * FROM contratos_alquiler",
          {
            type: QueryTypes.SELECT,
          }
        );
        return res.send(result);
      } catch (error) {
        const { body } = handleError(error, "Contratos", acciones.get);
        return res.send(body);
      }
    }
/*   } */
/*   if (fecha_desde && fecha_hasta) {
    try {
      const result = await giama_renting.query(
        "SELECT * FROM contratos_alquiler WHERE fecha_desde >= ? AND fecha_hasta <= ?",
        {
          type: QueryTypes.SELECT,
          replacements: [fecha_desde, fecha_hasta],
        }
      );
      return res.send(result);
    } catch (error) {
      const { body } = handleError(error, "Contratos", acciones.get);
      return res.send(body);
    }
  } */
};

export const getContratoById = async (req, res) => {
  const { id } = req.body;
  if (!id)
    return res.send({
      status: false,
      message: "No se encontró el id del contrato",
    });
  try {
    const result = await giama_renting.query(
      "SELECT * FROM contratos_alquiler WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(result);
  } catch (error) {
    const { body } = handleError(error, "Contrato", acciones.get);
    return res.send(body);
  }
};

export const anulacionContrato = async (req, res) => {
  const { id_contrato, fecha_desde_contrato, fecha_hasta_contrato } = req.body;
  let contratoAnterior;
  let transaction_giama_renting = await giama_renting.transaction();
  try {
    const result = await giama_renting.query(
      `
      SELECT * FROM contratos_alquiler WHERE id = ?`,
      {
        replacements: [id_contrato],
        type: QueryTypes.SELECT,
      }
    );
    const validatorResult = validateArray(result, "Contrato");
    if (validatorResult) {
      return res.send(validatorResult);
    }
    contratoAnterior = result[0];
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "Contrato", acciones.get);
    return res.send(body);
  }

  const originalDesde = parseISO(contratoAnterior.fecha_desde);
  const originalHasta = parseISO(contratoAnterior.fecha_hasta);
  const nuevaDesde = parseISO(fecha_desde_contrato);
  const nuevaHasta = parseISO(fecha_hasta_contrato);

  originalDesde.setHours(0, 0, 0, 0);
  originalHasta.setHours(0, 0, 0, 0);
  nuevaDesde.setHours(0, 0, 0, 0);
  nuevaHasta.setHours(0, 0, 0, 0);

  let fechaDesdeHistorial = null;
  let fechaHastaHistorial = null;

  // Detectamos acorte al inicio
  if (nuevaDesde > originalDesde) {
    fechaDesdeHistorial = originalDesde;
    fechaHastaHistorial = subDays(nuevaDesde, 1); // día anterior
  }

  // Detectamos acorte al final
  if (nuevaHasta < originalHasta) {
    fechaDesdeHistorial = addDays(nuevaHasta, 1); // día siguiente
    fechaHastaHistorial = originalHasta;
  }

  //inserto en historial el contrato anterior
  try {
    await giama_renting.query(
      `INSERT INTO historial_anulaciones_contratos
       (id_contrato, id_vehiculo, id_cliente, fecha_desde, fecha_hasta, deposito_garantia, 
       id_forma_cobro, nro_asiento) VALUES (?,?,?,?,?,?,?,?)`,
      {
        replacements: [
          id_contrato,
          contratoAnterior["id_vehiculo"],
          contratoAnterior["id_cliente"],
          formatearFechaISO(fechaDesdeHistorial),
          formatearFechaISO(fechaHastaHistorial),
          contratoAnterior["deposito_garantia"],
          contratoAnterior["id_forma_cobro"],
          contratoAnterior["nro_asiento"],
        ],
        type: QueryTypes.INSERT,
        transaction: transaction_giama_renting,
      }
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    const { body } = handleError(
      error,
      "Historial de anulaciones",
      acciones.post
    );
    return res.send(body);
  }
  //actualizo el contrato en tabla contratos_alquiler
  try {
    await giama_renting.query(
      `UPDATE contratos_alquiler SET fecha_desde = ?, 
      fecha_hasta = ? WHERE id = ?`,
      {
        type: QueryTypes.UPDATE,
        replacements: [
          formatearFechaISO(nuevaDesde),
          formatearFechaISO(nuevaHasta),
          id_contrato,
        ],
        transaction: transaction_giama_renting,
      }
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    const { body } = handleError(error, "Contrato", acciones.update);
    return res.send(body);
  }
  transaction_giama_renting.commit();
  return res.send({
    status: true,
    message: "Contrato actualizado correctamente",
  });
};

export const anulacionAlquiler = async (req, res) => {
  //ANULACION DE CONTRATO
  const {
    id_alquiler,
    id_vehiculo,
    id_cliente,
    fecha_hasta_actual,
    fecha_hasta_anterior,
    observacion,
    importe_neto,
    importe_iva,
    importe_total,
    id_forma_cobro,
  } = req.body;
  let apellido_cliente;
  let cuenta_contable_forma_cobro;
  let cuenta_secundaria_forma_cobro;
  let NroAsiento;
  let NroAsientoSecundario;
  let cuentaIV21;
  let cuentaIV21_2;
  let cuentaALQU;
  let cuentaALQU_2;
  let concepto;
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  let fechaLimite;
  let esAnulacion;
  //BUSCAR APELLIDO Y CUENTAS CONTABLES
  try {
    const result = await giama_renting.query(
      `SELECT cuenta_contable FROM formas_cobro WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id_forma_cobro],
      }
    );
    const validatorResult = validateArray(result, "Cuenta contable");
    if (validatorResult) {
      return res.send(validatorResult);
    }
    cuenta_contable_forma_cobro = result[0]["cuenta_contable"];
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "Cuenta contable", acciones.get);
    return res.send(body);
  }
  try {
    const result = await giama_renting.query(
      `SELECT cuenta_secundaria FROM formas_cobro WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id_forma_cobro],
      }
    );
    const validatorResult = validateArray(result, "Cuenta secundaria");
    if (validatorResult) {
      return res.send(validatorResult);
    }
    cuenta_secundaria_forma_cobro = result[0]["cuenta_secundaria"];
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "Cuenta secundaria", acciones.get);
    return res.send(body);
  }
  try {
    const result = await giama_renting.query(
      `SELECT apellido FROM clientes WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id_cliente],
      }
    );
    const validatorResult = validateArray(result, "Cliente");
    if (validatorResult) {
      return res.send(validatorResult);
    }
    apellido_cliente = result[0]["apellido"];
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "Apellido del cliente", acciones.get);
    return res.send(body);
  }

  try {
    const result = await giama_renting.query(
      `SELECT fecha_hasta, id_alquiler_original FROM alquileres WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id_alquiler],
      }
    );
    const validatorResult = validateArray(result, "Alquiler");
    if (validatorResult) {
      return res.send(validatorResult);
    }
    fechaLimite = result[0]["fecha_hasta"];
    esAnulacion = result[0]["id_alquiler_original"];
  } catch (error) {
    console.log(error);
    const { body } = handleError(
      error,
      "Fechas del alquiler original",
      acciones.get
    );
    return res.send(body);
  }
  if (esAnulacion) {
    return res.send({
      status: false,
      message: "No se puede modificar una anulación",
    });
  }
  if (esAnteriorAHoy(fechaLimite)) {
    return res.send({
      status: false,
      message: "Se ha excedido el tiempo límite para modificar el alquiler",
    });
  }
  concepto = `Anulacion alquiler - ${apellido_cliente} - desde: ${formatearFechaISOText(
    fecha_hasta_actual
  )} hasta: 
  ${formatearFechaISOText(fecha_hasta_anterior)}`;
  //obtengo parametros IVA21/22, ALQU Y ALQ2
  try {
    cuentaIV21 = await getParametro("IV21");
    cuentaIV21_2 = await getParametro("IV22");
    cuentaALQU = await getParametro("ALQU");
    cuentaALQU_2 = await getParametro("ALQ2");
  } catch (error) {
    const { body } = handleError(error, "parámetro");
    return res.send(body);
  }

  //obtengo numero de asiento y asiento secundario
  try {
    NroAsiento = await getNumeroAsiento();
    NroAsientoSecundario = await getNumeroAsientoSecundario();
  } catch (error) {
    const { body } = handleError(error, "número de asiento");
    return res.send(body);
  }
  //alquiler negativo
  try {
    await giama_renting.query(
      `INSERT INTO alquileres 
    (id_vehiculo,
    id_cliente,
    fecha_desde,
    fecha_hasta,
    importe_neto,
    importe_iva,
    importe_total,
    id_forma_cobro,
    fecha_cobro,
    observacion,
    id_alquiler_original,
    nro_asiento) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          id_cliente,
          formatearFechaISO(fecha_hasta_actual),
          fecha_hasta_anterior,
          importe_neto * -1,
          importe_iva * -1,
          importe_total * -1,
          id_forma_cobro,
          getTodayDate(),
          observacion ? observacion : null,
          id_alquiler,
          NroAsiento,
        ],
        transaction: transaction_giama_renting,
      }
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    const { body } = handleError(error, "Alquiler", acciones.post);
    return res.send(body);
  }
  //movimientos contables
  try {
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_contable_forma_cobro,
      "H",
      importe_total,
      concepto,
      transaction_pa7_giama_renting
    );
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaALQU,
      "D",
      importe_neto,
      concepto,
      transaction_pa7_giama_renting
    );
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaIV21,
      "D",
      importe_iva,
      concepto,
      transaction_pa7_giama_renting
    );
    //movimientos contables en C2_MOVIMIENTOS
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_forma_cobro,
      "H",
      importe_total,
      concepto,
      transaction_pa7_giama_renting
    );
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaALQU_2,
      "D",
      importe_neto,
      concepto,
      transaction_pa7_giama_renting
    );
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaIV21_2,
      "D",
      importe_iva,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    const { body } = handleError(error, "Asiento contable", acciones.post);
    return res.send(body);
  }
  transaction_giama_renting.commit();
  transaction_pa7_giama_renting.commit();
  return res.send({ status: true, message: "Alquiler modificado con éxito" });
};

export const getAnulaciones = async (req, res) => {
  const { id_alquiler } = req.body;
  if (!id_alquiler)
    return res.send({
      statuts: false,
      message: "No se encontró el id del alquiler",
    });
  let anulaciones;
  try {
    anulaciones = await giama_renting.query(
      "SELECT fecha_desde, fecha_hasta FROM alquileres WHERE id_alquiler_original = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_alquiler],
      }
    );
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "Anulaciones", acciones.get);
    return res.send(body);
  }

  return res.send(anulaciones);
};
