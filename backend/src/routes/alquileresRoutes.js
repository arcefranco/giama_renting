import { Router } from "express";
import {
  postAlquiler,
  postFormaCobro,
  getFormasCobro,
  getAlquileresByIdVehiculo,
  getAlquileres,
  anulacionAlquiler,
  getAnulaciones,
  postContratoAlquiler,
  getContratosByIdVehiculo,
  getContratos,
  getContratoById,
  anulacionContrato,
  getAlquilerByIdContrato,
} from "../controllers/alquileresController.js";
import { auth } from "../middlewares/auth.js";
const alquileresRouter = Router();
alquileresRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
alquileresRouter.post("/contrato", auth, postContratoAlquiler);
alquileresRouter.post("/postAlquiler", /* auth, */ postAlquiler);
alquileresRouter.post("/formaDeCobro", auth, postFormaCobro);
alquileresRouter.get("/formaDeCobro", auth, getFormasCobro);
alquileresRouter.post("/idVehiculo", auth, getAlquileresByIdVehiculo);
alquileresRouter.post("/contrato/idVehiculo", auth, getContratosByIdVehiculo);
alquileresRouter.post("/id", getAlquilerByIdContrato);
alquileresRouter.post("/contrato/id", auth, getContratoById);
alquileresRouter.post("/", auth, getAlquileres);
alquileresRouter.post("/contratos", auth, getContratos);
alquileresRouter.post("/anulacion", auth, anulacionAlquiler);
alquileresRouter.post("/contrato/anulacion", auth, anulacionContrato);
alquileresRouter.post("/getAnulaciones", auth, getAnulaciones);
export default alquileresRouter;
