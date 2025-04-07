import { QueryTypes } from "sequelize";
import { giama_renting } from "../../helpers/connection.js";
import pkg from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../helpers/sendEmail.js";
dotenv.config();
const { sign } = pkg;

export const createUsuario = async (req, res) => {
  const { nombre, email } = req.body;

  if (!nombre || !email) {
    return res.send({ status: false, message: "Faltan campos" });
  }
  try {
    await PA_Usados.query("INSERT INTO usuarios (nombre, email) VALUES (?,?)", {
      replacements: [nombre, email],
      type: QueryTypes.INSERT,
    });
  } catch (error) {
    return res.send({
      status: false,
      message: `error al insertar en base de datos: ${error}`,
    });
  }
  const payload = {
    email: email,
  };
  const token = sign(payload, process.env.SECRET, { expiresIn: "3h" });
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
  try {
    await PA_Usados.query(
      "UPDATE usuarios SET password  = ?, newUser = 0 WHERE email = ?",
      {
        replacements: [hashPass, pkg.decode(token)?.email],
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

export const logIn = async (req, res) => {
  const { email, password } = req.body;
  let roles;
  let user;
  try {
    user = await giama_renting.query("SELECT * FROM usuarios WHERE email = ?", {
      replacements: [email],
      type: QueryTypes.SELECT,
    });
  } catch (error) {
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
          password: user[0].password,
          roles: roles.map((item) => item.codigo),
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
        roles: roles?.map((item) => item.codigo),
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
