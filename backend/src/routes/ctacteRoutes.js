import { Router } from "express";
import { auth } from "../middlewares/auth.js";

import {postPago, ctaCteCliente, fichaCtaCte, getEstadoDeuda, anulacionFactura, anulacionRecibo, anulacionDeuda, postDevolucionGarantia, exportarCtacteCliente} from "../controllers/ctacteController.js";
const ctacteRouter = Router();
ctacteRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

ctacteRouter.post("/pago", auth, postPago);
ctacteRouter.post("/ctacteCliente", auth, ctaCteCliente);
ctacteRouter.post("/exportarCtacteCliente", auth, exportarCtacteCliente);
ctacteRouter.post("/fichaCtaCte", auth, fichaCtaCte);
ctacteRouter.post("/getEstadoDeuda", auth, getEstadoDeuda);
ctacteRouter.post("/anulacionFactura", auth, anulacionFactura);
ctacteRouter.post("/anulacionRecibo", auth, anulacionRecibo);
ctacteRouter.post("/anulacionDeuda", auth, anulacionDeuda);
ctacteRouter.post("/devolucionGarantia", auth, postDevolucionGarantia);
export default ctacteRouter;