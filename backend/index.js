import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import vehiculosRouter from "./src/routes/vehiculosRoutes.js";
import generalesRouter from "./src/routes/generalesRoutes.js";
import loginRouter from "./src/routes/loginRoutes.js";
import clientesRouter from "./src/routes/clientesRoutes.js";
import costosRouter from "./src/routes/costosRoutes.js";
import alquileresRouter from "./src/routes/alquileresRoutes.js";
import recibosRouter from "./src/routes/recibosRoutes.js";
import parametrosRouter from "./src/routes/parametrosRoutes.js";
dotenv.config();
const app = express();
const corsOptions = {
  origin: process.env.HOST,
  credentials: true, // Permite envío de cookies
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.listen(process.env.PORT, (error) => {
  if (!error) console.log("Escuchando en puerto: " + process.env.PORT);
  else console.log("Ocurrió un error: ", error);
});
app.get("/", (req, res) => {
  return res.send("API giama_renting");
});
app.use("/public", express.static("public"));
app.use("/login", loginRouter);
app.use("/generales", generalesRouter);
app.use("/vehiculos", vehiculosRouter);
app.use("/clientes", clientesRouter);
app.use("/costos", costosRouter);
app.use("/alquileres", alquileresRouter);
app.use("/recibos", recibosRouter);
app.use("/parametros", parametrosRouter);
