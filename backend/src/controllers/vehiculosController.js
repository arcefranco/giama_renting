import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import { s3 } from "../../helpers/s3Connection.js";
import { v4 as uuidv4 } from "uuid";

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
      `SELECT vehiculos.*, (IFNULL(alq.id_vehiculo,0) <> 0) AS vehiculo_alquilado
FROM vehiculos
LEFT JOIN 
(SELECT alquileres.id_vehiculo FROM alquileres WHERE NOW() BETWEEN alquileres.fecha_desde AND alquileres.fecha_hasta)
AS alq ON vehiculos.id = alq.id_vehiculo`,
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
  const {
    modelo,
    dominio,
    nro_chasis,
    nro_motor,
    kilometros,
    dispositivo,
    costo,
    color,
    sucursal,
    nro_factura_compra,
  } = req.body;
  console.log(req.body);
  let insertId;
  let meses_amortizacion;
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
    throw "Error al buscar un parámetro";
  }
  try {
    const result = await giama_renting.query(
      `INSERT INTO vehiculos (modelo, fecha_ingreso, precio_inicial, dominio, nro_chasis, nro_motor,
        kilometros_iniciales, dispositivo_peaje, meses_amortizacion, color, sucursal, nro_factura_compra)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          modelo,
          getTodayDate(),
          costo,
          dominio,
          nro_chasis,
          nro_motor,
          kilometros,
          dispositivo,
          meses_amortizacion,
          color,
          sucursal,
          nro_factura_compra,
        ],
      }
    );
    insertId = result[0]; // este es el id insertado
  } catch (error) {
    console.log(error);
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
      console.error("Error al subir imagen:", err);
    }
  }
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
    calcomania,
    gnc,
    sucursal,
  } = req.body;
  let vehiculoAnterior;
  let fechaDePreparacion;
  const estaPreparado = (vehiculo) => {
    return (
      vehiculo.proveedor_gps !== null &&
      vehiculo.nro_serie_gps !== null &&
      vehiculo.calcomania === 1 &&
      vehiculo.gnc === 1
    );
  };
  const vehiculoNuevo = {
    proveedor_gps: proveedor_gps,
    nro_serie_gps: nro_serie_gps,
    calcomania: calcomania,
    gnc: gnc,
  };

  try {
    vehiculoAnterior = await giama_renting.query(
      "SELECT * FROM vehiculos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
  } catch (error) {
    return res.send({ status: false, message: JSON.stringify(error) });
  }
  const preparadoAntes = estaPreparado(vehiculoAnterior[0]);
  const preparadoAhora = estaPreparado(vehiculoNuevo);
  if (preparadoAntes && !preparadoAhora) {
    fechaDePreparacion = null;
  } else if (!preparadoAntes && preparadoAhora) {
    fechaDePreparacion = getTodayDate();
  } else {
    fechaDePreparacion = vehiculoAnterior.fecha_preparacion;
  }
  try {
    await giama_renting.query(
      `UPDATE vehiculos SET modelo = ?, nro_chasis = ?, nro_motor = ?,
        kilometros_iniciales = ?, proveedor_gps = ?, nro_serie_gps = ?, dispositivo_peaje = ?, meses_amortizacion = ?, color = ?,
        calcomania = ?, gnc = ?, fecha_preparacion = ?, sucursal = ?
        WHERE id = ?`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          modelo,
          nro_chasis,
          nro_motor,
          kilometros,
          proveedor_gps,
          nro_serie_gps,
          dispositivo,
          meses_amortizacion,
          color,
          calcomania,
          gnc,
          fechaDePreparacion,
          sucursal,
          id,
        ],
      }
    );
  } catch (error) {
    console.log(error);
    return res.send({ status: false, message: JSON.stringify(error) });
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
        `SELECT costos_ingresos.id_vehiculo, conceptos_costos.nombre, 
        SUM(costos_ingresos.importe_neto)
        FROM costos_ingresos
        LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
        WHERE costos_ingresos.id_vehiculo = ?
        GROUP BY costos_ingresos.id_concepto
        ORDER BY conceptos_costos.ingreso_egreso DESC`,
        {
          type: QueryTypes.SELECT,
          replacements: [id_vehiculo],
        }
      );
      return res.send(result);
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
        SELECT costos_ingresos.id_vehiculo, conceptos_costos.nombre, SUM(costos_ingresos.importe_neto)
        FROM costos_ingresos
        LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
        WHERE costos_ingresos.id_vehiculo = ?
        AND YEAR(costos_ingresos.fecha) = ? AND MONTH(costos_ingresos.fecha) = ?
        GROUP BY costos_ingresos.id_concepto
        ORDER BY conceptos_costos.ingreso_egreso DESC`,
        {
          type: QueryTypes.SELECT,
          replacements: [id_vehiculo, anio, mes],
        }
      );
      return res.send(result);
    } catch (error) {
      console.log(error);
      return res.send({
        status: false,
        message: "Hubo un error al obtener la ficha de costos del vehículo",
      });
    }
  }
};

