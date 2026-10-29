import { Router } from "express";
import {
  postContratoDigital,
  getContratosDigitales,
  getContratoDigitalById,
  buscarContratosParaDigital,
} from "../controllers/contratoDigitalController.js";
import { auth } from "../middlewares/auth.js";

const contratoDigitalRouter = Router();

contratoDigitalRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

contratoDigitalRouter.get("/buscar-contratos", auth, buscarContratosParaDigital);
contratoDigitalRouter.post("/", auth, postContratoDigital);
contratoDigitalRouter.get("/", auth, getContratosDigitales);
contratoDigitalRouter.get("/:id", auth, getContratoDigitalById);

export default contratoDigitalRouter;
