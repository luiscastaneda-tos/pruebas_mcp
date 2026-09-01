import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { AppError, ValidationError, NotFoundError, UnauthorizedError } from "../../src/core/errors/index.js";
import { errorHandler } from "../../src/core/middleware/errorHandler.js";

function appThrow(error: unknown) {
  const app = express();
  app.get("/", (_req, _res, next) => next(error));
  app.use(errorHandler);
  return app;
}

describe("errorHandler", () => {
  it("formatea VALIDATION_ERROR con details", async () => {
    const response = await request(appThrow(new ValidationError("La petición contiene campos inválidos.", [{ field: "temporalidad", issue: "Requerido" }]))).get("/");
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ success: false, error: { code: "VALIDATION_ERROR", message: "La petición contiene campos inválidos.", details: [{ field: "temporalidad", issue: "Requerido" }] } });
  });

  it.each([
    [new NotFoundError("Reserva", "x"), 404, "NOT_FOUND"],
    [new UnauthorizedError("Credencial inválida"), 401, "UNAUTHORIZED"],
    [new AppError("boom", 500, "INTERNAL_ERROR", { secret: true }), 500, "INTERNAL_ERROR"],
  ] as const)("emits standard error shape without details for %s", async (error, status, code) => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await request(appThrow(error)).get("/");
    expect(response.status).toBe(status);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe(code);
    expect(response.body.error.message).toBeTypeOf("string");
    expect(response.body.error.details).toBeUndefined();
    if (code === "INTERNAL_ERROR") expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("hides unhandled error detail behind generic INTERNAL_ERROR", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await request(appThrow(new Error("database password"))).get("/");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ success: false, error: { code: "INTERNAL_ERROR", message: expect.any(String) } });
    expect(JSON.stringify(response.body)).not.toContain("database password");
    spy.mockRestore();
  });
});
