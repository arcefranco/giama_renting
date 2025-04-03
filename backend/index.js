import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

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
