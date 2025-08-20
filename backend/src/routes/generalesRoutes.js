import { Router } from "express";
import {
  getProveedoresGPS,
  getModelos,
  getProvincias,
  getTiposDocumento,
  getTiposResponsable,
  getTiposSexo,
  getSucursales,
  getPreciosModelos,
  getParametroAMRT,
  getEstados,
  getPlanCuentas,
  getProveedores,
  getProveedoresVehiculo,
} from "../controllers/generalesController.js";
import { auth } from "../middlewares/auth.js";

const generalesRouter = Router();

generalesRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

generalesRouter.get("/modelos", auth, getModelos);
generalesRouter.get("/proveedoresGps", auth, getProveedoresGPS);
generalesRouter.get("/provincias", auth, getProvincias);
generalesRouter.get("/tipos_documento", auth, getTiposDocumento);
generalesRouter.get("/tipos_responsable", auth, getTiposResponsable);
generalesRouter.get("/tipos_sexo", auth, getTiposSexo);
generalesRouter.get("/sucursales", auth, getSucursales);
generalesRouter.get("/precios_modelos", auth, getPreciosModelos);
generalesRouter.get("/estados", auth, getEstados);
generalesRouter.get("/plan_cuentas", auth, getPlanCuentas);
generalesRouter.get("/proveedores", auth, getProveedores);
generalesRouter.get("/AMRT", auth, getParametroAMRT);
generalesRouter.get("/proveedores_vehiculo", auth, getProveedoresVehiculo);
export default generalesRouter;
