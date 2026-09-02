import { Router } from "express";

import {
  obtenerCuponAuto,
  obtenerCuponHotel,
  obtenerCuponUnificado,
  obtenerCuponVuelo,
} from "./cupones.controller.js";

const cuponesRouter = Router();

cuponesRouter.get("/hotel/:id_booking", obtenerCuponHotel);
cuponesRouter.get("/vuelo/:id_viaje_aereo", obtenerCuponVuelo);
cuponesRouter.get("/auto/:id_renta_autos", obtenerCuponAuto);
cuponesRouter.get("/:id", obtenerCuponUnificado);

export { cuponesRouter };
