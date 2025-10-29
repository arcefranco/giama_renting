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
  getContratosByIdCliente,
} from "../controllers/alquileresController.js";
import { auth } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/roles.js";
const alquileresRouter = Router();
alquileresRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
alquileresRouter.post(
  "/contrato",
  auth,
  authorizeRoles("2"),
  postContratoAlquiler
);
alquileresRouter.post("/postAlquiler", auth, authorizeRoles("2"), postAlquiler);
alquileresRouter.post(
  "/formaDeCobro",
  auth,
  authorizeRoles("2"),
  postFormaCobro
);
alquileresRouter.get(
  "/formaDeCobro",
  auth,
  authorizeRoles("2", "3"),
  getFormasCobro
);
alquileresRouter.post("/idVehiculo", auth, getAlquileresByIdVehiculo);
alquileresRouter.post("/contrato/idVehiculo", auth, getContratosByIdVehiculo);
alquileresRouter.post("/contrato/idCliente", auth, getContratosByIdCliente);
alquileresRouter.post("/id", getAlquilerByIdContrato);
alquileresRouter.post(
  "/contrato/id",
  auth,
  authorizeRoles("2", "3", "4"),
  getContratoById
);
alquileresRouter.post("/", auth, authorizeRoles("2", "3", "4"), getAlquileres);
alquileresRouter.post(
  "/contratos",
  auth,
  authorizeRoles("2", "3", "4"),
  getContratos
);
alquileresRouter.post("/anulacion", auth, anulacionAlquiler);
alquileresRouter.post("/contrato/anulacion", auth, anulacionContrato);
alquileresRouter.post("/getAnulaciones", auth, getAnulaciones);
export default alquileresRouter;
