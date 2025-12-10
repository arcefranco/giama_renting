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
  postImagenesCliente,
  /*   postClientesMasivo, */
} from "../controllers/clientesController.js";
import { auth } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/roles.js";
const clientesRouter = Router();
clientesRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
clientesRouter.post(
  "/postCliente",
  upload.array("images"),
  auth,
  authorizeRoles("3"),
  postCliente
);
clientesRouter.post(
  "/postImagenesCliente",
  upload.array("images"),
  auth,
  authorizeRoles("3"),
  postImagenesCliente
);
clientesRouter.get(
  "/getClientes",
  auth,
  authorizeRoles("5"),
  getClientes
);
clientesRouter.post("/getclientesById", auth,   authorizeRoles("5"), getClientesById);
clientesRouter.post("/getDateroByIdCliente", auth,   authorizeRoles("5"), getDateroByIdCliente);
clientesRouter.post("/getEstadoCliente", auth,   authorizeRoles("5"), getEstadoCliente);
clientesRouter.post("/getImagenesclientes", auth,   authorizeRoles("5"), getImagenesClientes);
clientesRouter.post("/eliminarImagenes", auth, authorizeRoles("3"), eliminarImagenes);
clientesRouter.post("/updateCliente", auth, authorizeRoles("3"), updateCliente);
/* clientesRouter.post(
  "/postClientesMasivo",
  upload.single("file"),
  postClientesMasivo
); */
export default clientesRouter;
