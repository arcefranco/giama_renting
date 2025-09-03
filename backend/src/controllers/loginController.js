import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import pkg from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../helpers/sendEmail.js";
import { handleError, acciones } from "../../helpers/handleError.js";

dotenv.config();
const { sign, verify } = pkg;

export const createUsuario = async (req, res) => {
  const { email, nombre, roles } = req.body;
  const { user } = req.user;
  console.log(user);
  if (!email) {
    return res.send({ status: false, message: "El email es obligatorio." });
  }

  if (!roles) {
    return res.send({
      status: false,
      message: "El usuario debe tener un rol asignado",
    });
  }

  try {
    await giama_renting.query(
      "INSERT INTO usuarios (email, nombre, roles, usuario_alta) VALUES (?,?,?,?)",
      {
        replacements: [email, nombre ? nombre : null, roles, user],
        type: QueryTypes.INSERT,
      }
    );
  } catch (error) {
    console.log(error);
    const { body } = handleError(error, "Usuario", acciones.post);
    return res.send(body);
  }
  const payload = {
    email: email,
  };
  const token = sign(payload, process.env.SECRET, { expiresIn: "20m" });
  try {
    await sendEmail(email, token);
  } catch (error) {
    return res.send({
      status: false,
      message: JSON.stringify(error),
    });
  }

  return res.send({
    status: true,
    message: `Usuario creado. Se le envió un mail con un 
      link a la casilla indicada para que cree su contraseña`,
  });
};

export const createPass = async (req, res) => {
  const { password, token } = req.body;
  let hashPass = await bcrypt.hash(password, 10);
  let email;
  try {
    // Verificamos el token y extraemos el email
    const decoded = verify(token, process.env.SECRET);
    email = decoded.email;
  } catch (err) {
    return res.status(401).send({
      status: false,
      message: "Token inválido o expirado",
    });
  }
  try {
    await giama_renting.query(
      "UPDATE usuarios SET password  = ?, newUser = 0 WHERE email = ?",
      {
        replacements: [hashPass, email],
      }
    );
  } catch (error) {
    return res.send({
      status: false,
      message: JSON.stringify(error),
    });
  }
  return res.send({
    status: true,
    message: `Ya puede ingresar utilizando el email ${email} y la contraseña creada recientemente`,
  });
};

export const recoveryPass = async (req, res) => {
  const { email } = req.body;
  let emailExistente;
  if (!email) {
    return res.send({ status: false, message: "Faltan campos" });
  }
  emailExistente = await giama_renting.query(
    "SELECT * FROM usuarios WHERE email = ?",
    {
      type: QueryTypes.SELECT,
      replacements: [email],
    }
  );
  if (!emailExistente.length)
    return res.send({ status: false, message: "Email no registrado" });

  const payload = {
    email: email,
  };
  const token = sign(payload, process.env.SECRET, { expiresIn: "20m" });
  try {
    await sendEmail(email, token);
  } catch (error) {
    return res.send({
      status: false,
      message: JSON.stringify(error),
    });
  }
  return res.send({
    status: true,
    message:
      "Se le ha enviado un link a su casilla para reestablecer su contraseña",
  });
};

export const logIn = async (req, res) => {
  const { email, password } = req.body;
  /*   let roles; */
  let user;
  try {
    user = await giama_renting.query("SELECT * FROM usuarios WHERE email = ?", {
      replacements: [email],
      type: QueryTypes.SELECT,
    });
  } catch (error) {
    console.log(error);
    return res.send({
      status: false,
      message: JSON.stringify(error),
    });
  }
  if (!user.length)
    return res.send({ status: false, message: "Email no registrado" });
  try {
    let result = await bcrypt.compare(password, user[0].password);
    if (result) {
      const token = jwt.sign(
        {
          user: user[0].email,
          roles: user[0].roles,
          id: user[0].id,
        },
        process.env.SECRET,
        { expiresIn: 32400 } //9 horas
      );
      res.cookie("authToken", token, {
        httpOnly: true, // Evita acceso desde JavaScript del lado del cliente
        sameSite: "strict",
        maxAge: 32400000, // 9 horas en milisegundos
      });

      return res.send({
        status: true,
        username: user[0].email,
        nombre: user[0].nombre,
      });
    } else {
      throw "Email o contraseña incorrecta";
    }
  } catch (error) {
    return res.send({
      status: false,
      message: error,
    });
  }
};

export const validarToken = (req, res) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res
      .status(401)
      .json({ status: false, message: "Token no proporcionado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    return res.status(200).json({ status: true, user: decoded.user });
  } catch (error) {
    return res
      .status(403)
      .json({ status: false, message: "Token inválido o expirado" });
  }
};

export const logOut = (req, res) => {
  res.clearCookie("authToken");
  return res.status(200).json({ status: true, message: "Sesión cerrada" });
};
