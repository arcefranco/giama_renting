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
  postVehiculosMasivos,
} from "../controllers/vehiculosController.js";
import { upload } from "../middlewares/upload.js";
import { auth } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/roles.js";

const vehiculosRouter = Router();

vehiculosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
vehiculosRouter.get(
  "/getVehiculos",
  auth,
  authorizeRoles("5"),
  getVehiculos
);
vehiculosRouter.post(
  "/getVehiculosById",
  auth,
  authorizeRoles("5"),
  getVehiculosById
);
vehiculosRouter.post(
  "/postVehiculo",
  auth,
  authorizeRoles("2"),
  upload.array("images"),
  postVehiculo
);
vehiculosRouter.post(
  "/postImagenesVehiculo",
  auth,
  authorizeRoles("4", "3"),
  upload.array("images"),
  postImagenesVehiculo
);
vehiculosRouter.post(
  "/postVehiculosMasivos",
  auth,
  authorizeRoles("2"),
  upload.single("file"),
  postVehiculosMasivos
);
/* vehiculosRouter.post("/getAllCostosPeriodo", auth, getAllCostosPeriodo);
vehiculosRouter.post("/getAllAlquileresPeriodo", auth, getAllAlquileresPeriodo);
vehiculosRouter.get("/getAllAmortizaciones", auth, getAllAmortizaciones); */

vehiculosRouter.post("/getImagenesVehiculos", auth, getImagenesVehiculos);
vehiculosRouter.post("/eliminarImagenes", auth, eliminarImagenes);
vehiculosRouter.post(
  "/updateVehiculo",
  auth,
  authorizeRoles("2", "4"),
  updateVehiculo
);
vehiculosRouter.post("/getCostosPeriodo", auth, getCostosPeriodo);
vehiculosRouter.post("/getCostoNetoVehiculo", auth, getCostoNetoVehiculo);
vehiculosRouter.post(
  "/getSituacionFlota",
  auth,
  authorizeRoles("5"),
  getSituacionFlota
);
vehiculosRouter.post("/getAlquileresPeriodo", auth, authorizeRoles("5"), getAlquileresPeriodo);
vehiculosRouter.post("/getAmortizacion", auth, authorizeRoles("5"), getAmortizacion);
vehiculosRouter.post(
  "/getFichas",
  auth,
  authorizeRoles("5"),
  getFichas
);

export default vehiculosRouter;
