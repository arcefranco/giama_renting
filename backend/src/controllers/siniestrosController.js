import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import { handleError, acciones } from "../../helpers/handleError.js";

const safeJsonStringify = (val) => {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") return val;
  try {
    return JSON.stringify(val);
  } catch {
    return null;
  }
};

const parseJsonIfString = (val) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }
  return val;
};

export const validarFotosGuiadas = (fotos) => {
  const parsed = parseJsonIfString(fotos);
  if (!Array.isArray(parsed) || parsed.length !== 8) {
    return false;
  }
  return parsed.every(
    (foto) => foto && typeof foto === "string" && foto.trim().length > 0
  );
};

/**
 * Buscar contratos para el selector de actas de inspección / siniestros.
 * Permite buscar por ID de contrato, dominio, modelo, o datos del cliente.
 */
export const buscarContratos = async (req, res) => {
  const queryTerm = (req.query.q || req.query.query || "").trim();
  try {
    const likeParam = `%${queryTerm}%`;
    const contratos = await giama_renting.query(
      `SELECT 
        c.id,
        c.id_vehiculo,
        c.id_cliente,
        c.fecha_desde,
        c.fecha_hasta,
        cli.nombre AS cliente_nombre,
        cli.apellido AS cliente_apellido,
        cli.razon_social AS cliente_razon_social,
        cli.nro_documento AS cliente_documento,
        cli.celular AS cliente_celular,
        cli.telefono_alternativo AS cliente_telefono_alternativo,
        v.dominio AS vehiculo_dominio,
        v.dominio_provisorio AS vehiculo_dominio_provisorio,
        COALESCE(m.nombre, '') AS vehiculo_modelo,
        v.color AS vehiculo_color
      FROM contratos_alquiler c
      LEFT JOIN clientes cli ON c.id_cliente = cli.id
      LEFT JOIN vehiculos v ON c.id_vehiculo = v.id
      LEFT JOIN modelos m ON v.modelo = m.id
      WHERE (:queryTerm = '' 
        OR c.id LIKE :likeParam
        OR v.dominio LIKE :likeParam
        OR v.dominio_provisorio LIKE :likeParam
        OR m.nombre LIKE :likeParam
        OR cli.nombre LIKE :likeParam
        OR cli.apellido LIKE :likeParam
        OR cli.razon_social LIKE :likeParam
        OR cli.nro_documento LIKE :likeParam)
      ORDER BY c.id DESC
      LIMIT 50`,
      {
        replacements: { queryTerm, likeParam },
        type: QueryTypes.SELECT,
      }
    );

    return res.send(contratos);
  } catch (error) {
    const { body } = handleError(error, "Contratos", acciones.get);
    return res.send(body);
  }
};

/**
 * Obtener listado de siniestros / inspecciones
 */
export const getSiniestros = async (req, res) => {
  try {
    const siniestros = await giama_renting.query(
      `SELECT 
        si.*,
        cli.nombre AS cliente_nombre,
        cli.apellido AS cliente_apellido,
        cli.razon_social AS cliente_razon_social,
        cli.nro_documento AS cliente_documento,
        v.dominio AS vehiculo_dominio,
        v.dominio_provisorio AS vehiculo_dominio_provisorio,
        COALESCE(m.nombre, '') AS vehiculo_modelo,
        v.color AS vehiculo_color
      FROM siniestros_inspecciones si
      LEFT JOIN contratos_alquiler c ON si.id_contrato = c.id
      LEFT JOIN clientes cli ON si.id_cliente = cli.id
      LEFT JOIN vehiculos v ON si.id_vehiculo = v.id
      LEFT JOIN modelos m ON v.modelo = m.id
      ORDER BY si.id DESC`,
      {
        type: QueryTypes.SELECT,
      }
    );

    return res.send(siniestros);
  } catch (error) {
    const { body } = handleError(error, "Siniestros", acciones.get);
    return res.send(body);
  }
};

/**
 * Obtener un siniestro / inspección por ID
 */
export const getSiniestroById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.send({ status: false, message: "ID no proporcionado" });
  }

  try {
    const [siniestro] = await giama_renting.query(
      `SELECT 
        si.*,
        cli.nombre AS cliente_nombre,
        cli.apellido AS cliente_apellido,
        cli.razon_social AS cliente_razon_social,
        cli.nro_documento AS cliente_documento,
        cli.celular AS cliente_celular,
        cli.telefono_alternativo AS cliente_telefono_alternativo,
        v.dominio AS vehiculo_dominio,
        v.dominio_provisorio AS vehiculo_dominio_provisorio,
        COALESCE(m.nombre, '') AS vehiculo_modelo,
        v.color AS vehiculo_color
      FROM siniestros_inspecciones si
      LEFT JOIN contratos_alquiler c ON si.id_contrato = c.id
      LEFT JOIN clientes cli ON si.id_cliente = cli.id
      LEFT JOIN vehiculos v ON si.id_vehiculo = v.id
      LEFT JOIN modelos m ON v.modelo = m.id
      WHERE si.id = ?`,
      {
        replacements: [id],
        type: QueryTypes.SELECT,
      }
    );

    if (!siniestro) {
      return res.send({
        status: false,
        message: "Inspección de siniestro no encontrada",
      });
    }

    return res.send(siniestro);
  } catch (error) {
    const { body } = handleError(error, "Siniestros", acciones.get);
    return res.send(body);
  }
};

