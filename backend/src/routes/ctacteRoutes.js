import { Router } from "express";
import { auth } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/roles.js";
import {postPago, ctaCteCliente, fichaCtaCte} from "../controllers/ctacteController.js";
const ctacteRouter = Router();
ctacteRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

ctacteRouter.post("/pago", auth, authorizeRoles("2"), postPago);
ctacteRouter.post("/ctacteCliente", auth, ctaCteCliente);
ctacteRouter.get("/fichaCtaCte", fichaCtaCte)
export default ctacteRouter;