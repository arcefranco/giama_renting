import { transporter, transporterTrap } from "./transporter.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

export const sendEmail = async (email, token) => {
  try {
    transporter.sendMail({
      //Envio el mail a la casilla que encontramos segun su nombre de usuario
      from: "info@giama.com.ar",
      to: email,
      subject: "Crear contraseña",
      template: "index",
      context: {
        text: process.env.HOST + "/password/" + token + "/",
      },
      /*   html: '<p>Click <a href="http://localhost:3000/reset-password/' + id + '/' + token + '">here</a> to reset your password</p>', // html body */
    });
  } catch (error) {
    console.log(error);
    return JSON.stringify(error);
  }
};
