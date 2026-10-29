import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import { handleError, acciones } from "../../helpers/handleError.js";

export const postContratoDigital = async (req, res) => {
  const {
    id_contrato,
    id_cliente,
    id_vehiculo,
    numero_contrato,
    fecha,
    hora,
    locatario_nombre,
    locatario_dni,
    locatario_telefono,
    locatario_domicilio,
    locatario_localidad,
    locatario_email,
    vehiculo_marca,
    vehiculo_modelo,
    vehiculo_patente,
    vehiculo_color,
    vehiculo_kilometraje,
    alquiler_semanal,
    deposito_garantia,
    km_limite_semanal,
    valor_km_excedente,
    plazo_semanas,
    acepta_contrato,
    acepta_cabify,
    acepta_telepase,
    firma_digital,
    usuario_alta,
    estado,
  } = req.body;

  if (!numero_contrato || !fecha || !hora || !locatario_nombre || !locatario_dni || !vehiculo_patente) {
    return res.status(400).send({
      status: false,
      message: "Faltan campos obligatorios para guardar el contrato digital.",
    });
  }

  try {
    const [insertId] = await giama_renting.query(
      `INSERT INTO contratos_digitales (
        id_contrato,
        id_cliente,
        id_vehiculo,
        numero_contrato,
        fecha,
        hora,
        locatario_nombre,
        locatario_dni,
        locatario_telefono,
        locatario_domicilio,
        locatario_localidad,
        locatario_email,
        vehiculo_marca,
        vehiculo_modelo,
        vehiculo_patente,
        vehiculo_color,
        vehiculo_kilometraje,
        alquiler_semanal,
        deposito_garantia,
        km_limite_semanal,
        valor_km_excedente,
        plazo_semanas,
        acepta_contrato,
        acepta_cabify,
        acepta_telepase,
        firma_digital,
        usuario_alta,
        estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          id_contrato || null,
          id_cliente || null,
          id_vehiculo || null,
          numero_contrato,
          fecha,
          hora,
          locatario_nombre,
          locatario_dni,
          locatario_telefono || null,
          locatario_domicilio || null,
          locatario_localidad || null,
          locatario_email || null,
          vehiculo_marca || null,
          vehiculo_modelo || null,
          vehiculo_patente,
          vehiculo_color || null,
          vehiculo_kilometraje || 0,
          alquiler_semanal || 0,
          deposito_garantia || 0,
          km_limite_semanal || 1800,
          valor_km_excedente || 0,
          plazo_semanas || 12,
          acepta_contrato !== undefined ? (acepta_contrato ? 1 : 0) : 1,
          acepta_cabify !== undefined ? (acepta_cabify ? 1 : 0) : 1,
          acepta_telepase !== undefined ? (acepta_telepase ? 1 : 0) : 1,
          firma_digital || null,
          usuario_alta || req.user?.username || null,
          estado || "Firmado",
        ],
        type: QueryTypes.INSERT,
      }
    );

    return res.send({
      status: true,
      message: "Contrato digital guardado exitosamente.",
      id: insertId,
    });
  } catch (error) {
    console.error("Error al guardar contrato digital:", error);
    const { body } = handleError(error, "Contrato digital", acciones.post);
    return res.status(500).send(body);
  }
};

export const getContratosDigitales = async (req, res) => {
  const { busqueda, limit = 50, offset = 0 } = req.query;

  try {
    let query = `
      SELECT cd.* 
      FROM contratos_digitales cd
    `;
    const replacements = [];

    if (busqueda && busqueda.trim() !== "") {
      query += `
        WHERE cd.numero_contrato LIKE ?
           OR cd.locatario_nombre LIKE ?
           OR cd.locatario_dni LIKE ?
           OR cd.vehiculo_patente LIKE ?
      `;
      const term = `%${busqueda.trim()}%`;
      replacements.push(term, term, term, term);
    }

    query += ` ORDER BY cd.id DESC LIMIT ? OFFSET ?`;
    replacements.push(Number(limit), Number(offset));

    const contratos = await giama_renting.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return res.send(contratos);
  } catch (error) {
    console.error("Error al obtener contratos digitales:", error);
    const { body } = handleError(error, "Contratos digitales", acciones.get);
    return res.status(500).send(body);
  }
};

export const getContratoDigitalById = async (req, res) => {
  const { id } = req.params;

  try {
    const [contrato] = await giama_renting.query(
      `SELECT * FROM contratos_digitales WHERE id = ? LIMIT 1`,
      {
        replacements: [id],
        type: QueryTypes.SELECT,
      }
    );

    if (!contrato) {
      return res.status(404).send({
        status: false,
        message: "No se encontró el contrato digital.",
      });
    }

    return res.send(contrato);
  } catch (error) {
    console.error("Error al obtener contrato digital por ID:", error);
    const { body } = handleError(error, "Contrato digital", acciones.get);
    return res.status(500).send(body);
  }
};

export const buscarContratosParaDigital = async (req, res) => {
  const queryTerm = (req.query.q || req.query.query || "").trim();
  const likeParam = `%${queryTerm}%`;

  try {
    const contratos = await giama_renting.query(
      `SELECT 
        c.id AS id_contrato,
        c.fecha_desde,
        c.fecha_hasta,
        c.hora_desde,
        c.hora_hasta,
        c.deposito_garantia,
        c.fecha_contrato,
        
        -- Cliente
        cli.id AS id_cliente,
        cli.nombre AS cliente_nombre,
        cli.apellido AS cliente_apellido,
        cli.razon_social AS cliente_razon_social,
        cli.nro_documento AS cliente_dni,
        cli.celular AS cliente_telefono,
        cli.telefono_alternativo AS cliente_telefono_alt,
        cli.direccion AS cliente_direccion,
        cli.nro_direccion AS cliente_nro_direccion,
        cli.piso AS cliente_piso,
        cli.depto AS cliente_depto,
        cli.ciudad AS cliente_ciudad,
        cli.mail AS cliente_email,
        
        -- Vehiculo
        v.id AS id_vehiculo,
        SUBSTRING_INDEX(COALESCE(m.nombre, ''), ' ', 1) AS vehiculo_marca,
        COALESCE(m.nombre, '') AS vehiculo_modelo,
        COALESCE(v.dominio, v.dominio_provisorio, '') AS vehiculo_patente,
        v.color AS vehiculo_color,
        COALESCE(v.kilometros_actuales, v.kilometros_iniciales, 0) AS vehiculo_kilometraje,

        -- Alquiler estimado
        (
          SELECT a.importe_total 
          FROM alquileres a 
          WHERE a.id_contrato = c.id 
          ORDER BY a.id ASC 
          LIMIT 1
        ) AS alquiler_semanal
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
      LIMIT 30`,
      {
        replacements: { queryTerm, likeParam },
        type: QueryTypes.SELECT,
      }
    );

    return res.send(contratos);
  } catch (error) {
    console.error("Error al buscar contratos para digital:", error);
    const { body } = handleError(error, "Búsqueda de contratos", acciones.get);
    return res.status(500).send(body);
  }
};
