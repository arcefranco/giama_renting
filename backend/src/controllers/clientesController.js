import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import { s3 } from "../../helpers/s3Connection.js";
import { v4 as uuidv4 } from "uuid";
import { handleSqlError } from "../../helpers/handleSqlError.js";
import { verificarCamposObligatorios } from "../../helpers/verificarCampoObligatorio.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import {
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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
    resolucion_datero,
    usuario_resolucion_datero,
    //datero_cliente
    composicion_familiar,
    tiene_o_tuvo_vehiculo,
    tipo_servicio,
    certificado_domicilio,
    score_veraz,
    nivel_deuda,
    situacion_deuda,
    libre_de_deuda,
    antecedentes_penales,
    fecha_antecedentes,
    cantidad_viajes_uber,
    cantidad_viajes_cabify,
    cantidad_viajes_didi,
    antiguedad_uber,
    antiguedad_cabify,
    antiguedad_didi,
    trabajos_anteriores,
    observacion_perfil,
  } = req.body;
  const hoy = getTodayDate();
  const camposObligatorios = [
    "tipo_documento",
    "nro_documento",
    "direccion",
    "nro_direccion",
    "codigo_postal",
    "celular",
    "mail",
    "libre_de_deuda",
  ];
  const campoFaltante = verificarCamposObligatorios(
    req.body,
    camposObligatorios
  );

  if (campoFaltante) {
    return res.send({
      status: false,
      message: `Falta completar el campo obligatorio: ${campoFaltante}`,
    });
  }

  const transaction = await giama_renting.transaction();
  let insertId;
  try {
    const result = await giama_renting.query(
      `INSERT INTO clientes (nombre, apellido, razon_social, fecha_nacimiento, nacionalidad, tipo_contribuyente,
        tipo_documento, nro_documento, doc_expedido_por, licencia, lic_expedida_por, fecha_vencimiento_licencia, direccion,
        nro_direccion, piso, depto, codigo_postal, provincia, ciudad, celular, mail, notas, resolucion_datero, fecha_resolucion_datero,
        usuario_resolucion_datero)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
          fecha_vencimiento ? fecha_vencimiento : null,
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
          resolucion_datero,
          hoy,
          usuario_resolucion_datero,
        ],
        transaction: transaction,
      }
    );
    insertId = result[0];
  } catch (error) {
    console.log(error);
    transaction.rollback();
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
      transaction.rollback();
      console.error("Error al subir imagen:", err);
    }
  }
  try {
    await giama_renting.query(
      `INSERT INTO datero_clientes (
    id_cliente,
    composicion_familiar,
    tiene_o_tuvo_vehiculo,
    tipo_servicio,
    certificado_domicilio,
    score_veraz,
    nivel_deuda,
    situacion_deuda,
    libre_de_deuda,
    antecedentes_penales,
    fecha_antecedentes,
    cantidad_viajes_uber,
    cantidad_viajes_cabify,
    cantidad_viajes_didi,
    antiguedad_uber,
    antiguedad_cabify,
    antiguedad_didi,
    trabajos_anteriores,
    observacion_perfil) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      {
        type: QueryTypes.INSERT,
        replacements: [
          insertId,
          composicion_familiar,
          tiene_o_tuvo_vehiculo,
          tipo_servicio,
          certificado_domicilio,
          score_veraz,
          nivel_deuda,
          situacion_deuda,
          libre_de_deuda,
          antecedentes_penales,
          fecha_antecedentes ? fecha_antecedentes : null,
          cantidad_viajes_uber,
          cantidad_viajes_cabify,
          cantidad_viajes_didi,
          antiguedad_uber,
          antiguedad_cabify,
          antiguedad_didi,
          trabajos_anteriores,
          observacion_perfil,
        ],
        transaction: transaction,
      }
    );
  } catch (error) {
    console.log(error);
    transaction.rollback();
    const { status, body } = handleSqlError(
      error,
      "cliente",
      "documento/licencia/direccion/celular"
    );
    return res.send(body);
  }
  transaction.commit();
  return res.send({ status: true, message: "Cliente creado con éxito" });
};

