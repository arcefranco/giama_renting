import { QueryTypes } from "sequelize";
import { giama_renting, pa7_giama_renting } from "../../helpers/connection.js";
import { s3 } from "../../helpers/s3Connection.js";
import { v4 as uuidv4 } from "uuid";
import { asientoContable } from "../../helpers/asientoContable.js";
import moment from "moment";
import {
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { handleSqlError } from "../../helpers/handleSqlError.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { normalizarFecha } from "../../helpers/normalizarFecha.js";
import { diferenciaDias } from "../../helpers/diferenciaDias.js";

export const getVehiculos = async (req, res) => {
  try {
    const resultado = await giama_renting.query(
      `SELECT 
      vehiculos.*, 
      (IFNULL(alq.id_vehiculo, 0) <> 0) AS vehiculo_alquilado,
      (IFNULL(con.id_vehiculo, 0) <> 0) AS vehiculo_reservado
      FROM vehiculos
      LEFT JOIN (
      SELECT id_vehiculo 
      FROM alquileres 
      WHERE NOW() BETWEEN fecha_desde AND fecha_hasta
      ) AS alq ON vehiculos.id = alq.id_vehiculo
      LEFT JOIN (
      SELECT id_vehiculo 
      FROM contratos_alquiler 
      WHERE NOW() BETWEEN fecha_desde AND fecha_hasta
      ) AS con ON vehiculos.id = con.id_vehiculo;`,
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

export const getVehiculosById = async (req, res) => {
  const { id, fecha } = req.body;
  if (!fecha) {
    try {
      const resultado = await giama_renting.query(
        `SELECT vehiculos.*, (IFNULL(alq.id_vehiculo,0) <> 0) AS vehiculo_alquilado
        FROM vehiculos
        LEFT JOIN 
        (SELECT alquileres.id_vehiculo FROM alquileres WHERE NOW() BETWEEN alquileres.fecha_desde AND alquileres.fecha_hasta)
        AS alq ON vehiculos.id = alq.id_vehiculo
        WHERE id = ?`,
        {
          type: QueryTypes.SELECT,
          replacements: [id],
        }
      );
      return res.send(resultado);
    } catch (error) {
      return res.send(error);
    }
  }
  if (fecha) {
    try {
      const resultado = await giama_renting.query(
        `SELECT vehiculos.*, (IFNULL(alq.id_vehiculo,0) <> 0) AS vehiculo_alquilado, DATEDIFF(?, fecha_ingreso) AS dias_diferencia
        FROM vehiculos
        LEFT JOIN 
        (SELECT alquileres.id_vehiculo FROM alquileres WHERE NOW() BETWEEN alquileres.fecha_desde AND alquileres.fecha_hasta)
        AS alq ON vehiculos.id = alq.id_vehiculo
        WHERE id = ?`,
        {
          type: QueryTypes.SELECT,
          replacements: [fecha, id],
        }
      );
      return res.send(resultado);
    } catch (error) {
      return res.send(error);
    }
  }
};

export const postVehiculo = async (req, res) => {
  /** falta hacer asiento de costo:
   * costo neto e iva (calculado acá) al debe
   * total al haber
   * hacer también asientos secundarios
   */
  const {
    modelo,
    dominio,
    dominio_provisorio,
    nro_chasis,
    nro_motor,
    kilometros,
    dispositivo,
    costo,
    color,
    sucursal,
    nro_factura_compra,
    usuario,
  } = req.body;
  console.log(req.body);
  let cuentaRODN;
  let cuentaRODT;
  let cuentaIC21;
  let cuentaIC22;
  let cuentaRDN2;
  let cuentaRDT2;
  let NroAsiento;
  let NroAsientoSecundario;
  let transaction_giama_renting = await giama_renting.transaction();
  let transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  let insertId;
  let meses_amortizacion;
  const importe_iva = parseFloat(costo) * 0.21; //
  const importe_total = importe_iva + parseFloat(costo);
  if (!dominio && !dominio_provisorio)
    return res.send({
      status: false,
      message: "El vehículo debe tener dominio o dominio provisorio",
    });
  let concepto = `Ingreso del vehiculo - ${
    dominio ? dominio : dominio_provisorio
  }`; //A REVISAR
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "AMRT"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    meses_amortizacion = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "RODN"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaRODN = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "RODT"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaRODT = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
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
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "IC22"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaIC22 = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "RDN2"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaRDN2 = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  try {
    const result = await giama_renting.query(
      `SELECT valor_str FROM parametros WHERE codigo = "RDT2"`,
      {
        type: QueryTypes.SELECT,
      }
    );
    cuentaRDT2 = result[0]["valor_str"];
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al buscar un parámetro" });
  }
  //buscar numeros de asiento y asiento secundario
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
  try {
    const result = await giama_renting.query(
      `INSERT INTO vehiculos (modelo, fecha_ingreso, precio_inicial, dominio, dominio_provisorio, nro_chasis, nro_motor,
        kilometros_iniciales, kilometros_actuales, dispositivo_peaje, meses_amortizacion, color, sucursal, 
        nro_factura_compra, estado_actual, usuario_ultima_modificacion)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          modelo,
          getTodayDate(),
          costo,
          dominio,
          dominio_provisorio,
          nro_chasis,
          nro_motor,
          kilometros,
          kilometros,
          dispositivo,
          meses_amortizacion,
          color,
          sucursal,
          nro_factura_compra,
          1,
          usuario,
        ],
        transaction: transaction_giama_renting,
      }
    );
    insertId = result[0]; // este es el id insertado
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    const { status, body } = handleSqlError(
      error,
      "vehículo",
      "dominio/nro_chasis/nro_motor"
    );
    return res.send(body);
  }
  const files = req.files;
  const folderPath = `giama_renting/vehiculos/${insertId}`;

  for (const file of files) {
    const key = `${folderPath}/${uuidv4()}_${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: "giama-bucket",
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await s3.send(command);
    } catch (err) {
      transaction_giama_renting.rollback();
      console.error("Error al subir imagen:", err);
    }
  }
  //asientos
  try {
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaRODN,
      "D",
      costo, //costo neto vehiculo
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error al generar el asiento contable",
    });
  }
  try {
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaIC21,
      "D",
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
      message: "Error al generar el asiento contable",
    });
  }
  try {
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaRODT,
      "H",
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
      message: "Error al generar el asiento contable",
    });
  }
  //asientos secundarios
  try {
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaRDN2,
      "D",
      costo, //costo neto vehiculo
      concepto,
      transaction_pa7_giama_renting
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    return res.send({
      status: false,
      message: "Error al generar el asiento contable",
    });
  }
  try {
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaIC22,
      "D",
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
      message: "Error al generar el asiento contable",
    });
  }
  try {
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaRDT2,
      "H",
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
      message: "Error al generar el asiento contable",
    });
  }
  transaction_giama_renting.commit();
  transaction_pa7_giama_renting.commit();
  return res.send({
    status: true,
    message: "El vehículo ha sido cargado con éxito",
  });
};

