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
const alquileresRouter = Router();
alquileresRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
alquileresRouter.post("/contrato", postContratoAlquiler);
alquileresRouter.post("/postAlquiler", postAlquiler);
alquileresRouter.post("/formaDeCobro", postFormaCobro);
alquileresRouter.get("/formaDeCobro", getFormasCobro);
alquileresRouter.post("/idVehiculo", getAlquileresByIdVehiculo);
alquileresRouter.post("/contrato/idVehiculo", getContratosByIdVehiculo);
alquileresRouter.post("/id", getAlquilerByIdContrato);
alquileresRouter.post("/contrato/id", getContratoById);
alquileresRouter.post("/", getAlquileres);
alquileresRouter.post("/contratos", getContratos);
alquileresRouter.post("/anulacion", anulacionAlquiler);
alquileresRouter.post("/contrato/anulacion", anulacionContrato);
alquileresRouter.post("/getAnulaciones", getAnulaciones);
export default alquileresRouter;
