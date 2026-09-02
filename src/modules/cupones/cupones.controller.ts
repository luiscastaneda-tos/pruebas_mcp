import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { getExecutor } from "../../core/config/db.js";
import { ValidationError } from "../../core/errors/index.js";
import {
  cuponAutoParamsSchema,
  cuponHotelParamsSchema,
  cuponIdParamsSchema,
  cuponVueloParamsSchema,
} from "./cupones.schema.js";
import { cuponesService } from "./cupones.service.js";

function forwardError(error: unknown, next: NextFunction): void {
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

export async function obtenerCuponUnificado(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = cuponIdParamsSchema.parse(req.params);
    const response = await cuponesService.getCuponUnificado(
      params.id,
      req.context.id_agente,
      getExecutor(),
    );
    res.status(200).json(response);
  } catch (error) {
    forwardError(error, next);
  }
}

export async function obtenerCuponHotel(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = cuponHotelParamsSchema.parse(req.params);
    const response = await cuponesService.getCuponHotel(
      params.id_booking,
      req.context.id_agente,
      getExecutor(),
    );
    res.status(200).json(response);
  } catch (error) {
    forwardError(error, next);
  }
}

export async function obtenerCuponVuelo(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = cuponVueloParamsSchema.parse(req.params);
    const response = await cuponesService.getCuponVuelo(
      params.id_viaje_aereo,
      req.context.id_agente,
      getExecutor(),
    );
    res.status(200).json(response);
  } catch (error) {
    forwardError(error, next);
  }
}

export async function obtenerCuponAuto(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const params = cuponAutoParamsSchema.parse(req.params);
    const response = await cuponesService.getCuponAuto(
      params.id_renta_autos,
      req.context.id_agente,
      getExecutor(),
    );
    res.status(200).json(response);
  } catch (error) {
    forwardError(error, next);
  }
}