export const getImagenesVehiculos = async (req, res) => {
  const { id } = req.params;
  const prefix = `giama_renting/vehiculos/${id}/`;
  const s3 = new S3Client({
    region: "us-west-2",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  try {
    const command = new ListObjectsV2Command({
      Bucket: "giama-bucket",
      Prefix: prefix,
    });

    const data = await s3.send(command);

    if (!data.Contents) return res.json([]);

    const archivos = await Promise.all(
      data.Contents.map(async (file) => {
        const url = await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: "giama-bucket",
            Key: file.Key,
          }),
          { expiresIn: 3600 }
        ); // 1 hora

        return {
          key: file.Key,
          url,
          lastModified: file.LastModified,
        };
      })
    );

    res.json(archivos);
  } catch (error) {
    console.error("Error al obtener imágenes del vehículo:", error);
    res.status(500).json({ error: "Error al obtener las imágenes" });
  }
};

export const eliminarImagenes = async (req, res) => {
  console.log("Key recibido:", req.body.key);
  const { key } = req.body;

  const params = {
    Bucket: "giama-bucket",
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    return res
      .status(200)
      .json({ status: true, message: "Imagen eliminada con éxito" });
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    return res
      .status(500)
      .json({ status: false, message: "Error al eliminar imagen" });
  }
};

