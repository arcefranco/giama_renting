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
import { authorizeRoles } from "../middlewares/roles.js";
const costosRouter = Router();

costosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

costosRouter.get(
  "/cuentasContables",
  auth,
  authorizeRoles("2"),
  getCuentasContables
);
costosRouter.post("/concepto", auth, authorizeRoles("2"), postConceptoCostos);
costosRouter.get("/concepto", auth, authorizeRoles("2"), getConceptosCostos);
costosRouter.post(
  "/getConceptosCostosById",
  auth,
  authorizeRoles("2"),
  getConceptosCostosById
);
costosRouter.post(
  "/updateConcepto",
  auth,
  authorizeRoles("2"),
  updateConceptoCostos
);
costosRouter.post(
  "/deleteConcepto",
  auth,
  authorizeRoles("2"),
  deleteConceptosCostos
);
costosRouter.post(
  "/costos_ingresos",
  auth,
  authorizeRoles("2"),
  postCostos_Ingresos
);
costosRouter.post(
  "/costos_ingresos_id_vehiculo",
  auth,
  authorizeRoles("2"),
  getCostosIngresosByIdVehiculo
);
costosRouter.post("/prorrateoIE", auth, authorizeRoles("2"), prorrateoIE);
export default costosRouter;
