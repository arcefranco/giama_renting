import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { esAnteriorAHoy } from "../../helpers/esAnteriorAHoy.js";
import { formatearFechaISO } from "../../helpers/formatearFechaISO.js";

export const getFormasCobro = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM formas_cobro", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
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
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};

const asientoAlquiler = async (
  db,
  NroAsiento,
  cuenta_contable,
  DH,
  importe,
  concepto,
  transaction
) => {
  try {
    await pa7_giama_renting.query(
      `INSERT INTO ${db} 
    (Fecha, NroAsiento, Cuenta, DH, Importe, Concepto) VALUES (?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          getTodayDate(),
          NroAsiento,
          cuenta_contable,
          DH,
          importe,
          concepto,
          /* comprobante, NO HAY NI CONCEPTO NI NROCOMPROBANTE*/
        ],
        transaction: transaction,
      }
    );
  } catch (error) {
    transaction.rollback();
    throw "Error al generar un asiento";
  }
};

export const postAlquiler = async (req, res) => {
  const {
    //datos del cliente para el concepto:
    apellido_cliente,
    //no incluye fecha_cobro, hasta ahora se coloca fecha de hoy
    id_vehiculo,
    id_cliente,
    fecha_desde,
    fecha_hasta,
    importe_neto,
    importe_iva,
    importe_total,
    id_forma_cobro,
    observacion,
    cuenta_contable_forma_cobro,
    cuenta_secundaria_forma_cobro,
  } = req.body;
  let alquileresVigentes;
  let NroAsiento;
  let NroAsientoSecundario;
  let cuentaIV21;
  let cuentaIV21_2;
  let cuentaALQU;
  let cuentaALQU_2;
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  let concepto = `Alquiler - ${apellido_cliente} - desde: ${fecha_desde} hasta: ${fecha_hasta}`;
  //buscar si el vehiculo está vendido
  try {
    const result = await giama_renting.query(
      "SELECT fecha_venta FROM vehiculos WHERE id = ?",
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
  } catch (error) {
    return res.send({ status: false, message: JSON.stringify(error) });
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
    const nuevaDesde = parseDate(fecha_desde);
    const nuevaHasta = parseDate(fecha_hasta);

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
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //OBTENGO NUMEROS DE CUENTA IV21, IV21_2, ALQU Y ALQU_2(cuenta secundaria)
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
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "IV22"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaIV21_2 = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    throw "Error al buscar un parámetro";
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "ALQU"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaALQU = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    throw "Error al buscar un parámetro";
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "ALQ2"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaALQU_2 = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    throw "Error al buscar un parámetro";
  }
  //obtengo numero de asiento
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
    throw `Error al obtener número de asiento: ${error}`;
  }
  //obtengo numero de asiento secundario
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
    throw `Error al obtener número de asiento: ${error}`;
  }
  //inserto alquiler
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
    observacion) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          id_cliente,
          fecha_desde,
          fecha_hasta,
          importe_neto,
          importe_iva,
          importe_total,
          id_forma_cobro,
          getTodayDate(),
          NroAsiento,
          observacion ? observacion : null,
        ],
        transaction: transaction_giama_renting,
      }
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimientos contables
  try {
    await asientoAlquiler(
      "c_movimientos",
      NroAsiento,
      cuenta_contable_forma_cobro,
      "D",
      importe_total,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 2
  try {
    await asientoAlquiler(
      "c_movimientos",
      NroAsiento,
      cuentaALQU,
      "H",
      importe_neto,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 3
  try {
    await asientoAlquiler(
      "c_movimientos",
      NroAsiento,
      cuentaIV21,
      "H",
      importe_iva,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimientos contables en C2_MOVIMIENTOS
  try {
    await asientoAlquiler(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_forma_cobro,
      "D",
      importe_total,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 2
  try {
    await asientoAlquiler(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaALQU_2,
      "H",
      importe_neto,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 3
  try {
    await asientoAlquiler(
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
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  transaction_giama_renting.commit();
  transaction_pa7_giama_renting.commit();
  return res.send({ status: true, message: "Alquiler ingresado con éxito" });
};

export const getAlquileresByIdVehiculo = async (req, res) => {
  const { id } = req.body;
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
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};

export const getAlquilerById = async (req, res) => {
  const { id } = req.body;
  try {
    const result = await giama_renting.query(
      "SELECT * FROM alquileres WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(result);
  } catch (error) {
    return res.send({ status: false, message: JSON.stringify(error) });
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
      return res.send({ status: false, message: JSON.stringify(error) });
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
      return res.send({ status: false, message: JSON.stringify(error) });
    }
  }
};

export const anulacionAlquiler = async (req, res) => {
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
    cuenta_contable_forma_cobro = result[0]["cuenta_contable"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT cuenta_secundaria FROM formas_cobro WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id_forma_cobro],
      }
    );
    cuenta_secundaria_forma_cobro = result[0]["cuenta_secundaria"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT apellido FROM clientes WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id_cliente],
      }
    );
    apellido_cliente = result[0]["apellido"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }

  try {
    const result = await giama_renting.query(
      `SELECT fecha_hasta, id_alquiler_original FROM alquileres WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id_alquiler],
      }
    );
    fechaLimite = result[0]["fecha_hasta"];
    esAnulacion = result[0]["id_alquiler_original"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
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
  concepto = `Anulacion alquiler - ${apellido_cliente} - desde: ${fecha_hasta_actual} hasta: ${fecha_hasta_anterior}`;
  //CHEQUEAR QUE EL ALQUILER ESTÉ VIGENTE (EN CURSO O A COMENZAR)
  try {
    const result = await giama_renting.query(
      `SELECT apellido FROM clientes WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id_cliente],
      }
    );
    apellido_cliente = result[0]["apellido"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  //obtengo parametros IVA21/22, ALQU Y ALQ2
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
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "IV22"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaIV21_2 = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "ALQU"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaALQU = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "ALQ2"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaALQU_2 = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  //obtengo numero de asiento
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
    return res.send({
      status: false,
      message: "Error al obtener numero de asiento",
    });
  }
  //obtengo numero de asiento secundario
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
    return res.send({
      status: false,
      message: "Error al obtener numero de asiento",
    });
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
    return res.send({ status: false, message: "Error al insertar alquiler" });
  }
  //movimientos contables
  try {
    await asientoAlquiler(
      "c_movimientos",
      NroAsiento,
      cuenta_contable_forma_cobro,
      "H",
      importe_total,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 2
  try {
    await asientoAlquiler(
      "c_movimientos",
      NroAsiento,
      cuentaALQU,
      "D",
      importe_neto,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 3
  try {
    await asientoAlquiler(
      "c_movimientos",
      NroAsiento,
      cuentaIV21,
      "D",
      importe_iva,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimientos contables en C2_MOVIMIENTOS
  try {
    await asientoAlquiler(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_forma_cobro,
      "H",
      importe_total,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 2
  try {
    await asientoAlquiler(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaALQU_2,
      "D",
      importe_neto,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //movimiento 3
  try {
    await asientoAlquiler(
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
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  transaction_giama_renting.commit();
  transaction_pa7_giama_renting.commit();
  return res.send({ status: true, message: "Alquiler modificado con éxito" });
};

export const getAnulaciones = async (req, res) => {
  const { id_alquiler } = req.body;
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
    return res.send({ status: false, message: "Error al obtener anulaciones" });
  }

  return res.send(anulaciones);
};
