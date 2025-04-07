import { Router } from "express";
import { getVehiculos, postVehiculo } from "../controllers/vehiculosController";

const vehiculosRouter = Router();

vehiculosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

vehiculosRouter.get("/vehiculo", getVehiculos);
vehiculosRouter.post("/vehiculos", postVehiculo);

export default vehiculosRouter;
