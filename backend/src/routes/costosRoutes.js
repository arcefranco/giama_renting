import { Router } from "express";
import {
  deleteConceptosCostos,
  getConceptosCostos,
  getConceptosCostosById,
  getCostosIngresosByIdVehiculo,
  getCuentasContables,
  postConceptoCostos,
  postCostos_Ingresos,
  prorrateoIE,
  updateConceptoCostos,
} from "../controllers/costosController.js";
import { auth } from "../middlewares/auth.js";
const costosRouter = Router();

costosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

costosRouter.get("/cuentasContables", auth, getCuentasContables);
costosRouter.post("/concepto", auth, postConceptoCostos);
costosRouter.get("/concepto", auth, getConceptosCostos);
costosRouter.post("/getConceptosCostosById", auth, getConceptosCostosById);
costosRouter.post("/updateConcepto", auth, updateConceptoCostos);
costosRouter.post("/deleteConcepto", auth, deleteConceptosCostos);
costosRouter.post("/costos_ingresos", auth, postCostos_Ingresos);
costosRouter.post(
  "/costos_ingresos_id_vehiculo",
  auth,
  getCostosIngresosByIdVehiculo
);
costosRouter.post("/prorrateoIE", auth, prorrateoIE);
export default costosRouter;
