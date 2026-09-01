import express from "express"; import request from "supertest"; import { describe, expect, it } from "vitest";
import { createAuthMiddleware, HeaderContextResolver } from "../../src/core/middleware/auth.js"; import { errorHandler } from "../../src/core/middleware/errorHandler.js";
const KEY="qa-api-key", AGENT="ce57342e-03e9-440f-b12f-16497f23b8bb", OTHER="11111111-1111-4111-8111-111111111111";
function app(downstream = (_req: express.Request, _res: express.Response) => undefined) { process.env.API_KEY=KEY; const a=express(); a.use(express.json()); a.use(createAuthMiddleware(new HeaderContextResolver())); a.get("/probe/:id",(req,res)=>{ downstream(req,res); if (!res.headersSent) res.json({context:req.context}); }); a.use(errorHandler); return a; }
describe("aislamiento multi-tenant core",()=>{
 it("sin API key responde 401 UNAUTHORIZED",async()=>{const r=await request(app()).get("/probe/x").set("x-id-agente",AGENT);expect(r.status).toBe(401);expect(r.body.error.code).toBe("UNAUTHORIZED");});
 it("sin contexto responde 400 MISSING_CONTEXT y no alcanza downstream",async()=>{let reached=false; const r=await request(app(()=>{reached=true;})).get("/probe/x").set("x-api-key",KEY);expect(r.status).toBe(400);expect(r.body.error.code).toBe("MISSING_CONTEXT");expect(reached).toBe(false);});
 it("rechaza UUID inválido",async()=>{const r=await request(app()).get("/probe/x").set("x-api-key",KEY).set("x-id-agente","not-a-uuid");expect(r.status).toBe(400);expect(r.body.error.code).toBe("MISSING_CONTEXT");});
 it("no toma id_agente del body/query/params",async()=>{const r=await request(app()).get(`/probe/${OTHER}`).set("x-api-key",KEY).set("x-id-agente",AGENT).query({id_agente:OTHER}).send({id_agente:OTHER});expect(r.body.context).toEqual({id_agente:AGENT});});
});
