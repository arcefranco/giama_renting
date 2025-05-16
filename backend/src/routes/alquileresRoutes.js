import { Router } from "express";
import {
  postAlquiler,
  postFormaCobro,
  getFormasCobro,
} from "../controllers/alquileresController.js";
const alquileresRouter = Router();
alquileresRouter.use((req, res, next) => {
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
alquileresRouter.post("/postAlquiler", postAlquiler);
alquileresRouter.post("/formaDeCobro", postFormaCobro);
alquileresRouter.get("/formaDeCobro", getFormasCobro);
export default alquileresRouter;
