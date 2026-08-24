import { Router } from "express";
import { getUsuarios, toggleAcceso } from "../controllers/usuariosController.js";
import { auth } from "../middlewares/auth.js";

const usuariosRouter = Router();

usuariosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

usuariosRouter.get("/", auth, getUsuarios);
usuariosRouter.post("/toggleAcceso/:id", auth, toggleAcceso);

export default usuariosRouter;
