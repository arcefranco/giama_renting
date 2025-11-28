import { transporter, transporterTrap } from "./transporter.js";
import dotenv from "dotenv";

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
    });
  } catch (error) {
    console.log(error);
    return JSON.stringify(error);
  }
};

export const sendEmailImportes = async (id_factura) => {
  try {
    transporter.sendMail({
      //Envio el mail a la casilla que encontramos segun su nombre de usuario
      from: "info@giama.com.ar",
      to: "farce@giama.com.ar",
      subject: "Error importes facturas",
      template: "facturas",
      context: {
        text: id_factura,
      },
    });
  } catch (error) {
    console.log(error);
    return JSON.stringify(error);
  }
};


