import { Router } from "express";

import { filtrarReservas } from "./reservas.controller.js";

const reservasRouter = Router();

reservasRouter.post("/filtrar", filtrarReservas);

export { reservasRouter };
