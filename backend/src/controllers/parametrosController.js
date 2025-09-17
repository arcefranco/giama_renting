import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import { getTodayDate, getYesterdayDate } from "../../helpers/getTodayDate.js";
import { handleError, acciones } from "../../helpers/handleError.js";

export const postSucursal = async (req, res) => {
  const { nombre } = req.body;
  if (!nombre)
    return res.send({
      status: false,
      message: "El campo nombre es obligatorio",
    });
  try {
    await giama_renting.query("INSERT INTO sucursales (nombre) VALUES (?)", {
      type: QueryTypes.INSERT,
      replacements: [nombre],
    });
    return res.send({
      status: true,
      message: "La sucursal ha sido creada con éxito",
    });
  } catch (error) {
    const { body } = handleError(error, "Sucursal", acciones.post);
    return res.send(body);
  }
};

export const updateSucursal = async (req, res) => {
  const { nombre, id } = req.body;
  try {
    await giama_renting.query("UPDATE sucursales SET nombre = ? WHERE id = ?", {
      type: QueryTypes.UPDATE,
      replacements: [nombre, id],
    });
    return res.send({
      status: true,
      message: "La sucursal ha sido actualizada con éxito",
    });
  } catch (error) {
    const { body } = handleError(error, "Sucursal", acciones.update);
    return res.send(body);
  }
};

export const deleteSucursal = async (req, res) => {
  const { id } = req.body;
  try {
    await giama_renting.query("DELETE FROM sucursales WHERE id = ?", {
      type: QueryTypes.DELETE,
      replacements: [id],
    });
    return res.send({
      status: true,
      message: "La sucursal ha eliminada sido con éxito",
    });
  } catch (error) {
    const { body } = handleError(error, "Sucursal", acciones.update);
    return res.send(body);
  }
};