/**
 * Crear nueva inspección / siniestro
 */
export const postSiniestro = async (req, res) => {
  const {
    id_contrato,
    id_vehiculo,
    id_cliente,
    tipo,
    fecha_hora,
    verificador,
    nivel_combustible,
    segundo_juego_llaves,
    kilometraje,
    kilometraje_manual,
    danos,
    control_general,
    observaciones,
    fotos_guiadas,
    fotos_adicionales,
    firma_cliente,
    aclaracion_cliente,
    firma_verificador,
    aclaracion_verificador,
    usuario_alta,
    estado,
  } = req.body;

  if (!id_contrato || !id_vehiculo || !id_cliente) {
    return res.send({
      status: false,
      message: "Contrato, vehículo y cliente son campos obligatorios.",
    });
  }

  if (!validarFotosGuiadas(fotos_guiadas)) {
    return res.send({
      status: false,
      message: "Deben cargarse las 8 fotos obligatorias del registro fotográfico.",
    });
  }

  const transaction = await giama_renting.transaction();
  try {
    const [insertResult] = await giama_renting.query(
      `INSERT INTO siniestros_inspecciones (
        id_contrato,
        id_vehiculo,
        id_cliente,
        tipo,
        fecha_hora,
        verificador,
        nivel_combustible,
        segundo_juego_llaves,
        kilometraje,
        kilometraje_manual,
        danos,
        control_general,
        observaciones,
        fotos_guiadas,
        fotos_adicionales,
        firma_cliente,
        aclaracion_cliente,
        firma_verificador,
        aclaracion_verificador,
        usuario_alta,
        estado
      ) VALUES (
        :id_contrato,
        :id_vehiculo,
        :id_cliente,
        :tipo,
        :fecha_hora,
        :verificador,
        :nivel_combustible,
        :segundo_juego_llaves,
        :kilometraje,
        :kilometraje_manual,
        :danos,
        :control_general,
        :observaciones,
        :fotos_guiadas,
        :fotos_adicionales,
        :firma_cliente,
        :aclaracion_cliente,
        :firma_verificador,
        :aclaracion_verificador,
        :usuario_alta,
        :estado
      )`,
      {
        replacements: {
          id_contrato,
          id_vehiculo,
          id_cliente,
          tipo: tipo || "Entrega",
          fecha_hora: fecha_hora || new Date(),
          verificador: verificador || "",
          nivel_combustible: nivel_combustible || null,
          segundo_juego_llaves: segundo_juego_llaves || null,
          kilometraje: Number(kilometraje) || 0,
          kilometraje_manual: kilometraje_manual ? 1 : 0,
          danos: safeJsonStringify(danos),
          control_general: safeJsonStringify(control_general),
          observaciones: observaciones || null,
          fotos_guiadas: safeJsonStringify(fotos_guiadas),
          fotos_adicionales: safeJsonStringify(fotos_adicionales),
          firma_cliente: firma_cliente || null,
          aclaracion_cliente: aclaracion_cliente || null,
          firma_verificador: firma_verificador || null,
          aclaracion_verificador: aclaracion_verificador || null,
          usuario_alta: usuario_alta || null,
          estado: estado || "Pendiente",
        },
        type: QueryTypes.INSERT,
        transaction,
      }
    );

    // Si viene kilometraje mayor a 0, actualizar odómetro del vehículo
    const kmNum = Number(kilometraje) || 0;
    if (kmNum > 0) {
      await giama_renting.query(
        `UPDATE vehiculos 
         SET kilometros_actuales = :kmNum,
             fecha_medicion_km = :fechaMedicion
         WHERE id = :id_vehiculo AND (kilometros_actuales IS NULL OR kilometros_actuales < :kmNum)`,
        {
          replacements: {
            kmNum,
            fechaMedicion: fecha_hora || new Date(),
            id_vehiculo,
          },
          type: QueryTypes.UPDATE,
          transaction,
        }
      );
    }

    await transaction.commit();

    return res.send({
      status: true,
      message: "Inspección guardada correctamente",
      id: insertResult,
    });
  } catch (error) {
    await transaction.rollback();
    const { body } = handleError(error, "Siniestro", acciones.post);
    return res.send(body);
  }
};

