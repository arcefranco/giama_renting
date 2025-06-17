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
} from "../controllers/generalesController.js";

const generalesRouter = Router();

generalesRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

generalesRouter.get("/modelos", getModelos);
generalesRouter.get("/proveedoresGps", getProveedoresGPS);
generalesRouter.get("/provincias", getProvincias);
generalesRouter.get("/tipos_documento", getTiposDocumento);
generalesRouter.get("/tipos_responsable", getTiposResponsable);
generalesRouter.get("/tipos_sexo", getTiposSexo);
generalesRouter.get("/sucursales", getSucursales);
generalesRouter.get("/precios_modelos", getPreciosModelos);
generalesRouter.get("/estados", getEstados);
generalesRouter.get("/AMRT", getParametroAMRT);
export default generalesRouter;
