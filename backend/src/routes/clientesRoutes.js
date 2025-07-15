import { Router } from "express";
import { upload } from "../middlewares/upload.js";
import {
  getClientes,
  postCliente,
  getClientesById,
  getImagenesClientes,
  eliminarImagenes,
  updateCliente,
  getDateroByIdCliente,
  getEstadoCliente,
} from "../controllers/clientesController.js";
import { auth } from "../middlewares/auth.js";
const clientesRouter = Router();
clientesRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
clientesRouter.post("/postCliente", upload.array("images"), auth, postCliente);
clientesRouter.get("/getClientes", auth, getClientes);
clientesRouter.post("/getclientesById", auth, getClientesById);
clientesRouter.post("/getDateroByIdCliente", auth, getDateroByIdCliente);
clientesRouter.post("/getEstadoCliente", auth, getEstadoCliente);
clientesRouter.post("/getImagenesclientes", auth, getImagenesClientes);
clientesRouter.post("/eliminarImagenes", auth, eliminarImagenes);
clientesRouter.post("/updateCliente", auth, updateCliente);
export default clientesRouter;
