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
  /*   getAllCostosPeriodo,
  getAllAlquileresPeriodo,
  getAllAmortizaciones, */
  getAmortizacion,
  getCostoNetoVehiculo,
  getSituacionFlota,
  getFichas,
  postImagenesVehiculo,
} from "../controllers/vehiculosController.js";
import { upload } from "../middlewares/upload.js";
import { auth } from "../middlewares/auth.js";

const vehiculosRouter = Router();

vehiculosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
vehiculosRouter.get("/getVehiculos", auth, getVehiculos);
vehiculosRouter.post("/getVehiculosById", auth, getVehiculosById);
vehiculosRouter.post(
  "/postVehiculo",
  auth,
  upload.array("images"),
  postVehiculo
);
vehiculosRouter.post(
  "/postImagenesVehiculo",
  auth,
  upload.array("images"),
  postImagenesVehiculo
);
/* vehiculosRouter.post("/getAllCostosPeriodo", auth, getAllCostosPeriodo);
vehiculosRouter.post("/getAllAlquileresPeriodo", auth, getAllAlquileresPeriodo);
vehiculosRouter.get("/getAllAmortizaciones", auth, getAllAmortizaciones); */

vehiculosRouter.post("/getImagenesVehiculos", auth, getImagenesVehiculos);
vehiculosRouter.post("/eliminarImagenes", auth, eliminarImagenes);
vehiculosRouter.post("/updateVehiculo", auth, updateVehiculo);
vehiculosRouter.post("/getCostosPeriodo", auth, getCostosPeriodo);
vehiculosRouter.post("/getCostoNetoVehiculo", auth, getCostoNetoVehiculo);
vehiculosRouter.post("/getSituacionFlota", auth, getSituacionFlota);
vehiculosRouter.post("/getAlquileresPeriodo", auth, getAlquileresPeriodo);
vehiculosRouter.post("/getAmortizacion" /* , auth */, getAmortizacion);
vehiculosRouter.post("/getFichas", auth, getFichas);

export default vehiculosRouter;
