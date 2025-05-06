import { Router } from "express";
import {
  deleteConceptosCostos,
  getConceptosCostos,
  getConceptosCostosById,
  getCuentasContables,
  postConceptoCostos,
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
export default costosRouter;
