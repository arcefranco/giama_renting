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
import {
  handleError,
  acciones,
  validateArray,
} from "../../helpers/handleError.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { normalizarFecha } from "../../helpers/normalizarFecha.js";
import { diferenciaDias } from "../../helpers/diferenciaDias.js";
import { getParametro } from "../../helpers/getParametro.js";
import {
  getNumeroAsiento,
  getNumeroAsientoSecundario,
} from "../../helpers/getNumeroAsiento.js";
import { validarCamposObligatorios } from "../../helpers/verificarCampoObligatorio.js";
import { uploadImagesToS3 } from "../../helpers/s3Services.js";
import { movimientosProveedores } from "../../helpers/movimientosProveedores.js";
import { padWithZeros } from "../../helpers/padWithZeros.js";
import * as xlsx from "xlsx";

/*FUNCIONES DEPRECADAS */
/* export const getAllCostosPeriodo = async (req, res) => {
  const { mes, anio } = req.body;
  let arrayAllCostos = [];
  let arrayAllIds = [];
  let result;
  try {
    result = await giama_renting.query("SELECT id FROM vehiculos", {
      type: QueryTypes.SELECT,
    });
    arrayAllIds = result;
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "vehículos", acciones.get);
    return res.send(body);
  }
  const validatorResult = validateArray(result, "vehículos");
  if (validatorResult) {
    return res.send(validatorResult);
  }
  arrayAllIds = arrayAllIds?.map((item) => item.id);
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
        const { body } = handleError(
          error,
          "ficha de costos del vehículo",
          acciones.get
        );
        return res.send(body);
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
        const { body } = handleError(
          error,
          "ficha de costos del vehículo",
          acciones.get
        );
        return res.send(body);
      }
    }
  }
  return res.send(arrayAllCostos);
}; */
/* export const getAllAlquileresPeriodo = async (req, res) => {
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
  const validatorResult = validateArray(vehiculos, "vehículos");
  if (validatorResult) {
    return res.send(validatorResult);
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
        const validatorResult = validateArray(alquileres, "alquileres");
        if (validatorResult) {
          return res.send(validatorResult);
        }
        const normalizados = alquileres?.map((e) => {
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
        const { body } = handleError(error, "alquileres", acciones.get);
        return res.send(body);
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
        const validatorResult = validateArray(alquileres, "alquileres");
        if (validatorResult) {
          return res.send(validatorResult);
        }
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
        const { body } = handleError(error, "alquileres", acciones.get);
        return res.send(body);
      }
    }
  }

  return res.send(arrayAllAlquileres.flat());
}; */
/* export const getAllAmortizaciones = async (req, res) => {
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
        DATEDIFF(?, vehiculos.fecha_preparacion) AS dias_diferencia, 
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
      const { body } = handleError(
        error,
        "amortizaciones de los vehículos",
        acciones.get
      );
      return res.send(body);
    }
  }
  return res.send(arrayAmortizaciones);
}; */