export const updateVehiculo = async (req, res) => {
  const {
    id,
    modelo,
    nro_chasis,
    nro_motor,
    kilometros,
    proveedor_gps,
    nro_serie_gps,
    dispositivo,
    meses_amortizacion,
    color,
    dominio,
    calcomania,
    gnc,
    sucursal,
    estado,
    polarizado,
    cubre_asiento,
    usuario,
  } = req.body;
  console.log(req.body);
  let vehiculoAnterior;
  let fechaDePreparacion;

  try {
    vehiculoAnterior = await giama_renting.query(
      "SELECT * FROM vehiculos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
  } catch (error) {
    return res.send({ status: false, message: "Error al buscar el vehiculo" });
  }

  let preparadoAntes = vehiculoAnterior[0]["estado_actual"] == 2 ? true : false;
  let preparadoAhora = estado == 2 ? true : false;
  if (preparadoAntes && !preparadoAhora) {
    fechaDePreparacion = null;
  } else if (!preparadoAntes && preparadoAhora) {
    fechaDePreparacion = getTodayDate();
  } else {
    fechaDePreparacion = vehiculoAnterior.fecha_preparacion;
  }

  try {
    await giama_renting.query(
      `UPDATE vehiculos SET modelo = ?, dominio = ?, nro_chasis = ?, nro_motor = ?,
        kilometros_actuales = ?, proveedor_gps = ?, nro_serie_gps = ?,
        dispositivo_peaje = ?, meses_amortizacion = ?, color = ?,
        calcomania = ?, gnc = ?, fecha_preparacion = ?, sucursal = ?, estado_actual = ?,
        polarizado = ?, cubre_asiento = ?,
        usuario_ultima_modificacion = ?
        WHERE id = ?`,
      {
        type: QueryTypes.UPDATE,
        replacements: [
          modelo,
          dominio ? dominio : null,
          nro_chasis,
          nro_motor,
          kilometros,
          proveedor_gps ? proveedor_gps : null,
          nro_serie_gps,
          dispositivo,
          meses_amortizacion,
          color,
          calcomania,
          gnc,
          fechaDePreparacion ? fechaDePreparacion : null,
          sucursal,
          estado,
          polarizado,
          cubre_asiento,
          usuario,
          id,
        ],
      }
    );
  } catch (error) {
    console.log(error);
    return res.send({
      status: false,
      message: "Error al actualizar en base de datos",
    });
  }
  return res.send({
    status: true,
    message: "El vehículo ha sido actualizado con éxito",
  });
};

export const getCostosPeriodo = async (req, res) => {
  const { mes, anio, id_vehiculo } = req.body;
  if (!id_vehiculo) {
    return res.send({ status: false, message: "No hay vehículo especificado" });
  }

  if (!mes && !anio) {
    try {
      const result = await giama_renting.query(
        `SELECT costos_ingresos.id_vehiculo, conceptos_costos.nombre, conceptos_costos.id AS id_costo, conceptos_costos.activable,
        costos_ingresos.comprobante, costos_ingresos.fecha,
        costos_ingresos.importe_neto
        FROM costos_ingresos
        LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
        WHERE costos_ingresos.id_vehiculo = ?
        AND conceptos_costos.activable = 0
        ORDER BY 
	      (costos_ingresos.importe_neto < 0),
	      costos_ingresos.importe_neto DESC`,
        {
          type: QueryTypes.SELECT,
          replacements: [id_vehiculo],
        }
      );
      const agrupado = {};

      result.forEach((costo) => {
        const nombre = costo.nombre;
        if (!agrupado[nombre]) agrupado[nombre] = [];
        agrupado[nombre].push(costo);
      });
      console.log(agrupado);
      return res.send(agrupado);
    } catch (error) {
      console.log(error);
      return res.send({
        status: false,
        message: "Hubo un error al obtener la ficha de costos del vehículo",
      });
    }
  } else if (mes && anio) {
    try {
      const result = await giama_renting.query(
        `
        SELECT costos_ingresos.id_vehiculo, conceptos_costos.nombre, conceptos_costos.id AS id_costo, conceptos_costos.activable,
        costos_ingresos.comprobante, costos_ingresos.fecha,
        costos_ingresos.importe_neto
        FROM costos_ingresos
        LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
        WHERE costos_ingresos.id_vehiculo = ?
        AND YEAR(costos_ingresos.fecha) = ? AND MONTH(costos_ingresos.fecha) = ?
        AND conceptos_costos.activable = 0
        ORDER BY 
	      (costos_ingresos.importe_neto < 0),
	      costos_ingresos.importe_neto DESC`,
        {
          type: QueryTypes.SELECT,
          replacements: [id_vehiculo, anio, mes],
        }
      );
      const agrupado = {};

      result.forEach((costo) => {
        const nombre = costo.nombre;
        if (!agrupado[nombre]) agrupado[nombre] = [];
        agrupado[nombre].push(costo);
      });

      return res.send(agrupado);
    } catch (error) {
      console.log(error);
      return res.send({
        status: false,
        message: "Hubo un error al obtener la ficha de costos del vehículo",
      });
    }
  }
};

export const getCostoNetoVehiculo = async (req, res) => {
  const { id_vehiculo, mes, anio } = req.body;

  if (!id_vehiculo) {
    return res.send({ status: false, message: "Falta id del vehículo" });
  }

  let fechaLimite = null;
  if (mes && anio) {
    // Construir último día del mes
    const ultimoDia = new Date(anio, mes, 0); // mes ya es 1-based
    fechaLimite = ultimoDia.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  } else {
    // Si no se especifica periodo, usar hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaLimite = hoy.toISOString().slice(0, 10);
  }

  const query = `
    SELECT
      v.id AS id_vehiculo,
      v.precio_inicial,
      COALESCE(SUM(ci.importe_neto), 0) AS total_costos_activables,
      v.precio_inicial + COALESCE(SUM(ABS(ci.importe_neto)), 0) AS costo_neto_total
    FROM vehiculos v
    LEFT JOIN costos_ingresos ci 
      ON ci.id_vehiculo = v.id
      AND ci.fecha <= ?
    LEFT JOIN conceptos_costos cc 
      ON ci.id_concepto = cc.id
      AND cc.activable = 1
    WHERE v.id = ?
    GROUP BY v.id
  `;

  try {
    const [result] = await giama_renting.query(query, {
      type: QueryTypes.SELECT,
      replacements: [fechaLimite, id_vehiculo],
    });

    return res.send(result || { costo_neto_total: 0 });
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: "Error al calcular el costo neto del vehículo",
    });
  }
};

