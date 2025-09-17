import Router from "express";
import {
  postModelo,
  postProveedorGPS,
  postSucursal,
  deleteModelo,
  deleteProveedorGPS,
  deleteSucursal,
  updateModelo,
  updateProveedorGPS,
  updateSucursal,
  getModelosVehiculos,
  getModeloById,
  getSucursalById,
  getProveedorGPSById,
} from "../controllers/parametrosController.js";
import { auth } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/roles.js";
const parametrosRouter = Router();

parametrosRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

parametrosRouter.post("/postModelo", auth, postModelo);
parametrosRouter.post("/postProveedorGPS", auth, postProveedorGPS);
parametrosRouter.post("/postSucursal", auth, postSucursal);
parametrosRouter.post("/deleteModelo", auth, deleteModelo);
parametrosRouter.post("/deleteProveedorGPS", auth, deleteProveedorGPS);
parametrosRouter.post("/deleteSucursal", auth, deleteSucursal);
parametrosRouter.post("/updateModelo", auth, updateModelo);
parametrosRouter.post("/updateProveedorGPS", auth, updateProveedorGPS);
parametrosRouter.post("/updateSucursal", auth, updateSucursal);
parametrosRouter.get("/getModelosVehiculos", auth, getModelosVehiculos);
parametrosRouter.post("/getModeloById", auth, getModeloById);
parametrosRouter.post("/getSucursalById", auth, getSucursalById);
parametrosRouter.post("/getProveedorGPSById", auth, getProveedorGPSById);

export default parametrosRouter;
