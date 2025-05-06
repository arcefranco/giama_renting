import { Router } from "express";
import {
  getCuentasContables,
  postConceptoCostos,
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
export default costosRouter;
