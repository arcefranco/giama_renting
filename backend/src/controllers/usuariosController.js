import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await giama_renting.query(
      "SELECT id, nombre, email, roles, puede_acceder FROM usuarios",
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
  
  if (!id) {
    return res.send({ status: false, message: "ID de usuario requerido" });
  }

  try {
    const user = await giama_renting.query(
      "SELECT puede_acceder FROM usuarios WHERE id = ?",
      {
        replacements: [id],
        type: QueryTypes.SELECT,
      }
    );

    if (user.length === 0) {
      return res.send({ status: false, message: "Usuario no encontrado" });
    }

    const nuevoAcceso = user[0].puede_acceder === 0 ? 1 : 0;

    await giama_renting.query(
      "UPDATE usuarios SET puede_acceder = ? WHERE id = ?",
      {
        replacements: [nuevoAcceso, id],
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
