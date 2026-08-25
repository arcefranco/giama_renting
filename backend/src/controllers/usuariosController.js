import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await giama_renting.query(
      "SELECT id, nombre, email, roles, puede_acceder FROM usuarios WHERE activo = 1",
      {
        type: QueryTypes.SELECT,
      }
    );
    return res.send(usuarios);
  } catch (error) {
    console.error(error);
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};

export const toggleAcceso = async (req, res) => {
  const { id } = req.params;
  const userAction = req.user?.user;
  
  if (!id) {
    return res.send({ status: false, message: "ID de usuario requerido" });
  }

  try {
    const user = await giama_renting.query(
      "SELECT puede_acceder, roles FROM usuarios WHERE id = ?",
      {
        replacements: [id],
        type: QueryTypes.SELECT,
      }
    );

    if (user.length === 0) {
      return res.send({ status: false, message: "Usuario no encontrado" });
    }

    const userRoles = user[0].roles ? user[0].roles.toString().split(",") : [];
    if (userRoles.includes("1")) {
      return res.send({ status: false, message: "No se puede bloquear a un administrador." });
    }

    const nuevoAcceso = user[0].puede_acceder === 0 ? 1 : 0;

    await giama_renting.query(
      "UPDATE usuarios SET puede_acceder = ?, usuario_modificacion = ? WHERE id = ?",
      {
        replacements: [nuevoAcceso, userAction, id],
        type: QueryTypes.UPDATE,
      }
    );

    return res.send({
      status: true,
      message: `El acceso del usuario ha sido ${nuevoAcceso === 1 ? "desbloqueado" : "bloqueado"} correctamente`,
      puede_acceder: nuevoAcceso
    });
  } catch (error) {
    console.error(error);
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};

export const updateRoles = async (req, res) => {
  const { id } = req.params;
  const { roles } = req.body;
  const userAction = req.user?.user;
  
  if (!id || roles === undefined) {
    return res.send({ status: false, message: "ID y roles requeridos" });
  }
  
  try {
    await giama_renting.query(
      "UPDATE usuarios SET roles = ?, usuario_modificacion = ? WHERE id = ?",
      {
        replacements: [roles, userAction, id],
        type: QueryTypes.UPDATE,
      }
    );
    return res.send({ status: true, message: "Roles actualizados correctamente" });
  } catch (error) {
    console.error(error);
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};

export const softDeleteUsuario = async (req, res) => {
  const { id } = req.params;
  const userAction = req.user?.user;
  
  if (!id) {
    return res.send({ status: false, message: "ID requerido" });
  }
  
  try {
    await giama_renting.query(
      "UPDATE usuarios SET activo = 0, usuario_modificacion = ? WHERE id = ?",
      {
        replacements: [userAction, id],
        type: QueryTypes.UPDATE,
      }
    );
    return res.send({ status: true, message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return res.send({ status: false, message: JSON.stringify(error) });
  }
};