export const getSituacionFlota = async (req, res) => {
  const { mes, anio } = req.body;

  let fechaLimite = new Date(); // Por defecto, hoy

  if (mes && anio) {
    fechaLimite = new Date(anio, mes, 0); // Último día del mes
  }

  const fechaLimiteSQL = fechaLimite.toISOString().slice(0, 10);

  const query = `
SELECT
  v.id AS id_vehiculo,
  v.fecha_ingreso,
  v.dominio,
  v.dominio_provisorio,
  COUNT(a.id) AS cantidad_alquileres,
  SUM(
    DATEDIFF(
      LEAST(?, a.fecha_hasta),
      GREATEST(v.fecha_ingreso, a.fecha_desde)
    )
  ) AS dias_alquilado,
  DATEDIFF(?, v.fecha_ingreso) AS dias_en_flota,
  ROUND(
    (SUM(
      DATEDIFF(
        LEAST(?, a.fecha_hasta),
        GREATEST(v.fecha_ingreso, a.fecha_desde)
      )
    ) / NULLIF(DATEDIFF(?, v.fecha_ingreso), 0)) * 100,
    2
  ) AS porcentaje_ocupacion
FROM vehiculos v
LEFT JOIN alquileres a ON a.id_vehiculo = v.id
  AND a.fecha_desde <= ?
  AND a.fecha_hasta >= v.fecha_ingreso
GROUP BY v.id, v.fecha_ingreso
  `;

  try {
    const result = await giama_renting.query(query, {
      type: QueryTypes.SELECT,
      replacements: [
        fechaLimiteSQL,
        fechaLimiteSQL,
        fechaLimiteSQL,
        fechaLimiteSQL,
        fechaLimiteSQL,
      ],
    });

    return res.send(result);
  } catch (error) {
    console.error(error);
    return res.send({
      status: false,
      message: "Error al obtener la situación de la flota",
    });
  }
};

