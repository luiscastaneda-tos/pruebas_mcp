import type { ErrorRequestHandler } from "express";

import { AppError, ValidationError } from "../errors/index.js";

// Express identifies error middleware by its four-argument signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next): void => {
  if (error instanceof AppError) {
    if (error.statusCode === 500 || error.code === "INTERNAL_ERROR") {
      console.error(error);
    }
    const body: { success: false; error: { code: string; message: string; details?: unknown } } = {
      success: false,
      error: { code: error.code, message: error.message },
    };
    if (error instanceof ValidationError && error.details !== undefined) {
      body.error.details = error.details;
    }
    res.status(error.statusCode).json(body);
    return;
  }

  console.error(error);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Ocurrió un error interno." },
  });
};
