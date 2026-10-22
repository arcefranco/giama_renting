import { Router } from "express";
import {
  postSiniestro,
  getSiniestros,
  getSiniestroById,
  updateSiniestro,
  updateSiniestroEstado,
  buscarContratos,
} from "../controllers/siniestrosController.js";
import { auth } from "../middlewares/auth.js";

const siniestrosRouter = Router();

siniestrosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

siniestrosRouter.get("/buscar-contrato", auth, buscarContratos);
siniestrosRouter.post("/", auth, postSiniestro);
siniestrosRouter.get("/", auth, getSiniestros);
siniestrosRouter.get("/:id", auth, getSiniestroById);
siniestrosRouter.put("/:id", auth, updateSiniestro);
siniestrosRouter.patch("/:id/estado", auth, updateSiniestroEstado);

export default siniestrosRouter;
