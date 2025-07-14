import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { esAnteriorAHoy } from "../../helpers/esAnteriorAHoy.js";
import { formatearFechaISO } from "../../helpers/formatearFechaISO.js";
import { addDays, subDays, parseISO } from "date-fns";

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

const asientoContable = async (
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
        ],
        transaction: transaction,
      }
    );
  } catch (error) {
    console.log(error);
    transaction.rollback();
    throw "Error al generar un asiento";
  }
};

export const postAlquiler = async (req, res) => {
  const {
    id_contrato,
    //datos del cliente para el concepto:
    apellido_cliente,
    //no incluye fecha_cobro, hasta ahora se coloca fecha de hoy
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
  let alquileresVigentes;
  let NroAsiento;
  let NroAsientoSecundario;
  let cuentaIV21;
  let cuentaIV21_2;
  let cuentaALQU;
  let cuentaALQU_2;
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  let concepto = `Alquiler - ${apellido_cliente} - desde: ${fecha_desde_alquiler} hasta: ${fecha_hasta_alquiler}`;
  console.log("fecha_desde_alquiler: ", fecha_desde_alquiler);
  console.log("fecha_hasta_alquiler: ", fecha_hasta_alquiler);

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
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //buscar el estado del cliente
  /*   try {
    
  } catch (error) {
    
  } */
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
    observacion,
    id_contrato) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
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
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_contable_forma_cobro_alquiler,
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
    await asientoContable(
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
    await asientoContable(
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
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_forma_cobro_alquiler,
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
    await asientoContable(
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
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  transaction_giama_renting.commit();
  transaction_pa7_giama_renting.commit();
  return res.send({ status: true, message: "Alquiler ingresado con éxito" });
};

export const postContratoAlquiler = async (req, res) => {
  const {
    //datos del cliente para el concepto:
    apellido_cliente,
    //contrato
    id_vehiculo,
    id_cliente,
    fecha_desde_contrato,
    fecha_hasta_contrato,
    deposito,
    id_forma_cobro_contrato,
    //alquiler
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
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  let concepto = `Alquiler - ${apellido_cliente} - desde: ${fecha_desde_alquiler} hasta: ${fecha_hasta_alquiler}`;
  let conceptoDeposito = `Deposito en garantía - ${apellido_cliente} - desde: ${fecha_desde_contrato} hasta: ${fecha_hasta_contrato}`;
  let contratosVigentes;
  //buscar si el vehiculo está vendido

  let fecha_desde_alquiler_parseada = formatearFechaISO(fecha_desde_alquiler);
  let fecha_hasta_alquiler_parseada = formatearFechaISO(fecha_hasta_alquiler);
  let fecha_desde_contrato_parseada = formatearFechaISO(fecha_desde_contrato);
  let fecha_hasta_contrato_parseada = formatearFechaISO(fecha_hasta_contrato);

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
    console.log(error);
    return res.send({ status: false, message: JSON.stringify(error) });
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
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  //OBTENGO NUMEROS DE CUENTA IV21, IV21_2, ALQU, ALQU_2, DEPO Y DEP2
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
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "DEPO"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaDEPO = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    throw "Error al buscar un parámetro";
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "DEP2"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaDEP2 = result[0]["valor_str"];
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
  //inserto contrato
  try {
    const [result] = await giama_renting.query(
      `INSERT INTO contratos_alquiler 
      (id_vehiculo, id_cliente, fecha_desde, fecha_hasta, deposito_garantia,
      id_forma_cobro, fecha_cobro, nro_asiento) VALUES (?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          id_cliente,
          fecha_desde_contrato_parseada,
          fecha_hasta_contrato_parseada,
          deposito,
          id_forma_cobro_contrato,
          getTodayDate(),
          NroAsiento,
        ],
        transaction: transaction_giama_renting,
      }
    );
    idContrato = result; // <- aquí está el ID autogenerado
    console.log("ID DEL CONTRATO: ", idContrato);
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error al insertar el contrato",
    });
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
    observacion,
    id_contrato) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          id_vehiculo,
          id_cliente,
          fecha_desde_alquiler_parseada,
          fecha_hasta_alquiler_parseada,
          importe_neto,
          importe_iva,
          importe_total,
          id_forma_cobro_alquiler,
          getTodayDate(),
          NroAsiento,
          observacion ? observacion : null,
          idContrato,
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
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuenta_contable_forma_cobro_alquiler,
      "D",
      importe_total,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  //movimiento 2
  try {
    await asientoContable(
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
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  //movimiento 3
  try {
    await asientoContable(
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
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  //movimiento 1 deposito en garantia del contrato
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
  } catch (error) {
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  //movimiento 2 deposito en garantia del contrato
  try {
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaDEPO,
      "H",
      deposito,
      conceptoDeposito,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  //movimientos contables en C2_MOVIMIENTOS
  try {
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_forma_cobro_alquiler,
      "D",
      importe_total,
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  //movimiento 2
  try {
    await asientoContable(
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
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  //movimiento 3
  try {
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
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  //movimiento secundario 1 deposito en garantia del contrato
  try {
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuenta_secundaria_forma_cobro_contrato,
      "D",
      deposito,
      conceptoDeposito,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  //movimiento secundario 2 deposito en garantia del contrato
  try {
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
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error a insertar movimiento contable",
    });
  }
  transaction_giama_renting.commit();
  transaction_pa7_giama_renting.commit();
  return res.send({
    status: true,
    message: "Contrato y alquiler ingresados con éxito",
  });
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

export const getContratosByIdVehiculo = async (req, res) => {
  const { id } = req.body;
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
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};

export const getAlquilerByIdContrato = async (req, res) => {
  const { id } = req.body;
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

export const getContratos = async (req, res) => {
  const { fecha_desde, fecha_hasta } = req.body;
  if (!fecha_desde || !fecha_hasta) {
    try {
      const result = await giama_renting.query(
        "SELECT * FROM contratos_alquiler",
        {
          type: QueryTypes.SELECT,
        }
      );
      return res.send(result);
    } catch (error) {
      return res.send({ status: false, message: JSON.stringify(error) });
    }
  }
  if (fecha_desde && fecha_hasta) {
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
      return res.send({ status: false, message: JSON.stringify(error) });
    }
  }
};

export const getContratoById = async (req, res) => {
  const { id } = req.body;
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
    return res.send({ status: false, message: JSON.stringify(error) });
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
    contratoAnterior = result[0];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar el contrato" });
  }
  console.log("Contrato anterior: ", contratoAnterior);
  console.log("fecha_desde_nueva: ", formatearFechaISO(fecha_desde_contrato));
  console.log("fecha_hasta_nueva: ", formatearFechaISO(fecha_hasta_contrato));

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
    return res.send({
      status: false,
      message: "Error al insertar contrato al historial",
    });
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
    return res.send({
      status: false,
      message: "Error al insertar actualizar contrato",
    });
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
    await asientoContable(
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
    await asientoContable(
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
    await asientoContable(
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
    await asientoContable(
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
    await asientoContable(
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
