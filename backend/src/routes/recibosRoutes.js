import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { anulacionRecibo, getReciboById, getRecibos } from "../controllers/recibosController.js";
const recibosRouter = Router();
recibosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

recibosRouter.post("/getReciboById", auth, getReciboById);
recibosRouter.get("/getRecibos", auth, getRecibos);
recibosRouter.post("/anulacionRecibo", auth, authorizeAdmin(), anulacionRecibo);
export default recibosRouter;
