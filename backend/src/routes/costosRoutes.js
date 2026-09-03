import { Router } from "express";
import {
  deleteConceptosCostos,
  getConceptosCostos,
  getConceptosCostosById,
  getCostosIngresosByIdVehiculo,
  getCuentasContables,
  postConceptoCostos,
  postCostos_Ingresos,
  updateConceptoCostos,
  prorrateo,
  ingresos_seguros
} from "../controllers/costosController.js";
import { auth } from "../middlewares/auth.js";

import { upload } from "../middlewares/upload.js";
import { importacionesMultas, importacionesTelepases, preprocesarMultas, confirmarImportacionMultas } from "../controllers/importacionesController.js";

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
  getCuentasContables
);
costosRouter.post("/concepto", auth, postConceptoCostos);
costosRouter.get("/concepto", auth, getConceptosCostos);
costosRouter.post(
  "/getConceptosCostosById",
  auth,
  getConceptosCostosById
);
costosRouter.post(
  "/updateConcepto",
  auth,
  updateConceptoCostos
);
costosRouter.post(
  "/deleteConcepto",
  auth,
  deleteConceptosCostos
);
costosRouter.post(
  "/costos_ingresos",
  auth,
  postCostos_Ingresos
);
costosRouter.post(
  "/ingresos_seguros",
  auth,
  ingresos_seguros
);
costosRouter.post(
  "/costos_ingresos_id_vehiculo",
  auth,
  getCostosIngresosByIdVehiculo
);
costosRouter.post(
  "/preprocesarMultas",
  auth,
  upload.single("file"),
  preprocesarMultas
);
costosRouter.post(
  "/confirmarImportacionMultas",
  auth,
  confirmarImportacionMultas
);
costosRouter.post(
  "/importacionMultas",
  auth,
  upload.single("file"),
  importacionesMultas 
);
costosRouter.post(
  "/importacionTelepases",
  auth,
  upload.single("file"),
  importacionesTelepases 
);

costosRouter.post("/prorrateo", auth, prorrateo);
export default costosRouter;
