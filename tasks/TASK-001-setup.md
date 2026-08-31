# 📋 TASK-001: Setup del Proyecto & Entorno Vercel Serverless

- **Estado:** `BACKLOG`
- **Agente Asignado:** `Backend Dev Agent`
- **Revisor:** `Antigravity (Lead Orchestrator)`
- **Dependencias:** Ninguna

---

## 1. Objetivo
Inicializar el proyecto Node.js con TypeScript, configurar el compilador, dependencias esenciales (`express`, `zod`, `mysql2`, `dotenv`, `cors`, `vitest`) y la estructura base lista para desplegar en Vercel Serverless.

---

## 2. Criterios de Aceptación (Definition of Done)
- [ ] `package.json` con scripts (`dev`, `build`, `start`, `test`).
- [ ] `tsconfig.json` con tipado estricto (`strict: true`, target `ES2022`, module resolution `NodeNext`).
- [ ] `api/index.ts` y `vercel.json` configurados para Vercel Serverless.
- [ ] `src/app.ts` configurado con Express, parser JSON, CORS y health check (`GET /health`).
- [ ] Test unitario del health check pasando con Vitest.

---

## 3. Entregables
1. `package.json`
2. `tsconfig.json`
3. `vercel.json`
4. `api/index.ts`
5. `src/app.ts`
6. `src/server.ts`
7. `tests/health.test.ts`
