import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { getExecutor } from "../../core/config/db.js";
import { ValidationError } from "../../core/errors/index.js";
import { viajerosQuerySchema } from "./viajeros.schema.js";
import { viajerosService } from "./viajeros.service.js";

export async function obtenerViajeros(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = viajerosQuerySchema.parse(req.query);
    const busqueda = query.busqueda ?? null;
    const params = [req.context.id_agente, busqueda, busqueda, busqueda, busqueda];
    const data = await viajerosService.listar(req.context.id_agente, params, getExecutor());
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof ZodError) {
      next(
        new ValidationError(
          "La petición contiene campos inválidos.",
          error.issues.map((issue) => ({
            field: issue.path.join("."),
            issue: issue.message,
          })),
        ),
      );
      return;
    }
    next(error);
  }
}
