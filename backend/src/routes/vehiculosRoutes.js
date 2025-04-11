import { Router } from "express";
import {
  getVehiculos,
  postVehiculo,
} from "../controllers/vehiculosController.js";
import { upload } from "../middlewares/upload.js";

const vehiculosRouter = Router();

vehiculosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
vehiculosRouter.get("/getVehiculos", getVehiculos);
vehiculosRouter.post("/postVehiculo", upload.array("images"), postVehiculo);

export default vehiculosRouter;
