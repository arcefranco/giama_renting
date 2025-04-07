import nodemailer from "nodemailer";
import path from "path";
import hbs from "nodemailer-express-handlebars";
import dotenv from "dotenv";
dotenv.config();
const { createTransport } = nodemailer;

export const transporter = createTransport({
  //Credenciales para enviar mail
  host: "smtp.elasticemail.com",
  port: 2525,
  secure: false,
  auth: {
    user: process.env.ELASTIC_USER,
    pass: process.env.ELASTIC_PASS,
  },
  tls: {
    secure: false,
    ignoreTLS: true,
    rejectUnauthorized: false,
  },
});

export const transporterTrap = createTransport({
  //Credenciales para enviar mail
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  secure: false,
  auth: {
    user: process.env.MAIL_TRAP_USER,
    pass: process.env.MAIL_TRAP_PASS,
  },
  tls: {
    secure: false,
    ignoreTLS: true,
    rejectUnauthorized: false,
  },
});

const handlebarOptions = {
  viewEngine: {
    extName: ".handlebars",
    partialsDir: path.resolve("./views"),
    defaultLayout: false,
  },
  viewPath: path.resolve("./views"),
  extName: ".handlebars",
};

const handlebarOptionsTrap = {
  viewEngine: {
    extName: ".handlebars",
    partialsDir: path.resolve("./views"),
    defaultLayout: false,
  },
  viewPath: path.resolve("./views"),
  extName: ".handlebars",
};

transporter.use("compile", hbs(handlebarOptions));

transporterTrap.use("compile", hbs(handlebarOptionsTrap));