/* FUNCION AUXILIAR */
export const insertVehiculo = async (req) => {
  const {
    modelo,
    nro_chasis,
    nro_motor,
    kilometros,
    costo,
    color,
    sucursal,
    numero_comprobante_1,
    numero_comprobante_2,
    usuario,
    proveedor_vehiculo,
    transaction_1,
    transaction_2,
    importacion_masiva,
    meses_amortizacion_masiva,
  } = req.body;
  let cuentaRODN;
  let cuentaRDN2;
  let cuentaIC21;
  let cuentaIC22;
  let NroAsiento;
  let NroAsientoSecundario;
  let transaction_giama_renting;
  let transaction_pa7_giama_renting;
  let es_importacion_masiva;
  let meses_amortizacion_final;
  if (!importacion_masiva) {
    es_importacion_masiva = false;
  } else {
    es_importacion_masiva = true;
  }

  if (!transaction_1 || !transaction_2) {
    transaction_giama_renting = await giama_renting.transaction();
    transaction_pa7_giama_renting = await pa7_giama_renting.transaction();
  } else {
    transaction_giama_renting = transaction_1;
    transaction_pa7_giama_renting = transaction_2;
  }
  let insertId;
  let meses_amortizacion;
  let numero_comprobante = `${padWithZeros(
    numero_comprobante_1,
    5
  )}${padWithZeros(numero_comprobante_2, 8)}`;
  const camposObligatorios = ["modelo", "costo", "sucursal"];
  const mensajeError = validarCamposObligatorios(
    req.body,
    camposObligatorios,
    "vehículo"
  );
  console.log(mensajeError);
  if (mensajeError) {
    return { status: false, message: mensajeError };
  }
  const importe_neto = costo / 1.21;
  const importe_iva = costo - importe_neto;
  try {
    meses_amortizacion = await getParametro("AMRT");
    cuentaRODN = await getParametro("RODN");
    cuentaIC21 = await getParametro("IC21");
    cuentaIC22 = await getParametro("IC22");
    cuentaRDN2 = await getParametro("RDN2");
  } catch (error) {
    const { body } = handleError(error, "parámetro");
    return body;
  }
  if (es_importacion_masiva) {
    meses_amortizacion_final = meses_amortizacion_masiva;
  } else {
    meses_amortizacion_final = meses_amortizacion;
  }
  //buscar numeros de asiento y asiento secundario
  try {
    NroAsiento = await getNumeroAsiento();
    NroAsientoSecundario = await getNumeroAsientoSecundario();
  } catch (error) {
    const { body } = handleError(error, "número de asiento");
    return body;
  }
  try {
    const result = await giama_renting.query(
      `INSERT INTO vehiculos (modelo, fecha_ingreso, 
        precio_inicial, nro_chasis, nro_motor,
        kilometros_iniciales, kilometros_actuales, meses_amortizacion, color, sucursal, 
        nro_factura_compra, estado_actual, usuario_ultima_modificacion)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          modelo,
          getTodayDate(),
          costo,
          nro_chasis,
          nro_motor,
          kilometros,
          kilometros,
          meses_amortizacion_final,
          color,
          sucursal,
          numero_comprobante,
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
    const { body } = handleError(error, "vehículo", acciones.post);
    return body;
  }
  let concepto = `Ingreso de vehículo. ID: ${insertId}`;
  if (!es_importacion_masiva) {
    //ingreso imagenes
    const files = req.files;
    if (!Array.isArray(files))
      return {
        status: false,
        message: "Error al cargar archivos de imágenes",
      };
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
        return {
          status: false,
          message: "Error al guardar las imágenes del vehículo",
        };
      }
    }
  }
  //movimiento proveedores
  try {
    await movimientosProveedores({
      cod_proveedor: proveedor_vehiculo,
      tipo_comprobante: 1,
      numero_comprobante_1,
      numero_comprobante_2,
      importe_neto: importe_neto,
      importe_iva: importe_iva,
      importe_total: costo,
      cuenta_concepto: cuentaRODN,
      NroAsiento,
      NroAsientoSecundario,
      usuario: usuario,
      transaction_asientos: transaction_pa7_giama_renting,
    });
  } catch (error) {
    transaction_giama_renting.rollback();
    const { body } = handleError(
      error,
      "Movimientos proveedores",
      acciones.post
    );
    return body;
  }
  //asientos
  try {
    //asientos
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaRODN,
      "D",
      importe_neto, //costo neto vehiculo
      concepto,
      transaction_pa7_giama_renting,
      numero_comprobante,
      getTodayDate(),
      NroAsientoSecundario,
      1
    );
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      cuentaIC21,
      "D",
      importe_iva,
      concepto,
      transaction_pa7_giama_renting,
      numero_comprobante,
      getTodayDate(),
      NroAsientoSecundario,
      1
    );
    await asientoContable(
      "c_movimientos",
      NroAsiento,
      "210110" /* FCA - Deuda autos */,
      "H",
      costo,
      concepto,
      transaction_pa7_giama_renting,
      numero_comprobante,
      getTodayDate(),
      NroAsientoSecundario,
      1
    );
    //asientos secundarios
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaRDN2,
      "D",
      importe_neto,
      concepto,
      transaction_pa7_giama_renting,
      numero_comprobante,
      getTodayDate(),
      null,
      1
    );
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      cuentaIC22,
      "D",
      importe_iva,
      concepto,
      transaction_pa7_giama_renting,
      numero_comprobante,
      getTodayDate(),
      null,
      1
    );
    await asientoContable(
      "c2_movimientos",
      NroAsientoSecundario,
      "210110" /**nueva cuenta */,
      "H",
      costo,
      concepto,
      transaction_pa7_giama_renting,
      numero_comprobante,
      getTodayDate(),
      null,
      1
    );
  } catch (error) {
    console.log(error);
    transaction_giama_renting.rollback();
    transaction_pa7_giama_renting.rollback();
    const { body } = handleError(error);
    return body;
  }
  if (!es_importacion_masiva) {
    transaction_giama_renting.commit();
    transaction_pa7_giama_renting.commit();
  }
  return {
    status: true,
    message: "El vehículo ha sido cargado con éxito",
  };
};

export const getVehiculos = async (req, res) => {
  const hoy = getTodayDate();
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
      WHERE ? BETWEEN fecha_desde AND fecha_hasta
      ) AS alq ON vehiculos.id = alq.id_vehiculo
      LEFT JOIN (
      SELECT id_vehiculo 
      FROM contratos_alquiler 
      WHERE ? BETWEEN fecha_desde AND fecha_hasta
      ) AS con ON vehiculos.id = con.id_vehiculo;`,
      {
        type: QueryTypes.SELECT,
        replacements: [hoy, hoy],
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "vehículos", acciones.get);
    return res.send(body);
  }
};

export const getVehiculosById = async (req, res) => {
  const { id, fecha } = req.body;
  const hoy = getTodayDate();
  if (!fecha) {
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
     WHERE ? BETWEEN fecha_desde AND fecha_hasta
   ) AS alq ON vehiculos.id = alq.id_vehiculo
   LEFT JOIN (
     SELECT id_vehiculo 
     FROM contratos_alquiler 
     WHERE ? BETWEEN fecha_desde AND fecha_hasta
   ) AS con ON vehiculos.id = con.id_vehiculo
   WHERE vehiculos.id = ?`,
        {
          type: QueryTypes.SELECT,
          replacements: [hoy, hoy, id],
        }
      );
      return res.send(resultado);
    } catch (error) {
      const { body } = handleError(error, "vehículos", acciones.get);
      return res.send(body);
    }
  }
  if (fecha) {
    try {
      const resultado = await giama_renting.query(
        `SELECT 
      vehiculos.*, 
      (IFNULL(alq.id_vehiculo, 0) <> 0) AS vehiculo_alquilado,
      (IFNULL(con.id_vehiculo, 0) <> 0) AS vehiculo_reservado,
      DATEDIFF(?, fecha_ingreso) AS dias_diferencia,
      DATEDIFF(?, fecha_inicio_amortizacion) AS dias_diferencia_amortizacion
   FROM vehiculos
   LEFT JOIN (
     SELECT id_vehiculo 
     FROM alquileres 
     WHERE ? BETWEEN fecha_desde AND fecha_hasta
   ) AS alq ON vehiculos.id = alq.id_vehiculo
   LEFT JOIN (
     SELECT id_vehiculo 
     FROM contratos_alquiler 
     WHERE ? BETWEEN fecha_desde AND fecha_hasta
   ) AS con ON vehiculos.id = con.id_vehiculo
   WHERE vehiculos.id = ?`,
        {
          type: QueryTypes.SELECT,
          replacements: [fecha, hoy, hoy, hoy, id],
        }
      );
      return res.send(resultado);
    } catch (error) {
      const { body } = handleError(error, "vehículos", acciones.get);
      return res.send(body);
    }
  }
};

export const postVehiculo = async (req, res) => {
  try {
    const result = await insertVehiculo(req);
    return res.send(result);
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
};

export const postImagenesVehiculo = async (req, res) => {
  try {
    const { id } = req.body;
    const files = req.files;

    const uploadResult = await uploadImagesToS3(
      files,
      `giama_renting/vehiculos/${id}`
    );

    return res.send(uploadResult);
  } catch (error) {
    console.error(error);
    return res.send({ status: false, message: "Error al subir imágenes" });
  }
};

export const getImagenesVehiculos = async (req, res) => {
  const { id } = req.body;
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
    return res.send({
      status: false,
      message: "Error al obtener imágenes del vehículo",
    });
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

    return res.send({ status: true, message: "Imagen eliminada con éxito" });
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    return res.send({ status: false, message: "Error al eliminar imagen" });
  }
};

export const updateVehiculo = async (req, res) => {
  const {
    id,
    modelo,
    nro_chasis,
    fecha_inicio_amortizacion,
    nro_motor,
    kilometros,
    proveedor_gps,
    nro_serie_gps,
    dispositivo,
    meses_amortizacion,
    color,
    dominio,
    dominio_provisorio,
    calcomania,
    gnc,
    sucursal,
    estado,
    polarizado,
    cubre_asiento,
    usuario,
  } = req.body;
  let vehiculoAnterior;
  let fechaDePreparacion;
  let fechaDeAmortizacion;

  try {
    vehiculoAnterior = await giama_renting.query(
      "SELECT * FROM vehiculos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
  } catch (error) {
    const { body } = handleError(error, "vehículo", acciones.get);
    return res.send(body);
  }
  const validationVehiculoAnterior = validateArray(
    vehiculoAnterior,
    "vehiculos"
  );
  if (validationVehiculoAnterior) {
    return res.send(validationVehiculoAnterior);
  }

  let preparadoAhora =
    estado == 2 && vehiculoAnterior[0]["estado_actual"] == 1 ? true : false;

  if (!vehiculoAnterior[0]["fecha_preparacion"] && preparadoAhora) {
    fechaDePreparacion = getTodayDate();
  } else {
    fechaDePreparacion = vehiculoAnterior[0]["fecha_preparacion"];
  }

  if (
    !vehiculoAnterior[0]["fecha_inicio_amortizacion"] &&
    fecha_inicio_amortizacion
  ) {
    fechaDeAmortizacion = fecha_inicio_amortizacion;
  } else if (vehiculoAnterior[0]["fecha_inicio_amortizacion"]) {
    fechaDeAmortizacion = vehiculoAnterior[0]["fecha_inicio_amortizacion"];
  } else {
    fechaDeAmortizacion = null;
  }

  try {
    await giama_renting.query(
      `UPDATE vehiculos SET modelo = :modelo, dominio = :dominio, dominio_provisorio = :dominio_provisorio, nro_chasis = :nro_chasis, nro_motor = :nro_motor,
        kilometros_actuales = :kilometros, proveedor_gps = :proveedor_gps, nro_serie_gps = :nro_serie_gps,
        dispositivo_peaje = :dispositivo, meses_amortizacion = :meses_amortizacion, color = :color,
        calcomania = :calcomania, gnc = :gnc, fecha_preparacion = :fechaDePreparacion, 
        fecha_inicio_amortizacion = :fechaDeAmortizacion, sucursal = :sucursal, estado_actual = :estado,
        polarizado = :polarizado, cubre_asiento = :cubre_asiento,
        usuario_ultima_modificacion = :usuario
        WHERE id = :id`,
      {
        type: QueryTypes.UPDATE,
        replacements: {
          modelo,
          dominio: dominio ? dominio : null,
          dominio_provisorio: dominio_provisorio ? dominio_provisorio : null,
          nro_chasis,
          nro_motor,
          kilometros,
          proveedor_gps: proveedor_gps ? proveedor_gps : null,
          nro_serie_gps: nro_serie_gps ? nro_serie_gps : null,
          dispositivo: dispositivo ? dispositivo : null,
          meses_amortizacion,
          color,
          calcomania,
          gnc,
          fechaDePreparacion,
          fechaDeAmortizacion,
          sucursal,
          estado,
          polarizado,
          cubre_asiento,
          usuario,
          id,
        },
      }
    );
  } catch (error) {
    const { body } = handleError(error, "vehículo", acciones.update);
    return res.send(body);
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
      const validatorResult = validateArray(result, "costos");
      if (validatorResult) {
        return res.send(validatorResult);
      }
      result?.forEach((costo) => {
        const nombre = costo.nombre;
        if (!agrupado[nombre]) agrupado[nombre] = [];
        agrupado[nombre].push(costo);
      });
      return res.send(agrupado);
    } catch (error) {
      console.log(error);
      const { body } = handleError(error, "ficha del vehículo", acciones.get);
      return res.send(body);
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
      if (!result.length) {
        return res.send({});
      }
      result?.forEach((costo) => {
        const nombre = costo.nombre;
        if (!agrupado[nombre]) agrupado[nombre] = [];
        agrupado[nombre].push(costo);
      });

      return res.send(agrupado);
    } catch (error) {
      console.log(error);
      const { body } = handleError(error, "ficha del vehículo", acciones.get);
      return res.send(body);
    }
  }
};

export const getCostoNetoVehiculo = async (req, res) => {
  const { id_vehiculo, mes, anio } = req.body;

  if (!id_vehiculo) {
    return res.send({ status: false, message: "Falta id del vehículo" });
  }
  let precio_inicial;
  let sum_gastos_activables;
  let precio_inicial_total;
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
      cc.activable,
      COALESCE(SUM(ci.importe_neto), 0) AS importe_neto
    FROM vehiculos v
    LEFT JOIN costos_ingresos ci 
      ON ci.id_vehiculo = v.id
      AND ci.fecha <= ?
    LEFT JOIN conceptos_costos cc 
      ON ci.id_concepto = cc.id
    WHERE v.id = ?
    AND cc.activable = 1
    GROUP BY ci.id;
  `;

  try {
    const result = await giama_renting.query(query, {
      type: QueryTypes.SELECT,
      replacements: [fechaLimite, id_vehiculo],
    });
    if (!result.length) {
      return res.send({ costo_neto_total: 0 });
    }
    precio_inicial = result[0]["precio_inicial"];
    sum_gastos_activables = result.reduce((total, item) => {
      return item.activable === 1 ? total + Math.abs(item.importe_neto) : total;
    }, 0);
    precio_inicial_total = parseFloat(precio_inicial) + sum_gastos_activables;
    return res.send({
      costo_neto_total: precio_inicial_total,
    });
  } catch (error) {
    console.error(error);
    const { body } = handleError(
      error,
      "costo neto del vehículo",
      acciones.get
    );
    return res.send(body);
  }
};

export const getAlquileresPeriodo = async (req, res) => {
  const { id_vehiculo, mes, anio } = req.body;
  console.log(req.body);
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
    const validatorResult = validateArray(alquileres, "alquileres");
    if (validatorResult) {
      return res.send([]);
    }
    if (!mes || !anio) {
      const resultados = alquileres?.map((e) => {
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

      return res.send(resultados);
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

      const total = resultados?.reduce(
        (acc, curr) => {
          acc.importe_neto_total += curr.importe_neto;
          acc.importe_iva_total += curr.importe_iva;
          return acc;
        },
        { importe_neto_total: 0, importe_iva_total: 0 }
      );
      console.log(resultados);
      return res.send(resultados);
    }
  } catch (error) {
    console.error(error);
    const { body } = handleError(error, "alquileres", acciones.get);
    return res.send(body);
  }
};

export const getSituacionFlota = async (req, res) => {
  const hoy = getTodayDate();

  try {
    // Traer todos los estados definidos en la tabla
    const estadosDB = await giama_renting.query(
      "SELECT nombre FROM estados_vehiculos",
      { type: QueryTypes.SELECT }
    );

    const ESTADOS_ESTATICOS = estadosDB.map((e) => e.nombre);

    const resultado = await giama_renting.query(
      `SELECT 
        COALESCE(
          CASE 
            WHEN v.fecha_venta IS NOT NULL THEN 'vendidos'
            WHEN alq.id_vehiculo IS NOT NULL THEN 'alquilados'
            WHEN con.id_vehiculo IS NOT NULL THEN 'reservados'
            ELSE est.nombre
          END,
          'Sin estado'
        ) AS estado,
        COUNT(*) AS cantidad
      FROM vehiculos v
      LEFT JOIN estados_vehiculos est ON est.id = v.estado_actual
      LEFT JOIN (
        SELECT id_vehiculo 
        FROM alquileres 
        WHERE :hoy BETWEEN fecha_desde AND fecha_hasta
      ) alq ON alq.id_vehiculo = v.id
      LEFT JOIN (
        SELECT id_vehiculo 
        FROM contratos_alquiler 
        WHERE :hoy BETWEEN fecha_desde AND fecha_hasta
      ) con ON con.id_vehiculo = v.id
      GROUP BY estado`,
      {
        replacements: { hoy },
        type: QueryTypes.SELECT,
      }
    );
    const validatorResult = validateArray(
      resultado,
      "estados de los vehículos"
    );
    if (validatorResult) {
      return res.send(validatorResult);
    }

    const resumen = {
      alquilados: 0,
      reservados: 0,
      vendidos: 0,
    };

    // Agregar estados desde tabla (estáticos)
    for (const nombre of ESTADOS_ESTATICOS) {
      resumen[nombre] = 0;
    }

    // Completar con datos reales
    resultado?.forEach((row) => {
      resumen[row.estado] = row.cantidad;
    });

    // Calcular total
    resumen.total = Object.entries(resumen)
      .filter(([estado]) => estado !== "vendidos" && estado !== "total")
      .reduce((acum, [, cantidad]) => acum + cantidad, 0);

    return res.send(resumen);
  } catch (error) {
    console.log(error);
    const { body } = handleError(
      error,
      "estados de los vehículos",
      acciones.get
    );
    return res.send(body);
  }
};

export const getAmortizacion = async (req, res) => {
  const { id_vehiculo, mes, anio } = req.body;
  let precio_inicial;
  let meses_amortizacion;
  let sum_gastos_activables;
  let precio_inicial_total;
  let result;
  let dias_totales_amortizacion;
  let dias_transcurridos_amortizacion;
  let amortizacion;
  try {
    result = await giama_renting.query(
      `SELECT 
  vehiculos.id, 
  conceptos_costos.nombre, 
  vehiculos.fecha_inicio_amortizacion,
  SUM(IFNULL(costos_ingresos.importe_neto, 0)) AS importe, 
  vehiculos.precio_inicial, 
  vehiculos.meses_amortizacion,
  DATEDIFF(?, vehiculos.fecha_inicio_amortizacion) AS dias_diferencia, 
  DATEDIFF(
    LAST_DAY(vehiculos.fecha_inicio_amortizacion), 
    vehiculos.fecha_inicio_amortizacion
  ) + 1 AS dias_diferencia_mes_amortizacion,
  DATEDIFF(
    LAST_DAY(vehiculos.fecha_inicio_amortizacion), 
    DATE_FORMAT(vehiculos.fecha_inicio_amortizacion, '%Y-%m-01')
  ) + 1 AS dias_totales_mes_amortizacion,
  DATE_ADD(
    vehiculos.fecha_inicio_amortizacion, 
    INTERVAL vehiculos.meses_amortizacion MONTH
  ) AS fecha_final_amortizacion,
  DATEDIFF(
    DATE_ADD(vehiculos.fecha_inicio_amortizacion, INTERVAL vehiculos.meses_amortizacion MONTH), 
    vehiculos.fecha_inicio_amortizacion
  ) AS dias_totales_amortizacion,
  DATEDIFF(?, vehiculos.fecha_inicio_amortizacion) AS dias_transcurridos_amortizacion,
  conceptos_costos.activable
  FROM vehiculos
  LEFT JOIN costos_ingresos ON vehiculos.id = costos_ingresos.id_vehiculo
  LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
  WHERE vehiculos.id = ?
GROUP BY costos_ingresos.id_concepto
ORDER BY conceptos_costos.ingreso_egreso DESC;`,
      {
        type: QueryTypes.SELECT,
        replacements: [getTodayDate(), getTodayDate(), id_vehiculo],
      }
    );
    const validatorResult = validateArray(result, "amortización");
    if (validatorResult) {
      return res.send(validatorResult);
    }
    if (!result[0]["dias_diferencia"]) {
      return res.send({
        amortizacion: 0,
        amortizacion_todos_movimientos: 0,
      });
    }

    precio_inicial = result[0]["precio_inicial"];
    meses_amortizacion = result[0]["meses_amortizacion"];
    sum_gastos_activables = result.reduce((total, item) => {
      return item.activable === 1 ? total + Math.abs(item.importe) : total;
    }, 0);
    precio_inicial_total = parseFloat(precio_inicial) + sum_gastos_activables;
    dias_totales_amortizacion = result[0]["dias_totales_amortizacion"];
    dias_transcurridos_amortizacion =
      result[0]["dias_transcurridos_amortizacion"];

    let mesAmortizacion = result[0]["fecha_inicio_amortizacion"]
      ? parseInt(result[0]["fecha_inicio_amortizacion"].split("-")[1])
      : null;
    let anioAmortizacion = result[0]["fecha_inicio_amortizacion"]
      ? parseInt(result[0]["fecha_inicio_amortizacion"].split("-")[0])
      : null;

    if (mes < mesAmortizacion && anio <= anioAmortizacion) {
      //si el mes/anio que se busca es menor al mes/anio amrt, amrt es 0
      amortizacion = 0;
    } else if (mes == mesAmortizacion && anio == anioAmortizacion) {
      amortizacion =
        (precio_inicial_total / result[0]["dias_totales_amortizacion"]) *
        result[0]["dias_diferencia_mes_amortizacion"];
    } else if (
      (mes >= mesAmortizacion && anio >= anioAmortizacion) ||
      (!mes && !anio)
    ) {
      amortizacion = precio_inicial_total / meses_amortizacion;
    }
  } catch (error) {
    console.log(error);
    const { body } = handleError(
      error,
      "amortización del vehículo",
      acciones.get
    );
    return res.send(body);
  }

  console.log(
    precio_inicial_total,
    dias_totales_amortizacion,
    dias_transcurridos_amortizacion
  );

  return res.send({
    amortizacion: amortizacion,
    amortizacion_todos_movimientos:
      (precio_inicial_total / dias_totales_amortizacion) *
      dias_transcurridos_amortizacion,
  });
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
    console.log(fechaInicio, fechaFin);
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
  v.fecha_inicio_amortizacion,
  v.fecha_preparacion,
  v.dominio_provisorio,

  -- Alquiler y días prorrateados desde subconsulta
  COALESCE(a.alquiler, 0) AS alquiler,
  COALESCE(a.dias_en_mes, 0) AS dias_en_mes,

  -- Costos activables para amortización
  COALESCE(activos.total_activables, 0) AS total_activables,

 -- Amortización mensual
CASE
  -- CASO 1: periodo anterior al inicio de amortización → 0
  WHEN :fechaFin < v.fecha_inicio_amortizacion OR v.fecha_inicio_amortizacion IS NULL THEN 0

  -- CASO 2: periodo incluye el mes de inicio de amortización → cálculo proporcional
  WHEN :fechaInicio <= v.fecha_inicio_amortizacion AND :fechaFin >= v.fecha_inicio_amortizacion THEN
    ROUND(
      (
        (v.precio_inicial + ROUND(ABS(COALESCE(activos.total_activables, 0)), 2)) /
        DATEDIFF(
        DATE_ADD(v.fecha_inicio_amortizacion, INTERVAL v.meses_amortizacion MONTH), 
        v.fecha_inicio_amortizacion
        )
      )
      * (DATEDIFF(:fechaFin, v.fecha_inicio_amortizacion) + 1),
      2
    )

  -- CASO 3: periodo posterior al inicio de amortización → amortización completa
  ELSE
    ROUND(
      (v.precio_inicial + ROUND(ABS(COALESCE(activos.total_activables, 0)), 2)) / v.meses_amortizacion,
      2
    )
END AS amortizacion,

  -- Costos detallados 
  JSON_ARRAYAGG(JSON_OBJECT('nombre', cc.nombre, 'importe', ci.importe_neto)) AS costos_detallados

FROM vehiculos v
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

LEFT JOIN conceptos_costos cc ON cc.id = ci.id_concepto AND (cc.activable = 0 OR cc.activable IS NULL)

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
        v.fecha_preparacion,
        v.fecha_inicio_amortizacion,
        v.dominio_provisorio,
        COALESCE(a.alquiler, 0) AS alquiler,
        COALESCE(a.dias_en_mes, 0) AS dias_en_mes,
ROUND(
  (
    (v.precio_inicial + ROUND(ABS(COALESCE(activos.total_activables, 0)), 2)) /
    DATEDIFF(DATE_ADD(v.fecha_inicio_amortizacion, INTERVAL v.meses_amortizacion MONTH), v.fecha_inicio_amortizacion)
  ) * DATEDIFF(CURDATE(), v.fecha_inicio_amortizacion),
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
LEFT JOIN conceptos_costos cc ON cc.id = ci.id_concepto AND (cc.activable = 0 OR cc.activable IS NULL)
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
    const validatorResult = validateArray(result, "fichas");
    if (validatorResult) {
      return res.send(validatorResult);
    }
    const fichas = result?.map((row) => {
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
        fecha_preparacion: row.fecha_preparacion,
        fecha_ingreso: row.fecha_ingreso,
        fecha_inicio_amortizacion: row.fecha_inicio_amortizacion,
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
    const { body } = handleError(
      error,
      "fichas de los vehículos",
      acciones.get
    );
    return res.send(body);
  }
};

export const postVehiculosMasivos = async (req, res) => {
  try {
    if (!req.file) {
      return res.send({
        status: false,
        message: "Debe subir un archivo Excel",
      });
    }
    const usuario = req.body.usuario; // viene del formData del front
    console.log(usuario);

    // leer excel
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const transaction_1 = await giama_renting.transaction();
    const transaction_2 = await pa7_giama_renting.transaction();
    // recorrer filas y llamar a insertVehiculo
    for (let row of data) {
      const vehiculo = {
        modelo: row.modelo,
        nro_chasis: row.nro_chasis,
        nro_motor: row.nro_motor,
        kilometros: row.km_iniciales,
        costo: row.precio_inicial,
        color: row.color,
        sucursal: row.sucursal,
        numero_comprobante_1: row.punto_de_venta,
        numero_comprobante_2: row.nro_comprobante,
        proveedor_vehiculo: row.proveedor_vehiculo,
        meses_amortizacion_masiva: row.meses_amortizacion,
        transaction_1: transaction_1,
        transaction_2: transaction_2,
        importacion_masiva: true,
        usuario,
      };
      console.log(vehiculo);
      const result = await insertVehiculo({ body: vehiculo });

      if (!result.status) {
        return res.send({
          status: false,
          message: `Error al insertar vehículo: ${result.message}`,
        });
      }
    }
    transaction_1.commit();
    transaction_2.commit();
    return res.send({
      status: true,
      message: `${data.length} vehículos cargados correctamente`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "Error al procesar archivo",
    });
  }
};
