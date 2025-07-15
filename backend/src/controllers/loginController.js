import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import pkg from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../helpers/sendEmail.js";
dotenv.config();
const { sign, verify } = pkg;

export const createUsuario = async (req, res) => {
  const { email, nombre } = req.body;

  if (!email) {
    return res.send({ status: false, message: "Faltan campos" });
  }

  try {
    await giama_renting.query(
      "INSERT INTO usuarios (email, nombre) VALUES (?,?)",
      {
        replacements: [email, nombre ? nombre : null],
        type: QueryTypes.INSERT,
      }
    );
  } catch (error) {
    console.log(error);
    return res.send({
      status: false,
      message: `error al insertar en base de datos: ${error}`,
    });
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
    message: "Contraseña creada con exito!",
  });
};

export const recoveryPass = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.send({ status: false, message: "Faltan campos" });
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
  try {
    let result = await bcrypt.compare(password, user[0].password);
    if (result) {
      const token = jwt.sign(
        {
          user: user[0].email,
          /*           roles: roles.map((item) => item.codigo), */
          id: user[0].id,
        },
        process.env.SECRET,
        { expiresIn: 7200 } //2 horas
      );
      res.cookie("authToken", token, {
        httpOnly: true, // Evita acceso desde JavaScript del lado del cliente
        sameSite: "strict", // Previene envío entre sitios
        maxAge: 7200000, // 2 horas en milisegundos
      });

      return res.send({
        status: true,
        username: user[0].email,
        nombre: user[0].nombre,
        /*         roles: roles?.map((item) => item.codigo), */
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
