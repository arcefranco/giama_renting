import { Router } from "express";
import {
  postAlquiler,
  postFormaCobro,
  getFormasCobro,
  getAlquileresByIdVehiculo,
} from "../controllers/alquileresController.js";
const alquileresRouter = Router();
alquileresRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
alquileresRouter.post("/postAlquiler", postAlquiler);
alquileresRouter.post("/formaDeCobro", postFormaCobro);
alquileresRouter.get("/formaDeCobro", getFormasCobro);
alquileresRouter.post("/idVehiculo", getAlquileresByIdVehiculo);
export default alquileresRouter;
