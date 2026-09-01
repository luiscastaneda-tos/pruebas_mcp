import type { NextFunction, Request, RequestHandler, Response } from "express";
import { z } from "zod";

import { AppError, UnauthorizedError } from "../errors/index.js";

export type RequestContext = { id_agente: string };

export interface ContextResolver {
  resolve(req: Request): Promise<RequestContext>;
}

export class HeaderContextResolver implements ContextResolver {
  public constructor(private readonly expectedApiKey = process.env.API_KEY ?? "") {}

  public resolve(req: Request): Promise<RequestContext> {
    const apiKey = req.header("x-api-key");
    if (apiKey === undefined || apiKey !== this.expectedApiKey) {
      throw new UnauthorizedError("API Key inválida o ausente.");
    }

    const idAgente = req.header("x-id-agente");
    const parsed = z.string().check(z.uuid()).safeParse(idAgente);
    if (!parsed.success) {
      throw new AppError("El contexto de agencia es requerido y debe ser un UUID válido.", 400, "MISSING_CONTEXT");
    }
    return Promise.resolve({ id_agente: parsed.data });
  }
}

export function createAuthMiddleware(contextResolver: ContextResolver): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      req.context = await contextResolver.resolve(req);
      next();
    } catch (error) {
      next(error);
    }
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      context: RequestContext;
    }
  }
}