export const updateCliente = async (req, res) => {
  const {
    id,
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
    resolucion_datero,
    usuario_resolucion_datero,
    //datero cliente
    composicion_familiar,
    tiene_o_tuvo_vehiculo,
    tipo_servicio,
    certificado_domicilio,
    score_veraz,
    nivel_deuda,
    situacion_deuda,
    libre_de_deuda,
    antecedentes_penales,
    fecha_antecedentes,
    cantidad_viajes_uber,
    cantidad_viajes_cabify,
    cantidad_viajes_didi,
    antiguedad_uber,
    antiguedad_cabify,
    antiguedad_didi,
    trabajos_anteriores,
    observacion_perfil,
  } = req.body;
  let existeCliente;
  let existeDatero;
  let resolucion_datero_final;
  let fecha_resolucion_datero_final;
  let usuario_resolucion_datero_final;
  const transaction = await giama_renting.transaction();
  const hoy = getTodayDate();
  const camposObligatorios = [
    "tipo_documento",
    "nro_documento",
    "direccion",
    "nro_direccion",
    "codigo_postal",
    "celular",
    "mail",
    "libre_de_deuda",
  ];

  const campoFaltante = verificarCamposObligatorios(
    req.body,
    camposObligatorios
  );

  if (campoFaltante) {
    return res.send({
      status: false,
      message: `Falta completar el campo obligatorio: ${campoFaltante}`,
    });
  }
  try {
    let result = await giama_renting.query(
      `SELECT id, resolucion_datero, fecha_resolucion_datero, 
      usuario_resolucion_datero FROM clientes WHERE id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    existeCliente = result;
  } catch (error) {
    return res.send({
      status: false,
      message: "Error al encontrar el cliente",
    });
  }
  try {
    let result = await giama_renting.query(
      "SELECT id_cliente FROM datero_clientes WHERE id_cliente = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    existeDatero = result;
  } catch (error) {
    return res.send({
      status: false,
      message: "Error al encontrar el cliente",
    });
  }
  console.log(existeCliente);
  if (!existeCliente.length)
    return res.send({ status: false, message: "El cliente no existe" });
  resolucion_datero_final =
    resolucion_datero !== existeCliente[0]["resolucion_datero"]
      ? resolucion_datero
      : existeCliente[0]["resolucion_datero"];
  usuario_resolucion_datero_final =
    usuario_resolucion_datero !== existeCliente[0]["usuario_resolucion_datero"]
      ? usuario_resolucion_datero
      : existeCliente[0]["usuario_resolucion_datero"];
  fecha_resolucion_datero_final =
    existeCliente[0]["fecha_resolucion_datero"] !== hoy
      ? hoy
      : existeCliente[0]["fecha_resolucion_datero"];
  console.log(usuario_resolucion_datero, usuario_resolucion_datero_final);
  try {
    await giama_renting.query(
      `UPDATE clientes SET nombre = ?, apellido = ?, razon_social = ?, fecha_nacimiento = ?, nacionalidad = ?, tipo_contribuyente = ?,
        tipo_documento = ?, nro_documento = ?, doc_expedido_por = ?, licencia = ?, lic_expedida_por = ?, fecha_vencimiento_licencia = ?, direccion = ?,
        nro_direccion = ?, piso = ?, depto = ?, codigo_postal = ?, provincia = ?, ciudad = ?, celular = ?, mail = ?, notas = ?, 
        resolucion_datero = ?, fecha_resolucion_datero = ?, usuario_resolucion_datero = ?
        WHERE id = ?`,
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
          resolucion_datero_final,
          fecha_resolucion_datero_final,
          usuario_resolucion_datero_final,
          id,
        ],
        transaction: transaction,
      }
    );
  } catch (error) {
    transaction.rollback();
    console.log(error);
    const { status, body } = handleSqlError(
      error,
      "cliente",
      "documento/licencia/direccion/celular"
    );
    return res.send(body);
  }
  if (!existeDatero.length) {
    try {
      await giama_renting.query(
        `INSERT INTO datero_clientes (
    id_cliente,
    composicion_familiar,
    tiene_o_tuvo_vehiculo,
    tipo_servicio,
    certificado_domicilio,
    score_veraz,
    nivel_deuda,
    situacion_deuda,
    libre_de_deuda,
    antecedentes_penales,
    fecha_antecedentes,
    cantidad_viajes_uber,
    cantidad_viajes_cabify,
    cantidad_viajes_didi,
    antiguedad_uber,
    antiguedad_cabify,
    antiguedad_didi,
    trabajos_anteriores,
    observacion_perfil) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            id,
            composicion_familiar,
            tiene_o_tuvo_vehiculo,
            tipo_servicio,
            certificado_domicilio,
            score_veraz,
            nivel_deuda,
            situacion_deuda,
            libre_de_deuda,
            antecedentes_penales,
            fecha_antecedentes ? fecha_antecedentes : null,
            cantidad_viajes_uber,
            cantidad_viajes_cabify,
            cantidad_viajes_didi,
            antiguedad_uber,
            antiguedad_cabify,
            antiguedad_didi,
            trabajos_anteriores,
            observacion_perfil,
          ],
          transaction: transaction,
        }
      );
    } catch (error) {
      console.log(error);
      transaction.rollback();
      const { status, body } = handleSqlError(
        error,
        "cliente",
        "documento/licencia/direccion/celular"
      );
      return res.send(body);
    }
  } else {
    try {
      await giama_renting.query(
        `UPDATE datero_clientes SET 
      composicion_familiar = ?,
      tiene_o_tuvo_vehiculo = ?,
      tipo_servicio = ?,
      certificado_domicilio = ?,
      score_veraz = ?,
      nivel_deuda = ?,
      situacion_deuda = ?,
      libre_de_deuda = ?,
      antecedentes_penales = ?,
      fecha_antecedentes = ?,
      cantidad_viajes_uber = ?,
      cantidad_viajes_cabify = ?,
      cantidad_viajes_didi = ?,
      antiguedad_uber = ?,
      antiguedad_cabify = ?,
      antiguedad_didi = ?,
      trabajos_anteriores = ?,
      observacion_perfil = ?
      WHERE id_cliente = ?`,
        {
          type: QueryTypes.INSERT,
          replacements: [
            composicion_familiar,
            tiene_o_tuvo_vehiculo,
            tipo_servicio,
            certificado_domicilio,
            score_veraz,
            nivel_deuda,
            situacion_deuda,
            libre_de_deuda,
            antecedentes_penales,
            fecha_antecedentes ? fecha_antecedentes : null,
            cantidad_viajes_uber,
            cantidad_viajes_cabify,
            cantidad_viajes_didi,
            antiguedad_uber,
            antiguedad_cabify,
            antiguedad_didi,
            trabajos_anteriores,
            observacion_perfil,
            id,
          ],
          transaction: transaction,
        }
      );
    } catch (error) {
      transaction.rollback();
      console.log(error);
      transaction.rollback();
      const { status, body } = handleSqlError(
        error,
        "cliente",
        "documento/licencia/direccion/celular"
      );
      return res.send(body);
    }
  }
  transaction.commit();
  return res.send({
    status: true,
    message: "El cliente ha sido actualizado con éxito",
  });
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

export const getClientesById = async (req, res) => {
  const { id } = req.body;
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM clientes WHERE id = ?",
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

export const getEstadoCliente = async (req, res) => {
  const { id_cliente } = req.body;
  console.log(id_cliente);
  if (!id_cliente || isNaN(id_cliente)) {
    return res.send(-1);
  }
  try {
    let estadoCliente = await giama_renting.query(
      "SELECT resolucion_datero FROM clientes WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_cliente],
      }
    );
    return res.send(estadoCliente[0]["resolucion_datero"]);
  } catch (error) {
    console.log(error);
    return res.send(-1);
  }
};

export const getDateroByIdCliente = async (req, res) => {
  const { id_cliente } = req.body;
  try {
    const resultado = await giama_renting.query(
      "SELECT * FROM datero_clientes WHERE id_cliente = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id_cliente],
      }
    );
    return res.send(resultado);
  } catch (error) {
    return res.send(error);
  }
};

export const getImagenesClientes = async (req, res) => {
  const { id } = req.params;
  const prefix = `giama_renting/clientes/${id}/`;
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
    console.error("Error al obtener imágenes del cliente:", error);
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
