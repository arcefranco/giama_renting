import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import { s3 } from "../../helpers/s3Connection.js";
import { v4 as uuidv4 } from "uuid";
import { acciones, handleError } from "../../helpers/handleError.js";
import { validarCamposObligatorios } from "../../helpers/verificarCampoObligatorio.js";
import { getTodayDate } from "../../helpers/getTodayDate.js";
import { verificarCamposObligatorios } from "../../helpers/verificarCampoObligatorio.js";
import {
  PutObjectCommand,
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { uploadImagesToS3 } from "../../helpers/s3Services.js";
import {validacionCUIT} from "../../helpers/validacionCUIT.js"

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
    telefono_alternativo,
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
    usuario,
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
  ];
  const campoFaltante = verificarCamposObligatorios(
    req.body,
    camposObligatorios,
    "cliente"
  );

  if (campoFaltante) {
    return res.send({
      status: false,
      message: `Falta completar el campo obligatorio: ${campoFaltante}`,
    });
  }

  const CUITvalido = validacionCUIT(nro_documento)

  if(!CUITvalido){
    return res.send({
      status: false,
      message: `El CUIT ingresado no es válido`,
    });
  }
  const transaction = await giama_renting.transaction();
  let insertId;
  try {
const result = await giama_renting.query(
    `INSERT INTO clientes (nombre, apellido, razon_social, fecha_nacimiento, nacionalidad, tipo_contribuyente,
      tipo_documento, nro_documento, doc_expedido_por, licencia, lic_expedida_por, fecha_vencimiento_licencia, direccion,
      nro_direccion, piso, depto, codigo_postal, provincia, ciudad, celular, telefono_alternativo, mail, notas, resolucion_datero, fecha_resolucion_datero,
      usuario_resolucion_datero, usuario_alta)
      VALUES (:nombre, :apellido, :razon_social, :fecha_nacimiento, :nacionalidad, :tipo_contribuyente,
      :tipo_documento, :nro_documento, :doc_expedido_por, :licencia, :lic_expedida_por, :fecha_vencimiento_licencia, :direccion,
      :nro_direccion, :piso, :depto, :codigo_postal, :provincia, :ciudad, :celular, :telefono_alternativo, :mail, :notas, :resolucion_datero, :fecha_resolucion_datero,
      :usuario_resolucion_datero, :usuario_alta)`,
    {
        type: QueryTypes.INSERT,
        // 2. Transforma el array 'replacements' en un objeto
        replacements: {
            nombre: nombre,
            apellido: apellido,
            razon_social: razon_social,
            fecha_nacimiento: fecha_nacimiento,
            nacionalidad: nacionalidad,
            tipo_contribuyente: tipo_contribuyente,
            tipo_documento: tipo_documento,
            nro_documento: nro_documento,
            doc_expedido_por: doc_expedido_por,
            licencia: licencia,
            lic_expedida_por: lic_expedida_por,
            fecha_vencimiento_licencia: fecha_vencimiento ? fecha_vencimiento : null, // Mapea la variable 'fecha_vencimiento'
            direccion: direccion,
            nro_direccion: nro_direccion,
            piso: piso,
            depto: depto,
            codigo_postal: codigo_postal,
            provincia: provincia,
            ciudad: ciudad,
            celular: celular,
            telefono_alternativo: telefono_alternativo,
            mail: mail,
            notas: notas  ? notas : null, // Utiliza la variable 'notas'
            resolucion_datero: resolucion_datero,
            fecha_resolucion_datero: hoy, // Mapea la variable 'hoy'
            usuario_resolucion_datero: usuario_resolucion_datero,
            usuario_alta: usuario, // Mapea la variable 'usuario'
        },
        transaction: transaction,
    }
);
    insertId = result[0];
  } catch (error) {
    console.log(error);
    transaction.rollback();
    const { body } = handleError(error, "cliente", acciones.post);
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
      console.error("Error al subir imagen: ", err);
      return res.send({
        status: false,
        message: "Error al subir las imágenes",
      });
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
          libre_de_deuda ? libre_de_deuda : 0,
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
    const { body } = handleError(error, "cliente", acciones.post);
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
    telefono_alternativo,
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
    const { body } = handleError(error, "Datero del cliente", acciones.get);
    return res.send(body);
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
    const { body } = handleError(error, "Cliente", acciones.get);
    return res.send(body);
  }
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
        tipo_documento = ?, nro_documento = ?, doc_expedido_por = ?, licencia = ?, lic_expedida_por = ?, fecha_vencimiento_licencia = ?, 
        direccion = ?,
        nro_direccion = ?, piso = ?, depto = ?, codigo_postal = ?, provincia = ?, ciudad = ?, 
        celular = ?, telefono_alternativo = ?, mail = ?, notas = ?, 
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
          tipo_contribuyente ? tipo_contribuyente : null,
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
          provincia ? provincia : null,
          ciudad,
          celular,
          telefono_alternativo,
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
    const { body } = handleError(error, "Cliente", acciones.update);
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
      const { body } = handleError(error, "Datero del cliente", acciones.post);
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
      console.log(error);
      transaction.rollback();
      const { body } = handleError(
        error,
        "Datero del cliente",
        acciones.update
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
    const { body } = handleError(error, "Clientes", acciones.get);
    return res.send(body);
  }
};

