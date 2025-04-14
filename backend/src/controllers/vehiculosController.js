import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import { s3 } from "../../helpers/s3Connection.js";
import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";

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
export const postVehiculo = async (req, res) => {
  const {
    modelo,
    dominio,
    nro_chasis,
    nro_motor,
    kilometros,
    proveedor_gps,
    nro_serie_gps,
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
      `INSERT INTO vehiculos (modelo, precio_inicial, dominio, nro_chasis, nro_motor,
        kilometros_iniciales, proveedor_gps, nro_serie_gps, dispositivo_peaje, meses_amortizacion, color)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          modelo,
          precio_inicial,
          dominio,
          nro_chasis,
          nro_motor,
          kilometros,
          proveedor_gps,
          nro_serie_gps,
          dispositivo,
          meses_amortizacion,
          color,
        ],
      }
    );
    insertId = result[0]; // este es el id insertado
  } catch (error) {
    console.log(error);
    return res.send(error);
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
