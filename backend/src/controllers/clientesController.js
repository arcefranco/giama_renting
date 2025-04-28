import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import { s3 } from "../../helpers/s3Connection.js";
import { v4 as uuidv4 } from "uuid";
import { handleSqlError } from "../../helpers/handleSqlError.js";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const postCliente = async (req, res) => {
  const {
    nombre,
    apellido,
    razon_social,
    fecha_nacimiento,
    nacionalidad,
    tipo_contribuyente,
    tipo_documento,
    nro_documento,
    doc_expedido_por,
    licencia,
    lic_expedida_por,
    fecha_vencimiento,
    direccion,
    nro_direccion,
    piso,
    depto,
    codigo_postal,
    provincia,
    ciudad,
    celular,
    mail,
    notas,
  } = req.body;
  console.log("BODY: ", req.body);
  let insertId;
  try {
    const result = await giama_renting.query(
      `INSERT INTO clientes (nombre, apellido, razon_social, fecha_nacimiento, nacionalidad, tipo_contribuyente,
        tipo_documento, nro_documento, doc_expedido_por, licencia, lic_expedida_por, fecha_vencimiento_licencia, direccion,
        nro_direccion, piso, depto, codigo_postal, provincia, ciudad, celular, mail, notas)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          nombre,
          apellido,
          razon_social,
          fecha_nacimiento,
          nacionalidad,
          tipo_contribuyente,
          tipo_documento,
          nro_documento,
          doc_expedido_por,
          licencia,
          lic_expedida_por,
          fecha_vencimiento,
          direccion,
          nro_direccion,
          piso,
          depto,
          codigo_postal,
          provincia,
          ciudad,
          celular,
          mail,
          notas,
        ],
      }
    );
    insertId = result[0];
  } catch (error) {
    console.log(error);
    const { status, body } = handleSqlError(
      error,
      "cliente",
      "documento/licencia/direccion/celular"
    );
    return res.send(body);
  }
  const files = req.files;
  const folderPath = `giama_renting/clientes/${insertId}`;

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
  return res.send({ status: true, message: "Cliente creado con éxito" });
};

export const getClientes = async (req, res) => {
  try {
    const resultado = await giama_renting.query("SELECT * FROM clientes", {
      type: QueryTypes.SELECT,
    });
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};