export const getSucursalById = async (req, res) => {
  const { id } = req.body;
  try {
    const result = await giama_renting.query(
      "SELECT * FROM sucursales WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(result);
  } catch (error) {
    const { body } = handleError(error, "Sucursal", acciones.get);
    return res.send(body);
  }
};

export const postProveedorGPS = async (req, res) => {
  const { nombre } = req.body;
  try {
    await giama_renting.query(
      "INSERT INTO proveedores_gps (nombre) VALUES (?)",
      {
        type: QueryTypes.INSERT,
        replacements: [nombre],
      }
    );
    return res.send({
      status: true,
      message: "El proveedor GPS ha sido creado con éxito",
    });
  } catch (error) {
    const { body } = handleError(error, "Sucursal", acciones.post);
    return res.send(body);
  }
};

export const updateProveedorGPS = async (req, res) => {
  const { nombre, id } = req.body;
  try {
    await giama_renting.query(
      "UPDATE proveedores_gps SET nombre = ? WHERE id = ?",
      {
        type: QueryTypes.UPDATE,
        replacements: [nombre, id],
      }
    );
    return res.send({
      status: true,
      message: "El proveedor GPS ha sido actualizado con éxito",
    });
  } catch (error) {
    const { body } = handleError(error, "Sucursal", acciones.update);
    return res.send(body);
  }
};

export const deleteProveedorGPS = async (req, res) => {
  const { id } = req.body;
  try {
    await giama_renting.query("DELETE FROM proveedores_gps WHERE id = ?", {
      type: QueryTypes.DELETE,
      replacements: [id],
    });
    return res.send({
      status: true,
      message: "El proveedor GPS ha eliminado sido con éxito",
    });
  } catch (error) {
    const { body } = handleError(error, "Sucursal", acciones.update);
    return res.send(body);
  }
};

export const getProveedorGPSById = async (req, res) => {
  const { id } = req.body;
  try {
    const result = await giama_renting.query(
      "SELECT * FROM proveedores_gps WHERE id = ?",
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(result);
  } catch (error) {
    const { body } = handleError(error, "Proveedor GPS", acciones.get);
    return res.send(body);
  }
};

export const getModelosVehiculos = async (req, res) => {
  try {
    const resultado = await giama_renting.query(
      `SELECT 
    m.id AS id_modelo,
    p.id AS id_precio,
    m.nombre AS nombre_modelo,
    p.precio,
    p.vigencia_desde,
    p.vigencia_hasta
    FROM modelos m
    INNER JOIN precios_modelos p ON m.id = p.modelo  
    AND p.vigencia_hasta IS NULL;`,
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(resultado);
  } catch (error) {
    const { body } = handleError(error, "Modelos", acciones.get);
    return res.send(body);
  }
};

export const getModeloById = async (req, res) => {
  const { id } = req.body;
  if (!id)
    return res.send({ status: false, message: "Debe especificar un modelo" });
  try {
    const result = await giama_renting.query(
      `SELECT 
    m.id AS id_modelo,
    p.id AS id_precio,
    m.nombre AS nombre_modelo,
    p.precio,
    p.vigencia_desde,
    p.vigencia_hasta
      FROM modelos m
      INNER JOIN precios_modelos p 
      ON m.id = p.modelo  
      AND p.vigencia_hasta IS NULL
      WHERE m.id = ?`,
      {
        type: QueryTypes.SELECT,
        replacements: [id],
      }
    );
    return res.send(result);
  } catch (error) {
    const { body } = handleError(error, "Modelo", acciones.get);
    return res.send(body);
  }
};

export const postModelo = async (req, res) => {
  const { nombre, precio } = req.body;
  let transaction = await giama_renting.transaction();
  let insertedId;
  try {
    const result = await giama_renting.query(
      "INSERT INTO modelos (nombre) VALUES (?)",
      {
        type: QueryTypes.INSERT,
        replacements: [nombre],
        transaction: transaction,
      }
    );
    insertedId = result[0]; //id del modelo creado

    await giama_renting.query(
      "INSERT INTO precios_modelos (modelo, vigencia_desde, precio) VALUES (?,?,?)",
      {
        type: QueryTypes.INSERT,
        replacements: [insertedId, getTodayDate(), precio],
        transaction: transaction,
      }
    );
    transaction.commit();
    return res.send({
      status: true,
      message: "El modelo ha sido creado con éxito",
    });
  } catch (error) {
    const { body } = handleError(error, "Modelo", acciones.post);
    return res.send(body);
  }
};

export const updateModelo = async (req, res) => {
  const { nombre, id_modelo, precio } = req.body;
  console.log(req.body);
  let transaction = await giama_renting.transaction();
  let precio_anterior;
  try {
    const result = await giama_renting.query(
      "SELECT precio FROM precios_modelos WHERE modelo = ? AND vigencia_hasta IS NULL",
      {
        replacements: [id_modelo],
        type: QueryTypes.SELECT,
        transaction: transaction,
      }
    );
    precio_anterior = result[0]["precio"];
  } catch (error) {
    const { body } = handleError(error, "Precio anterior", acciones.get);
    return res.send(body);
  }
  try {
    await giama_renting.query("UPDATE modelos SET nombre = ? WHERE id = ?", {
      type: QueryTypes.UPDATE,
      replacements: [nombre, id_modelo],
      transaction: transaction,
    });
    if (precio !== precio_anterior) {
      await giama_renting.query(
        "UPDATE precios_modelos SET vigencia_hasta = ?  WHERE modelo = ?",
        {
          type: QueryTypes.UPDATE,
          replacements: [getYesterdayDate(), id_modelo],
          transaction: transaction,
        }
      );
      await giama_renting.query(
        "INSERT INTO precios_modelos (modelo, vigencia_desde, precio) VALUES (?,?,?)",
        {
          type: QueryTypes.INSERT,
          replacements: [id_modelo, getTodayDate(), precio],
          transaction: transaction,
        }
      );
    }
    transaction.commit();
    return res.send({
      status: true,
      message: "El modelo ha sido actualizado con éxito",
    });
  } catch (error) {
    const { body } = handleError(error, "Sucursal", acciones.update);
    return res.send(body);
  }
};

export const deleteModelo = async (req, res) => {
  const { id } = req.body;
  try {
    await giama_renting.query("DELETE FROM modelos WHERE id = ?", {
      type: QueryTypes.DELETE,
      replacements: [id],
    });
    return res.send({
      status: true,
      message: "El modelo ha sido eliminado con éxito",
    });
  } catch (error) {
    const { body } = handleError(error, "Sucursal", acciones.update);
    return res.send(body);
  }
};
