import { Router } from "express";
import {
  createPass,
  createUsuario,
  logIn,
  validarToken,
  logOut,
  recoveryPass,
} from "../controllers/loginController.js";
const loginRouter = Router();
import { auth } from "../middlewares/auth.js";
import { authorizeAdmin } from "../middlewares/roles.js";

loginRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

loginRouter.post("/createPass", createPass);
loginRouter.post("/createUsuario", auth, authorizeAdmin(), createUsuario);
loginRouter.post("/recovery", recoveryPass);
loginRouter.post("/login", logIn);
loginRouter.get("/validar-token", validarToken);
loginRouter.get("/logout", logOut);

export default loginRouter;
