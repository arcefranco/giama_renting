import { Router } from "express";
import { getProveedoresGPS } from "../controllers/generalesController";

const generalesRouter = Router();

generalesRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});

generalesRouter.get("/proveedoresGps", getProveedoresGPS);
