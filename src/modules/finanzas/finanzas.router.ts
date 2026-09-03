import { Router } from "express";

import { obtenerSaldoCredito } from "./finanzas.controller.js";

const finanzasRouter = Router();

finanzasRouter.get("/saldo-credito", obtenerSaldoCredito);

export { finanzasRouter };
