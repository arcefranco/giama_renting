import { Router } from "express";
import {
  getVehiculos,
  postVehiculo,
  getImagenesVehiculos,
  getVehiculosById,
  updateVehiculo,
  eliminarImagenes,
  getCostosPeriodo,
  getAlquileresPeriodo,
  getAllCostosPeriodo,
  getAllAlquileresPeriodo,
  getAmortizacion,
  getAllAmortizaciones,
  getCostoNetoVehiculo,
  getSituacionFlota,
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
vehiculosRouter.post("/getVehiculosById", getVehiculosById);
vehiculosRouter.post("/postVehiculo", upload.array("images"), postVehiculo);
vehiculosRouter.get("/getImagenesVehiculos/:id", getImagenesVehiculos);
vehiculosRouter.post("/eliminarImagenes", eliminarImagenes);
vehiculosRouter.post("/updateVehiculo", updateVehiculo);
vehiculosRouter.post("/getCostosPeriodo", getCostosPeriodo);
vehiculosRouter.post("/getCostoNetoVehiculo", getCostoNetoVehiculo);
vehiculosRouter.post("/getSituacionFlota", getSituacionFlota);
vehiculosRouter.post("/getAlquileresPeriodo", getAlquileresPeriodo);
vehiculosRouter.post("/getAllCostosPeriodo", getAllCostosPeriodo);
vehiculosRouter.post("/getAllAlquileresPeriodo", getAllAlquileresPeriodo);
vehiculosRouter.post("/getAmortizacion", getAmortizacion);
vehiculosRouter.get("/getAllAmortizaciones", getAllAmortizaciones);
export default vehiculosRouter;
