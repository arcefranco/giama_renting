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

export const getVehiculos = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM vehiculos", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

export const getVehiculosById = async (req, res) => {
  const { id } = req.body;
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM vehiculos WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
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
    meses_amortizacion,
    color,
  } = req.body;
  console.log(req.body);
  let precio_inicial;
  try {
    const result = await giama_renting.query(
      "SELECT precio FROM precios_modelos WHERE modelo = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [modelo],
      }
    );

    precio_inicial = result.length ? result[0].precio : null;
  } catch (error) {
    return res.send(error);
  }

  let insertId;
  try {
    const result = await giama_renting.query(
      `INSERT INTO vehiculos (modelo, fecha_ingreso, precio_inicial, dominio, nro_chasis, nro_motor,
        kilometros_iniciales, dispositivo_peaje, meses_amortizacion, color)
        VALUES (?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          modelo,
          getTodayDate(),
          precio_inicial,
          dominio,
          nro_chasis,
          nro_motor,
          kilometros,
          dispositivo,
          meses_amortizacion,
          color,
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
  } = req.body;
  try {
    await giama_renting.query(
      `UPDATE vehiculos SET modelo = ?, nro_chasis = ?, nro_motor = ?,
        kilometros_iniciales = ?, proveedor_gps = ?, nro_serie_gps = ?, dispositivo_peaje = ?, meses_amortizacion = ?, color = ?,
        calcomania = ?, gnc = ?
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