export const postImagenesCliente = async (req, res) => {
  try {
    const { id } = req.body;
    const files = req.files;

    const uploadResult = await uploadImagesToS3(
      files,
      `giama_renting/clientes/${id}`
    );

    return res.send(uploadResult);
  } catch (error) {
    console.error(error);
    return res.send({ status: false, message: "Error al subir imágenes" });
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
    const { body } = handleError(error, "Cliente", acciones.get);
    return res.send(body);
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
  if (!id_cliente)
    return res.send({ status: false, message: "No hay cliente especificado" });
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
    const { body } = handleError(error, "Datero del cliente", acciones.get);
    return res.send(body);
  }
};

export const getImagenesClientes = async (req, res) => {
  const { id } = req.body;
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
    return res.send({
      status: false,
      message: "Error al obtener las imágenes",
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

/* export const postClientesMasivo = async (req, res) => {
  try {
    if (!req.file) {
      return res.send({
        status: false,
        message: "Debe subir un archivo Excel",
      });
    }
    // leer excel
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      raw: false, // fuerza conversión automática de fechas
      dateNF: "yyyy-mm-dd", // formato de salida
    });
    function normalizeDate(dmy) {
      const [dia, mes, anio] = dmy.split("/");
      return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    }
    const transaction_1 = await giama_renting.transaction();
    // recorrer filas y llamar a insertVehiculo
    for (let row of data) {
      try {
        await giama_renting.query(
          `INSERT INTO clientes (razon_social, nombre, apellido, tipo_documento, nro_documento,
           tipo_contribuyente, direccion, nro_direccion, piso, depto, provincia, celular, telefono_alternativo,
           mail, fecha_nacimiento, ciudad, usuario_alta)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          {
            type: QueryTypes.INSERT,
            replacements: [
              row.RazonSocial ? row.RazonSocial : null,
              row.Nombre ? row.Nombre : null,
              row.Apellido ? row.Apellido : null,
              row.tipo_documento == "CUIL"
                ? 7
                : row.tipo_documento == "CUIT"
                ? 6
                : null,
              row.Nro_Doc,
              row.Tipo_Responsable == "RESPONSABLE MONOTRIBUTO"
                ? 4
                : row.Tipo_Responsable == "CONSUMIDOR FINAL"
                ? 5
                : null,
              row.Calle ? row.Calle : null,
              row.nro_direccion ? row.nro_direccion : null,
              row.Piso ? row.Piso : null,
              row.Depto ? row.Depto : null,
              row.Provincia == "Buenos Aires"
                ? 1
                : row.Provincia == "BUENOS AIRES"
                ? 1
                : row.Provincia == "CABA"
                ? 2
                : null,
              row.Celular,
              row.telefono_alternativo,
              row.correo_electronico,
              normalizeDate(row.fecha_nacimiento),
              row.Localidad ? row.Localidad : null,
              "farce@giama.com.ar",
            ],
            transaction: transaction_1,
          }
        );
      } catch (error) {
        console.log(error);
        transaction_1.rollback();
        const { body } = handleError(error, "cliente", acciones.post);
        return res.send(body);
      }
    }
    transaction_1.commit();
    return res.send({
      status: true,
      message: `${data.length} clientes cargados correctamente`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: false,
      message: "Error al procesar archivo",
    });
  }
}; */