export const getAlquileresPeriodo = async (req, res) => {
  const { id_vehiculo, mes, anio } = req.body;
  // Paso 1: Definir rango del mes buscado
  const inicioMes = new Date(anio, mes - 1, 1); // Ej: 2025-02-01 si mes=3
  const finMes = new Date(anio, mes, 0); // Último día del mes, ej: 2025-02-28 si mes=3
  console.log("inicioMes: ", inicioMes);
  console.log("finMes: ", finMes);
  if (!mes || !anio) {
    try {
      const alquileres = await giama_renting.query(
        `
        SELECT * from alquileres WHERE id_vehiculo = ?`,
        {
          type: QueryTypes.SELECT,
          replacements: [id_vehiculo],
        }
      );
      return res.send(
        alquileres.map((e) => {
          const fechaDesde = normalizarFecha(e.fecha_desde);
          const fechaHasta = normalizarFecha(e.fecha_hasta);
          const diasEnMes = diferenciaDias(fechaDesde, fechaHasta);
          return {
            importe_neto: e.importe_neto,
            importe_iva: e.importe_iva,
            dias_en_mes: diasEnMes,
          };
        })
      );
    } catch (error) {
      return res.send({
        status: false,
        message: "Hubo un error al buscar los alquileres",
      });
    }
  } else {
    try {
      // Paso 2: Traer alquileres que se superpongan con el mes buscado
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
            id_vehiculo,
            finMes.toISOString().split("T")[0],
            inicioMes.toISOString().split("T")[0],
          ],
        }
      );

      const resultados = alquileres.map((alquiler) => {
        console.log("alquiler.fecha_desde: ", alquiler.fecha_desde);
        console.log("alquiler.fecha_hasta: ", alquiler.fecha_hasta);
        const fechaDesde = normalizarFecha(alquiler.fecha_desde);
        const fechaHasta = normalizarFecha(alquiler.fecha_hasta);

        console.log("fechaDesde: ", fechaDesde);
        console.log("fechaHasta: ", fechaHasta);

        // Paso 3: Calcular el rango real de intersección con el mes
        const inicioPeriodo = fechaDesde > inicioMes ? fechaDesde : inicioMes;

        const finPeriodo = fechaHasta < finMes ? fechaHasta : finMes;

        console.log("inicioPeriodo: ", inicioPeriodo);
        console.log("finPeriodo: ", finPeriodo);

        const diasTotales = diferenciaDias(fechaDesde, fechaHasta);
        const diasEnMes = diferenciaDias(inicioPeriodo, finPeriodo);

        console.log("diasTotales: ", diasTotales);
        console.log("diasEnMes: ", diasEnMes);

        // Paso 4: Calcular importes proporcionales
        const importe_neto = (alquiler.importe_neto / diasTotales) * diasEnMes;
        const importe_iva = (alquiler.importe_iva / diasTotales) * diasEnMes;

        console.log("importe_neto_mes: ", importe_neto);
        console.log("importe_iva_mes: ", importe_iva);

        return {
          id_alquiler: alquiler.id_alquiler,
          fecha_desde: alquiler.fecha_desde,
          fecha_hasta: alquiler.fecha_hasta,
          dias_en_mes: diasEnMes,
          importe_neto: importe_neto,
          importe_iva: importe_iva,
        };
      });
      const total = resultados.reduce(
        (acc, curr) => {
          acc.importe_neto_total += curr.importe_neto_mes;
          acc.importe_iva_total += curr.importe_iva_mes;
          return acc;
        },
        { importe_neto_total: 0, importe_iva_total: 0 }
      );
      res.json(resultados);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener alquileres" });
    }
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
    vehiculos = await giama_renting.query("SELECT id, dominio FROM vehiculos", {
      type: QueryTypes.SELECT,
    });
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
  let result;
  try {
    result = await giama_renting.query(
      ` SELECT costos_ingresos.id_vehiculo, conceptos_costos.nombre, 
        SUM(costos_ingresos.importe_neto) AS importe, vehiculos.precio_inicial, vehiculos.meses_amortizacion,
        DATEDIFF(?, vehiculos.fecha_ingreso) AS dias_diferencia, 
        conceptos_costos.activable
        FROM costos_ingresos
        LEFT JOIN conceptos_costos ON costos_ingresos.id_concepto = conceptos_costos.id
        LEFT JOIN vehiculos ON costos_ingresos.id_vehiculo = vehiculos.id
        WHERE costos_ingresos.id_vehiculo = ?
        GROUP BY costos_ingresos.id_concepto
        ORDER BY conceptos_costos.ingreso_egreso DESC`,
      {
        type: QueryTypes.SELECT,
        replacements: [getTodayDate(), id],
      }
    );
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
      (precio_inicial_total / meses_amortizacion_anual) *
      result[0]["dias_diferencia"],
  });
};
