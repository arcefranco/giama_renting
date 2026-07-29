import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/roles.js";
import {postPago, ctaCteCliente, fichaCtaCte, getEstadoDeuda, anulacionFactura, anulacionRecibo, anulacionDeuda, postDevolucionGarantia, exportarCtacteCliente} from "../controllers/ctacteController.js";
const ctacteRouter = Router();
ctacteRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

ctacteRouter.post("/pago", auth, authorizeRoles("2"), postPago);
ctacteRouter.post("/ctacteCliente", auth, authorizeRoles("2"), ctaCteCliente);
ctacteRouter.post("/exportarCtacteCliente", auth, authorizeRoles("2"), exportarCtacteCliente);
ctacteRouter.post("/fichaCtaCte", auth, authorizeRoles("2"), fichaCtaCte);
ctacteRouter.post("/getEstadoDeuda", auth, authorizeRoles("2"), getEstadoDeuda);
ctacteRouter.post("/anulacionFactura", auth, authorizeRoles("2"), anulacionFactura);
ctacteRouter.post("/anulacionRecibo", auth, authorizeRoles("2"), anulacionRecibo);
ctacteRouter.post("/anulacionDeuda", auth, authorizeRoles("2"), anulacionDeuda);
ctacteRouter.post("/devolucionGarantia", auth, authorizeRoles("2"), postDevolucionGarantia);
export default ctacteRouter;