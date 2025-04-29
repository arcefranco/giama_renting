import { Router } from "express";
import { upload } from "../middlewares/upload.js";
import {
  getClientes,
  postCliente,
  getClientesById,
  getImagenesClientes,
  eliminarImagenes,
  updateCliente,
} from "../controllers/clientesController.js";
const clientesRouter = Router();
clientesRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
clientesRouter.post("/postCliente", upload.array("images"), postCliente);
clientesRouter.get("/getClientes", getClientes);
clientesRouter.post("/getclientesById", getClientesById);
clientesRouter.get("/getImagenesclientes/:id", getImagenesClientes);
clientesRouter.post("/eliminarImagenes", eliminarImagenes);
clientesRouter.post("/updateCliente", updateCliente);
export default clientesRouter;
