import type { NextFunction, Request, Response } from "express";

import { getExecutor } from "../../core/config/db.js";
import { finanzasService } from "./finanzas.service.js";

export async function obtenerSaldoCredito(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await finanzasService.obtenerSaldoCredito(
      req.context.id_agente,
      getExecutor(),
    );
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
