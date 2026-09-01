import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createAuthMiddleware, HeaderContextResolver, type ContextResolver, type RequestContext } from "../../src/core/middleware/auth.js";
import { errorHandler } from "../../src/core/middleware/errorHandler.js";

const API_KEY = "qa-api-key";
const AGENT = "ce57342e-03e9-440f-b12f-16497f23b8bb";
const OTHER_AGENT = "11111111-1111-4111-8111-111111111111";

function appWith(middleware: RequestHandler) {
  const app = express();
  app.use(express.json());
  app.use(middleware);
  app.post("/probe/:id", (req, res) => res.json({ context: req.context }));
  app.use(errorHandler);
  return app;
}

describe("auth y contexto multi-tenant", () => {
  it("awaits an injected async ContextResolver and assigns the complete context", async () => {
    const resolve = vi.fn(async (_req: Parameters<ContextResolver["resolve"]>[0]): Promise<RequestContext> => ({ id_agente: AGENT }));
    const resolver: ContextResolver = { resolve };
    const app = appWith(createAuthMiddleware(resolver));
    const response = await request(app).post(`/probe/${OTHER_AGENT}`).set("x-api-key", API_KEY)
      .set("x-id-agente", AGENT).send({ id_agente: OTHER_AGENT });
    expect(response.status).toBe(200);
    expect(response.body.context).toEqual({ id_agente: AGENT });
    expect(resolve).toHaveBeenCalledOnce();
    expect(resolve.mock.calls[0]?.[0]).toMatchObject({ method: "POST", path: `/probe/${OTHER_AGENT}` });
  });

  it("resuelve credenciales válidas exclusivamente desde headers", async () => {
    process.env.API_KEY = API_KEY;
    const app = appWith(createAuthMiddleware(new HeaderContextResolver()));
    const response = await request(app).post(`/probe/${OTHER_AGENT}`).set("x-api-key", API_KEY)
      .set("x-id-agente", AGENT).query({ id_agente: OTHER_AGENT }).send({ id_agente: OTHER_AGENT });
    expect(response.status).toBe(200);
    expect(response.body.context.id_agente).toBe(AGENT);
  });

  it.each([
    ["missing", undefined], ["wrong", "wrong-key"],
  ])("rechaza API key %s con 401 UNAUTHORIZED", async (_label, key) => {
    process.env.API_KEY = API_KEY;
    const req = request(appWith(createAuthMiddleware(new HeaderContextResolver()))).post("/probe/x")
      .set("x-id-agente", AGENT);
    if (key) req.set("x-api-key", key);
    const response = await req.send({});
    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: "UNAUTHORIZED" } });
    expect(response.body.error.details).toBeUndefined();
  });

  it("no habilita Authorization/token como fallback", async () => {
    process.env.API_KEY = API_KEY;
    const response = await request(appWith(createAuthMiddleware(new HeaderContextResolver())))
      .post("/probe/x").set("Authorization", `Bearer ${API_KEY}`).set("x-id-agente", AGENT).send({});
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it.each([undefined, "not-a-uuid", "12345"]) ("rechaza x-id-agente inválido (%s) con 400 MISSING_CONTEXT", async (agent) => {
    process.env.API_KEY = API_KEY;
    const req = request(appWith(createAuthMiddleware(new HeaderContextResolver()))).post("/probe/x").set("x-api-key", API_KEY);
    if (agent) req.set("x-id-agente", agent);
    const response = await req.send({ id_agente: AGENT });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, error: { code: "MISSING_CONTEXT" } });
  });
});
