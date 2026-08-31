import express from "express";
import {
  getAsientos,
  getFacturas,
  getAsientoLineas,
  getFacturaItems
} from "../controllers/auditoriaController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.use(auth);

router.get("/asientos", getAsientos);
router.get("/asientos/:nroAsiento", getAsientoLineas);
router.get("/facturas", getFacturas);
router.get("/facturas/:idFactura/items", getFacturaItems);

export default router;