export const getAlquileresPeriodo = async (req, res) => {
  const { id_vehiculo, mes, anio } = req.body;

  const inicioMes = new Date(anio, mes - 1, 1);
  const finMes = new Date(anio, mes, 0);

  try {
    const alquileres = await giama_renting.query(
      `
      SELECT a.*, c.nombre, c.apellido
      FROM alquileres a
      JOIN clientes c ON a.id_cliente = c.id
      WHERE a.id_vehiculo = ?
        ${mes && anio ? `AND a.fecha_desde <= ? AND a.fecha_hasta >= ?` : ""}
      `,
      {
        type: QueryTypes.SELECT,
        replacements:
          mes && anio
            ? [
                id_vehiculo,
                finMes.toISOString().split("T")[0],
                inicioMes.toISOString().split("T")[0],
              ]
            : [id_vehiculo],
      }
    );

    if (!mes || !anio) {
      const resultados = alquileres.map((e) => {
        const fechaDesde = normalizarFecha(e.fecha_desde);
        const fechaHasta = normalizarFecha(e.fecha_hasta);
        const diasEnMes = diferenciaDias(fechaDesde, fechaHasta);

        return {
          nombre: e.nombre,
          apellido: e.apellido,
          fecha_desde: e.fecha_desde,
          fecha_hasta: e.fecha_hasta,
          importe_neto: e.importe_neto,
          importe_iva: e.importe_iva,
          dias_en_mes: diasEnMes,
        };
      });

      return res.send({ alquileres: resultados });
    } else {
      const resultados = alquileres.map((alquiler) => {
        const fechaDesde = normalizarFecha(alquiler.fecha_desde);
        const fechaHasta = normalizarFecha(alquiler.fecha_hasta);

        const inicioPeriodo = fechaDesde > inicioMes ? fechaDesde : inicioMes;
        const finPeriodo = fechaHasta < finMes ? fechaHasta : finMes;

        const diasTotales = diferenciaDias(fechaDesde, fechaHasta);
        const diasEnMes = diferenciaDias(inicioPeriodo, finPeriodo);

        const importe_neto = (alquiler.importe_neto / diasTotales) * diasEnMes;
        const importe_iva = (alquiler.importe_iva / diasTotales) * diasEnMes;

        return {
          id_alquiler: alquiler.id_alquiler,
          nombre: alquiler.nombre,
          apellido: alquiler.apellido,
          fecha_desde: alquiler.fecha_desde,
          fecha_hasta: alquiler.fecha_hasta,
          dias_en_mes: diasEnMes,
          importe_neto: importe_neto,
          importe_iva: importe_iva,
        };
      });

      // es si querés mostrarlos en el frontend
      const total = resultados.reduce(
        (acc, curr) => {
          acc.importe_neto_total += curr.importe_neto;
          acc.importe_iva_total += curr.importe_iva;
          return acc;
        },
        { importe_neto_total: 0, importe_iva_total: 0 }
      );

      return res.json({
        alquileres: resultados,
        totales: total, // o simplemente `resultados` si no te interesa este total
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Hubo un error al buscar los alquileres",
    });
  }
};

export const getAllCostosPeriodo = async (req, res) => {
  const { mes, anio } = req.body;
  let arrayAllCostos = [];
  let arrayAllIds = [];
  try {
    let result = await giama_renting.query("SELECT id FROM vehiculos", {
      type: QueryTypes.SELECT,
    });
    arrayAllIds = result;
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al obtener vehiculos" });
  }
  arrayAllIds = arrayAllIds.map((item) => item.id);
  if (!mes && !anio) {
    for (let i = 0; i < arrayAllIds.length; i++) {
      try {
        let result = await giama_renting.query(
          `SELECT costos_ingresos.id_vehiculo, conceptos_costos.nombre, 
        SUM(costos_ingresos.importe_neto)
        FROM costos_ingresos
        LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
        WHERE costos_ingresos.id_vehiculo = ?
        GROUP BY costos_ingresos.id_concepto
        ORDER BY conceptos_costos.ingreso_egreso DESC`,
          {
            type: QueryTypes.SELECT,
            replacements: [arrayAllIds[i]],
          }
        );
        if (result.length === 0) {
          arrayAllCostos.push([
            {
              id_vehiculo: arrayAllIds[i],
            },
          ]);
        } else {
          arrayAllCostos.push(result);
        }
      } catch (error) {
        console.log(error);
        return res.send({
          status: false,
          message: "Hubo un error al obtener la ficha de costos del vehículo",
        });
      }
    }
  } else if (mes && anio) {
    for (let i = 0; i < arrayAllIds.length; i++) {
      try {
        let result = await giama_renting.query(
          `
        SELECT costos_ingresos.id_vehiculo, conceptos_costos.nombre, SUM(costos_ingresos.importe_neto)
        FROM costos_ingresos
        LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
        WHERE costos_ingresos.id_vehiculo = ?
        AND YEAR(costos_ingresos.fecha) = ? AND MONTH(costos_ingresos.fecha) = ?
        GROUP BY costos_ingresos.id_concepto
        ORDER BY conceptos_costos.ingreso_egreso DESC`,
          {
            type: QueryTypes.SELECT,
            replacements: [arrayAllIds[i], anio, mes],
          }
        );
        if (result.length === 0) {
          arrayAllCostos.push([
            {
              id_vehiculo: arrayAllIds[i],
            },
          ]);
        } else {
          arrayAllCostos.push(result);
        }
      } catch (error) {
        console.log(error);
        return res.send({
          status: false,
          message: "Hubo un error al obtener la ficha de costos del vehículo",
        });
      }
    }
  }
  return res.send(arrayAllCostos);
};

export const getAllAlquileresPeriodo = async (req, res) => {
  const { mes, anio } = req.body;

  let arrayAllAlquileres = [];

  let inicioMes = new Date(anio, mes - 1, 1); // Ej: 2025-02-01 si mes=3
  let finMes = new Date(anio, mes, 0); // Ej: 2025-02-28 si mes=3

  let vehiculos = [];

  try {
    vehiculos = await giama_renting.query(
      "SELECT id, dominio, dominio_provisorio FROM vehiculos",
      {
        type: QueryTypes.SELECT,
      }
    );
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al obtener vehículos" });
  }

  if (!mes || !anio) {
    // Sin filtro por mes y año
    for (const vehiculo of vehiculos) {
      try {
        const alquileres = await giama_renting.query(
          `SELECT * FROM alquileres WHERE id_vehiculo = ?`,
          {
            type: QueryTypes.SELECT,
            replacements: [vehiculo.id],
          }
        );

        const normalizados = alquileres.map((e) => {
          const fechaDesde = normalizarFecha(e.fecha_desde);
          const fechaHasta = normalizarFecha(e.fecha_hasta);
          const diasEnMes = diferenciaDias(fechaDesde, fechaHasta);

          return {
            id_vehiculo: vehiculo.id,
            dominio: vehiculo.dominio,
            dominio_provisorio: vehiculo.dominio_provisorio,
            importe_neto: e.importe_neto,
            importe_iva: e.importe_iva,
            dias_en_mes: diasEnMes,
          };
        });

        arrayAllAlquileres.push(
          normalizados.length > 0
            ? normalizados
            : [
                {
                  id_vehiculo: vehiculo.id,
                  dominio: vehiculo.dominio,
                  dominio_provisorio: vehiculo.dominio_provisorio,
                },
              ]
        );
      } catch (error) {
        return res.send({
          status: false,
          message: "Hubo un error al buscar los alquileres",
        });
      }
    }
  } else {
    // Con filtro de mes y año
    for (const vehiculo of vehiculos) {
      try {
        const alquileres = await giama_renting.query(
          `
          SELECT * FROM alquileres
          WHERE id_vehiculo = ?
            AND fecha_desde <= ?
            AND fecha_hasta >= ?
          `,
          {
            type: QueryTypes.SELECT,
            replacements: [
              vehiculo.id,
              finMes.toISOString().split("T")[0],
              inicioMes.toISOString().split("T")[0],
            ],
          }
        );

        const resultados = alquileres.map((alquiler) => {
          const fechaDesde = normalizarFecha(alquiler.fecha_desde);
          const fechaHasta = normalizarFecha(alquiler.fecha_hasta);

          const inicioPeriodo = fechaDesde > inicioMes ? fechaDesde : inicioMes;
          const finPeriodo = fechaHasta < finMes ? fechaHasta : finMes;

          const diasTotales = diferenciaDias(fechaDesde, fechaHasta);
          const diasEnMes = diferenciaDias(inicioPeriodo, finPeriodo);

          const importe_neto =
            (alquiler.importe_neto / diasTotales) * diasEnMes;
          const importe_iva = (alquiler.importe_iva / diasTotales) * diasEnMes;

          return {
            id_vehiculo: vehiculo.id,
            dominio: vehiculo.dominio,
            fecha_desde: alquiler.fecha_desde,
            fecha_hasta: alquiler.fecha_hasta,
            dias_en_mes: diasEnMes,
            importe_neto,
            importe_iva,
          };
        });

        arrayAllAlquileres.push(
          resultados.length > 0
            ? resultados
            : [
                {
                  id_vehiculo: vehiculo.id,
                  dominio: vehiculo.dominio,
                },
              ]
        );
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al obtener alquileres" });
      }
    }
  }

  return res.send(arrayAllAlquileres.flat());
};

export const getAmortizacion = async (req, res) => {
  const { id, fecha } = req.body;
  let precio_inicial;
  let meses_amortizacion;
  let sum_gastos_activables;
  let precio_inicial_total;
  let dias_diferencia;
  let fechaIngreso;
  let result;
  try {
    result = await giama_renting.query(
      `SELECT vehiculos.id, conceptos_costos.nombre, 
        SUM(IFNULL(costos_ingresos.importe_neto,0)) AS importe, vehiculos.precio_inicial, vehiculos.meses_amortizacion,
        DATEDIFF(?, vehiculos.fecha_ingreso) AS dias_diferencia, 
        conceptos_costos.activable
        FROM vehiculos
        LEFT JOIN costos_ingresos ON vehiculos.id = costos_ingresos.id_vehiculo
        LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
        WHERE vehiculos.id = ?
        GROUP BY costos_ingresos.id_concepto
        ORDER BY conceptos_costos.ingreso_egreso DESC`,
      {
        type: QueryTypes.SELECT,
        replacements: [getTodayDate(), id],
      }
    );
    dias_diferencia = result[0]["dias_diferencia"];
    precio_inicial = result[0]["precio_inicial"];
    meses_amortizacion = result[0]["meses_amortizacion"];
    sum_gastos_activables = result.reduce((total, item) => {
      return item.activable === 1 ? total + Math.abs(item.importe) : total;
    }, 0);
    precio_inicial_total = parseFloat(precio_inicial) + sum_gastos_activables;
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
  let meses_amortizacion_anual = 30 * meses_amortizacion;
  return res.send({
    amortizacion: precio_inicial_total / meses_amortizacion,
    amortizacion_todos_movimientos:
      (precio_inicial_total / meses_amortizacion_anual) * dias_diferencia,
  });
};

export const getAllAmortizaciones = async (req, res) => {
  let vehiculos = [];
  let arrayAmortizaciones = [];
  try {
    vehiculos = await giama_renting.query("SELECT id, dominio FROM vehiculos", {
      type: QueryTypes.SELECT,
    });
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: "Error al obtener vehículos" });
  }
  for (const vehiculo of vehiculos) {
    try {
      const amortizacion = await giama_renting.query(
        `SELECT vehiculos.id, conceptos_costos.nombre, 
        SUM(IFNULL(costos_ingresos.importe_neto,0)) AS importe, vehiculos.precio_inicial, vehiculos.meses_amortizacion,
        DATEDIFF(?, vehiculos.fecha_ingreso) AS dias_diferencia, 
        conceptos_costos.activable
        FROM vehiculos
        LEFT JOIN costos_ingresos ON vehiculos.id = costos_ingresos.id_vehiculo
        LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
        WHERE vehiculos.id = ?
        GROUP BY costos_ingresos.id_concepto
        ORDER BY conceptos_costos.ingreso_egreso DESC`,
        {
          type: QueryTypes.SELECT,
          replacements: [getTodayDate(), vehiculo.id],
        }
      );
      if (amortizacion.length) {
        const precio_inicial = amortizacion[0]["precio_inicial"];
        const meses_amortizacion = amortizacion[0]["meses_amortizacion"];
        const sum_gastos_activables = amortizacion.reduce((total, item) => {
          return item.activable === 1 ? total + Math.abs(item.importe) : total;
        }, 0);
        const precio_inicial_total =
          parseFloat(precio_inicial) + sum_gastos_activables;
        const meses_amortizacion_anual = 30 * meses_amortizacion;
        const dias_diferencia = amortizacion[0]["dias_diferencia"];

        arrayAmortizaciones.push({
          id: vehiculo.id,
          amortizacion: precio_inicial_total / meses_amortizacion,
          amortizacion_todos_movimientos:
            (precio_inicial_total / meses_amortizacion_anual) * dias_diferencia,
        });
      } else {
        arrayAmortizaciones.push({
          id: vehiculo.id,
          amortizacion: null,
          amortizacion_todos_movimientos: null,
        });
      }
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
  return res.send(arrayAmortizaciones);
};

export const getFichas = async (req, res) => {
  try {
    const { mes, anio } = req.body;
    const filtroPorPeriodo = mes && anio;

    const fechaInicio = filtroPorPeriodo
      ? moment(`${anio}-${mes.toString().padStart(2, "0")}-01`)
          .startOf("month")
          .format("YYYY-MM-DD")
      : "1900-01-01";

    const fechaFin = filtroPorPeriodo
      ? moment(fechaInicio).endOf("month").format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");

    const conceptos = await giama_renting.query(
      `SELECT nombre FROM conceptos_costos`,
      { type: QueryTypes.SELECT }
    );
    const nombresConceptos = conceptos.map((c) => c.nombre);

    const queryConPeriodo = `
     
  SELECT
  v.id AS vehiculo,
  v.dominio,
  v.fecha_ingreso,
  v.dominio_provisorio,

  -- Alquiler y días prorrateados desde subconsulta
  COALESCE(a.alquiler, 0) AS alquiler,
  COALESCE(a.dias_en_mes, 0) AS dias_en_mes,

  -- Costos activables para amortización
  COALESCE(activos.total_activables, 0) AS total_activables,

  -- Amortización mensual
  ROUND(
    (v.precio_inicial + ROUND(ABS(COALESCE(activos.total_activables, 0)), 2))
    / v.meses_amortizacion
  , 2) AS amortizacion,

  -- Costos detallados (esto puede requerir ajuste también)
  JSON_ARRAYAGG(JSON_OBJECT('nombre', cc.nombre, 'importe', ci.importe_neto)) AS costos_detallados

FROM vehiculos v

-- 🔁 Subconsulta con alquileres prorrateados por vehículo
LEFT JOIN (
  SELECT
    id_vehiculo,
    ROUND(SUM(
      CASE
        WHEN fecha_desde <= :fechaFin AND fecha_hasta >= :fechaInicio THEN
          (importe_neto / (DATEDIFF(fecha_hasta, fecha_desde) + 1)) *
          (DATEDIFF(LEAST(fecha_hasta, :fechaFin), GREATEST(fecha_desde, :fechaInicio)) + 1)
        ELSE 0
      END
    ), 2) AS alquiler,

    SUM(
      CASE
        WHEN fecha_desde <= :fechaFin AND fecha_hasta >= :fechaInicio THEN
          DATEDIFF(LEAST(fecha_hasta, :fechaFin), GREATEST(fecha_desde, :fechaInicio)) + 1
        ELSE 0
      END
    ) AS dias_en_mes

  FROM alquileres
  GROUP BY id_vehiculo
) a ON a.id_vehiculo = v.id

-- Costos e ingresos
LEFT JOIN costos_ingresos ci
  ON ci.id_vehiculo = v.id
  AND ci.fecha BETWEEN :fechaInicio AND :fechaFin

LEFT JOIN conceptos_costos cc ON cc.id = ci.id_concepto

-- Subconsulta de costos activables
LEFT JOIN (
  SELECT ci2.id_vehiculo, SUM(ci2.importe_neto) AS total_activables
  FROM costos_ingresos ci2
  JOIN conceptos_costos cc2 ON cc2.id = ci2.id_concepto AND cc2.activable = 1
  GROUP BY ci2.id_vehiculo
) activos ON activos.id_vehiculo = v.id

GROUP BY v.id, v.dominio, v.dominio_provisorio,
         v.precio_inicial, v.meses_amortizacion,
         a.alquiler, a.dias_en_mes, activos.total_activables;
`;

    const querySinPeriodo = `
      SELECT
        v.id AS vehiculo,
        v.dominio,
        v.fecha_ingreso,
        v.dominio_provisorio,
        COALESCE(a.alquiler, 0) AS alquiler,
        COALESCE(a.dias_en_mes, 0) AS dias_en_mes,
ROUND(
  (
    (v.precio_inicial + ROUND(ABS(COALESCE(activos.total_activables, 0)), 2)) / (v.meses_amortizacion * 30)
  ) * DATEDIFF(CURDATE(), v.fecha_ingreso),
  2
) AS amortizacion,
        JSON_ARRAYAGG(JSON_OBJECT('nombre', cc.nombre, 'importe', ci.importe_neto)) AS costos_detallados
      FROM vehiculos v
      LEFT JOIN (
        SELECT
          id_vehiculo,
          ROUND(SUM(importe_neto), 2) AS alquiler,
          SUM(DATEDIFF(fecha_hasta, fecha_desde) + 1) AS dias_en_mes
        FROM alquileres
        GROUP BY id_vehiculo
      ) a ON a.id_vehiculo = v.id
      LEFT JOIN costos_ingresos ci ON ci.id_vehiculo = v.id
      LEFT JOIN conceptos_costos cc ON cc.id = ci.id_concepto
      LEFT JOIN (
        SELECT ci2.id_vehiculo, SUM(ci2.importe_neto) AS total_activables
        FROM costos_ingresos ci2
        JOIN conceptos_costos cc2 ON cc2.id = ci2.id_concepto AND cc2.activable = 1
        GROUP BY ci2.id_vehiculo
      ) activos ON activos.id_vehiculo = v.id
      GROUP BY v.id, v.dominio, v.dominio_provisorio, v.precio_inicial, v.meses_amortizacion, a.alquiler, a.dias_en_mes, activos.total_activables
    `;

    const selectedQuery = filtroPorPeriodo ? queryConPeriodo : querySinPeriodo;
    const replacements = filtroPorPeriodo ? { fechaInicio, fechaFin } : {};

    const result = await giama_renting.query(selectedQuery, {
      type: QueryTypes.SELECT,
      replacements,
    });

    const fichas = result.map((row) => {
      const costosRaw = Array.isArray(row.costos_detallados)
        ? row.costos_detallados
        : JSON.parse(row.costos_detallados || "[]");

      const costosObj = {};
      for (const nombre of nombresConceptos) {
        costosObj[nombre] = 0;
      }

      for (const item of costosRaw) {
        const nombre = item?.nombre;
        const importe = parseFloat(item?.importe);
        if (nombre && !isNaN(importe)) {
          costosObj[nombre] += importe;
        }
      }

      const alquiler = parseFloat(row.alquiler) || 0;
      const amortizacion = parseFloat(row.amortizacion) || 0;

      const totalCostos = Object.values(costosObj)
        .map((v) => parseFloat(v) || 0)
        .reduce((a, b) => a + b, 0);

      const total = alquiler + totalCostos - amortizacion;

      return {
        vehiculo: row.vehiculo,
        fecha_ingreso: row.fecha_ingreso,
        dominio: row.dominio,
        dominio_provisorio: row.dominio_provisorio,
        alquiler,
        dias_en_mes: parseInt(row.dias_en_mes) || 0,
        ...costosObj,
        amortizacion,
        total: +total.toFixed(2),
      };
    });

    return res.send(fichas);
  } catch (error) {
    console.error("Error en getFichas:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
