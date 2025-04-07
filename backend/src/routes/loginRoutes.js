import { Router } from "express";
import {
  createPass,
  createUsuario,
  logIn,
} from "../controllers/loginController.js";
const loginRouter = Router();

loginRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

loginRouter.post("/createPass", createPass);
loginRouter.post("/createUsuario", createUsuario);
loginRouter.post("/login", logIn);

export default loginRouter;
