import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { getExecutor } from "../../core/config/db.js";
import { ValidationError } from "../../core/errors/index.js";
import { reservasFilterSchema } from "./reservas.schema.js";
import { reservasService } from "./reservas.service.js";

export async function filtrarReservas(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const input = reservasFilterSchema.parse(req.body);
    const response = await reservasService.filtrar(input, req.context.id_agente, getExecutor());
    res.status(200).json(response);
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