/**
 * Actualizar inspección / siniestro existente
 */
export const updateSiniestro = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.send({ status: false, message: "ID no proporcionado" });
  }

  const {
    id_contrato,
    id_vehiculo,
    id_cliente,
    tipo,
    fecha_hora,
    verificador,
    nivel_combustible,
    segundo_juego_llaves,
    kilometraje,
    kilometraje_manual,
    danos,
    control_general,
    observaciones,
    fotos_guiadas,
    fotos_adicionales,
    firma_cliente,
    aclaracion_cliente,
    firma_verificador,
    aclaracion_verificador,
    estado,
  } = req.body;

  if (fotos_guiadas !== undefined && !validarFotosGuiadas(fotos_guiadas)) {
    return res.send({
      status: false,
      message: "Deben cargarse las 8 fotos obligatorias del registro fotográfico.",
    });
  }

  try {
    await giama_renting.query(
      `UPDATE siniestros_inspecciones SET
        id_contrato = COALESCE(:id_contrato, id_contrato),
        id_vehiculo = COALESCE(:id_vehiculo, id_vehiculo),
        id_cliente = COALESCE(:id_cliente, id_cliente),
        tipo = COALESCE(:tipo, tipo),
        fecha_hora = COALESCE(:fecha_hora, fecha_hora),
        verificador = COALESCE(:verificador, verificador),
        nivel_combustible = :nivel_combustible,
        segundo_juego_llaves = :segundo_juego_llaves,
        kilometraje = COALESCE(:kilometraje, kilometraje),
        kilometraje_manual = COALESCE(:kilometraje_manual, kilometraje_manual),
        danos = COALESCE(:danos, danos),
        control_general = COALESCE(:control_general, control_general),
        observaciones = :observaciones,
        fotos_guiadas = COALESCE(:fotos_guiadas, fotos_guiadas),
        fotos_adicionales = COALESCE(:fotos_adicionales, fotos_adicionales),
        firma_cliente = COALESCE(:firma_cliente, firma_cliente),
        aclaracion_cliente = COALESCE(:aclaracion_cliente, aclaracion_cliente),
        firma_verificador = COALESCE(:firma_verificador, firma_verificador),
        aclaracion_verificador = COALESCE(:aclaracion_verificador, aclaracion_verificador),
        estado = COALESCE(:estado, estado)
      WHERE id = :id`,
      {
        replacements: {
          id,
          id_contrato: id_contrato || null,
          id_vehiculo: id_vehiculo || null,
          id_cliente: id_cliente || null,
          tipo: tipo || null,
          fecha_hora: fecha_hora || null,
          verificador: verificador !== undefined ? verificador : null,
          nivel_combustible: nivel_combustible || null,
          segundo_juego_llaves: segundo_juego_llaves || null,
          kilometraje: kilometraje !== undefined ? Number(kilometraje) : null,
          kilometraje_manual: kilometraje_manual !== undefined ? (kilometraje_manual ? 1 : 0) : null,
          danos: danos !== undefined ? safeJsonStringify(danos) : null,
          control_general: control_general !== undefined ? safeJsonStringify(control_general) : null,
          observaciones: observaciones || null,
          fotos_guiadas: fotos_guiadas !== undefined ? safeJsonStringify(fotos_guiadas) : null,
          fotos_adicionales: fotos_adicionales !== undefined ? safeJsonStringify(fotos_adicionales) : null,
          firma_cliente: firma_cliente || null,
          aclaracion_cliente: aclaracion_cliente || null,
          firma_verificador: firma_verificador || null,
          aclaracion_verificador: aclaracion_verificador || null,
          estado: estado || null,
        },
        type: QueryTypes.UPDATE,
      }
    );

    return res.send({
      status: true,
      message: "Inspección actualizada correctamente",
    });
  } catch (error) {
    const { body } = handleError(error, "Siniestro", acciones.update);
    return res.send(body);
  }
};

/**
 * Actualizar exclusivamente el estado de un siniestro / inspección
 */
export const updateSiniestroEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!id || !estado) {
    return res.send({
      status: false,
      message: "ID y estado son requeridos.",
    });
  }

  try {
    await giama_renting.query(
      `UPDATE siniestros_inspecciones SET estado = ? WHERE id = ?`,
      {
        replacements: [estado, id],
        type: QueryTypes.UPDATE,
      }
    );

    return res.send({
      status: true,
      message: "Estado de inspección actualizado correctamente",
    });
  } catch (error) {
    const { body } = handleError(error, "Siniestro", acciones.update);
    return res.send(body);
  }
};
