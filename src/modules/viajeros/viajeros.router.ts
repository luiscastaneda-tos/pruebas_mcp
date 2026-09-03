import { Router } from "express";

import { obtenerViajeros } from "./viajeros.controller.js";

const viajerosRouter = Router();

viajerosRouter.get("/", obtenerViajeros);

export { viajerosRouter };
