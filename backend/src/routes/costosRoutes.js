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
const costosRouter = Router();

costosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

costosRouter.get("/cuentasContables", getCuentasContables);
costosRouter.post("/concepto", postConceptoCostos);
costosRouter.get("/concepto", getConceptosCostos);
costosRouter.post("/getConceptosCostosById", getConceptosCostosById);
costosRouter.post("/updateConcepto", updateConceptoCostos);
costosRouter.post("/deleteConcepto", deleteConceptosCostos);
costosRouter.post("/costos_ingresos", postCostos_Ingresos);
costosRouter.post(
  "/costos_ingresos_id_vehiculo",
  getCostosIngresosByIdVehiculo
);
costosRouter.post("/prorrateoIE", prorrateoIE);
export default costosRouter;
