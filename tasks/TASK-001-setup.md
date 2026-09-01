# 📋 TASK-001: Setup del Proyecto & Entorno Vercel Serverless

- **Estado:** `COMPLETED`
- **Agentes Asignados:** `QA` (tests) y `Backend` (implementación, después)
- **Revisor:** `Lead`
- **Dependencias:** Ninguna

---

## 1. Objetivo
Inicializar el proyecto Node.js con TypeScript, configurar el compilador, dependencias esenciales (`express`, `zod`, `mysql2`, `dotenv`, `cors`, `vitest`), el **gate mecánico de invariantes** y la estructura base lista para desplegar en Vercel Serverless.

---

## 2. Criterios de Aceptación (Definition of Done)
- [ ] `package.json` con scripts (`dev`, `build`, `start`, `test`, `lint`, `check:invariants`).
- [ ] `tsconfig.json` con tipado estricto (`strict: true`, target `ES2022`, module resolution `NodeNext`).
- [ ] `api/index.ts` y `vercel.json` configurados para Vercel Serverless.
- [ ] `src/app.ts` configurado con Express, parser JSON, CORS y health check público (`GET /health`), sin requerir `x-api-key` ni `x-id-agente`.
- [ ] Test unitario del health check pasando con Vitest.

### Contrato de health check

`GET /health` comprueba únicamente que el proceso HTTP está disponible. No consulta la base de
datos ni expone fecha, uptime, versión, configuración o variables de entorno.

Responde `200` con `Content-Type: application/json` y esta forma exacta:

```json
{
  "success": true,
  "message": "Servicio disponible.",
  "data": {
    "status": "ok"
  }
}
```

La respuesta no incluye `metadata`.

Hardening requerido tras red team:

- [ ] El parser JSON global no intercepta `GET /health`: un body malformado o mayor al límite no
  cambia su respuesta normativa ni provoca HTML, trazas o rutas internas.
- [ ] La aplicación deshabilita el header `X-Powered-By`.

### Gate de invariantes (`scripts/check-invariants.mjs`)

Script que sale con código ≠ 0 — y por tanto falla el build — si detecta cualquiera de estas tres cosas. Ver [ORCHESTRATION_LOOP §3](../ORCHESTRATION_LOOP.md).

- [ ] **SQL dinámico:** un backtick o una concatenación con `+` dentro de cualquier `src/**/*.queries.ts`.
- [ ] **`id_agente` desde el cliente:** una lectura de `id_agente` sobre `req.body`, `req.query` o `req.params` en cualquier archivo de `src/`.
- [ ] **SQL fuera del catálogo:** un repositorio que ejecuta un string literal en vez de una constante importada de un `*.queries.ts`.

Requisitos del script:

- [ ] Reporta archivo y línea de cada violación, no solo "falló".
- [ ] Es determinista y no necesita red ni base de datos.
- [ ] **No lee `tests/`** — el Backend lo ejecuta como validación local (ver [`agents/BACKEND.md`](../agents/BACKEND.md)).
- [ ] Tiene su propio test: un fixture con las tres violaciones que el script debe detectar, y uno limpio que debe pasar. Un gate que no se prueba a sí mismo puede estar pasando siempre.

Modelo verificable aprobado tras Security 2/3: **allowlist sintáctica estricta**.

- [ ] En `*.queries.ts` solo se permiten constantes exportadas cuyo valor sea un string literal.
  Puede haber imports de tipos, comentarios y varias constantes; no se permiten templates,
  concatenaciones, `join`, `concat`, `replace`, condicionales, funciones, variables de entorno,
  reasignaciones ni propiedades dinámicas para construir SQL.
- [ ] Un repositorio solo puede ejecutar una constante importada directamente desde un
  `*.queries.ts`, con la forma `executor.execute(QUERY_CONSTANT, params)`. No se permiten aliases,
  destructuring, `bind`, `call`, claves calculadas ni variables intermedias para el ejecutor o la
  query. Un método ordinario llamado `query` o `execute` fuera de esa forma no se considera SQL por
  su nombre solamente.
- [ ] Los controladores validan el input HTTP crudo directamente mediante un schema Zod aprobado y
  consumen el tenant únicamente como `req.context.id_agente`. No pueden extraer `id_agente` de
  `req.body`, `req.query` o `req.params`, ni mediante aliases, destructuring, claves calculadas o
  reflexión.
- [ ] La única frontera autorizada para crear `req.context` es el middleware de autenticación de
  `src/core/middleware/auth.ts`, mediante un `ContextResolver` inyectado. En el contrato vigente el
  resolver obtiene el UUID de `x-id-agente`; una futura implementación por token deberá verificarlo
  antes de devolver el mismo contexto y requerirá un cambio contractual independiente.
- [ ] La asignación permitida es `req.context = await contextResolver.resolve(req)`: el resolver
  recibe la petición HTTP y devuelve el `RequestContext` completo, no un UUID suelto que el
  middleware vuelva a ensamblar.
- [ ] QA prueba tanto formas permitidas como desviaciones de esta gramática. Security audita la
  gramática acotada; el gate no pretende resolver flujo arbitrario de JavaScript/TypeScript.

Contrato de testabilidad del gate:

- [ ] En uso normal escanea `src/` relativo al directorio de trabajo actual.
- [ ] QA crea proyectos mínimos temporales con su propio `src/`, ejecuta allí el gate en un proceso
  hijo y elimina los temporales al terminar. No se duplica la aplicación ni se lee `tests/` durante
  la ejecución normal del gate.
- [ ] La verificación de mutación de TASK-001 deshabilita temporalmente la detección de
  `id_agente` leído desde el cliente; el test del gate debe ponerse rojo. El Lead revierte la
  mutación y confirma verde.
- [ ] Orden TDD de bootstrap: QA escribe primero los tests; Backend prepara únicamente el runner;
  QA confirma rojo antes de que exista la funcionalidad; después Backend implementa sin leer tests.

---

## 3. Entregables
1. `package.json`
2. `tsconfig.json`
3. `vercel.json`
4. `api/index.ts`
5. `src/app.ts`
6. `src/server.ts`
7. `scripts/check-invariants.mjs`
8. `tests/health.test.ts`
9. `tests/checkInvariants.test.ts`
