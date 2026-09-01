# 📋 TASK-002: Capa Core (Base de Datos, Contexto Multi-Tenant y Errores)

- **Estado:** `COMPLETED`
- **Agentes Asignados:** `QA` (tests primero) y `Backend` (implementación después)
- **Revisor:** `Lead`
- **Dependencias:** `TASK-001`

---

## 1. Objetivo
Implementar la infraestructura base: pool de conexiones MySQL con el patrón `getExecutor(conn)`, middleware de autenticación por `x-api-key`, resolución inyectable del contexto multi-tenant `id_agente`, y jerarquía tipada de errores (`AppError`, `ValidationError`, `NotFoundError`).

---

## 2. Criterios de Aceptación (Definition of Done)
- [ ] `src/core/config/db.ts`: Pool de MySQL (`mysql2/promise`) y contrato estable
  `QueryExecutor` como objeto con método `execute(sql, params): Promise<rows>`.
  `getExecutor(conn?)` devuelve ese objeto: usa la conexión recibida dentro de transacciones y el
  pool cuando se omite para queries independientes. Nunca crea ni transforma SQL.
- [ ] `src/core/config/env.ts`: exporta `loadEnv(source = process.env)` y valida con Zod al arrancar
  la app. Exige `API_KEY`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y `DB_PORT`; transforma
  `DB_PORT` a entero válido y falla de forma explícita ante configuración ausente o inválida.
- [ ] `src/core/middleware/auth.ts`:
  - Define un `ContextResolver` con la firma
    `resolve(req: Request): Promise<RequestContext>`, donde el tipo estable `RequestContext` es
    `{ id_agente: string }`, y una fábrica de middleware que recibe ese resolver.
  - Exporta de forma estable `RequestContext`, `ContextResolver`, `HeaderContextResolver` y
    `createAuthMiddleware(contextResolver)` para que el mecanismo vigente sea sustituible sin tocar
    consumidores.
  - La implementación vigente del resolver valida las credenciales y obtiene `id_agente` desde
    headers. El middleware asigna el resultado completo mediante
    `req.context = await contextResolver.resolve(req)`. Controladores, servicios y repositorios no
    conocen headers ni el mecanismo de auth.
  - Valida el header `x-api-key`.
  - Extrae `x-id-agente` **exclusivamente del header** y lo inyecta en `req.context.id_agente`.
  - Valida que sea un UUID en formato string (**no** un entero).
  - Rechaza con `401` / `UNAUTHORIZED` si falta o es inválida la API Key.
  - Rechaza con `400` / `MISSING_CONTEXT` si falta o es inválido el `id_agente`.
  - Propaga errores tipados mediante `next(error)`; no duplica el formateo JSON. El
    `errorHandler` global es quien produce el cuerpo contractual, por lo que los harnesses HTTP de
    auth deben montar ambos middlewares.

> 🔒 **Regla de aislamiento:** el `id_agente` **nunca** se lee del body, del query string ni de los params.
> Aceptarlo desde ahí permitiría a un cliente consultar datos de otra agencia. Los repositorios lo reciben
> únicamente desde `req.context`.

### Preparación para autenticación por token

La fuente de identidad puede cambiar sin cambiar el contrato interno: en una tarea futura se sustituirá
el resolver de headers por uno que verifique firma, emisor, audiencia y vigencia del token antes de
extraer el claim de agencia. Ambos producen el mismo `RequestContext`.

- [ ] En TASK-002 se implementa y habilita **solo** el resolver vigente por headers.
- [ ] No se acepta `Authorization`, no se agrega un parser de token incompleto y no existe fallback
  automático entre token y `x-id-agente`.
- [ ] La futura migración decidirá explícitamente si `x-api-key` permanece, cambia el contrato público,
  agrega sus propias pruebas de seguridad y selecciona un único resolver confiable por despliegue.
- [ ] Ningún claim se considera confiable antes de verificar criptográficamente el token.
- [ ] `src/core/errors/`: Clases de error tipadas (`AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`).
- [ ] `src/core/middleware/errorHandler.ts`: Manejador global que formatea **exactamente** la forma de error de [API_CONTRACT §1](../API_CONTRACT.md) — `success: false` y `error: { code, message }`, con `details` solo en `VALIDATION_ERROR`. En `INTERNAL_ERROR` el detalle va al log, nunca a la respuesta.
- [ ] Todo error cuyo código de salida sea `INTERNAL_ERROR`, incluido un `AppError` tipado de nivel
  500, registra el error/detalle interno antes de devolver un mensaje genérico sin `details`.
- [ ] Tests unitarios de autenticación y manejo de errores pasando al 100%.
- [ ] Los tests de DB usan un texto opaco como sentinel para verificar forwarding; no inventan SQL.
  `tests/helpers/mockExecutor.ts` sigue siendo entregable exclusivo de TASK-002b.
- [ ] Los tests del pool verifican comportamiento observable sin imponer import default o named de
  `mysql2/promise`; ambas formas válidas de consumir la dependencia quedan fuera del contrato.

---

## 3. Entregables
1. `src/core/config/db.ts`
2. `src/core/config/env.ts`
3. `src/core/middleware/auth.ts`
4. `src/core/middleware/errorHandler.ts`
5. `src/core/errors/index.ts`
6. `tests/core/auth.test.ts`
7. `tests/core/errorHandler.test.ts`
