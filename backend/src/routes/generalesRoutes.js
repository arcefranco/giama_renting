import { Router } from "express";
import {
  getProveedoresGPS,
  getModelos,
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

export default generalesRouter;
