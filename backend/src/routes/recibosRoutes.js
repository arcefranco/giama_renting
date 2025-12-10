import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { anulacionRecibo, getReciboById, getRecibos, getRecibosByFormaCobro } from "../controllers/recibosController.js";
import { authorizeRoles } from "../middlewares/roles.js";
const recibosRouter = Router();
recibosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

recibosRouter.post("/getReciboById", auth, authorizeRoles("5"), getReciboById);
recibosRouter.get("/getRecibos", auth, authorizeRoles("5"), getRecibos);
recibosRouter.post("/getRecibosByFormaCobro", auth, authorizeRoles("5"), getRecibosByFormaCobro);
recibosRouter.post("/anulacionRecibo", auth, authorizeRoles("2"), anulacionRecibo)
export default recibosRouter;
