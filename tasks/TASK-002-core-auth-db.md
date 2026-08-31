# 📋 TASK-002: Capa Core (Base de Datos, Contexto Multi-Tenant y Errores)

- **Estado:** `BACKLOG`
- **Agente Asignado:** `Backend Dev Agent`
- **Revisor:** `Antigravity (Lead Orchestrator)`
- **Dependencias:** `TASK-001`

---

## 1. Objetivo
Implementar la infraestructura base: pool de conexiones MySQL con el patrón `getExecutor(conn)`, middleware de autenticación por `x-api-key` e inyección del contexto multi-tenant `id_agente`, y jerarquía tipada de errores (`AppError`, `ValidationError`, `NotFoundError`).

---

## 2. Criterios de Aceptación (Definition of Done)
- [ ] `src/core/config/db.ts`: Pool de MySQL (`mysql2/promise`) con función `getExecutor(conn)` que soporte transacciones y queries independientes.
- [ ] `src/core/config/env.ts`: Validación de variables de entorno con Zod al arrancar la app.
- [ ] `src/core/middleware/auth.ts`:
  - Valida el header `x-api-key`.
  - Extrae `x-id-agente` **exclusivamente del header** y lo inyecta en `req.context.id_agente`.
  - Valida que sea un UUID en formato string (**no** un entero).
  - Rechaza con 401 si falta la API Key o con 400 si falta / es inválido el `id_agente`.

> 🔒 **Regla de aislamiento:** el `id_agente` **nunca** se lee del body, del query string ni de los params.
> Aceptarlo desde ahí permitiría a un cliente consultar datos de otra agencia. Los repositorios lo reciben
> únicamente desde `req.context`.
- [ ] `src/core/errors/`: Clases de error tipadas (`AppError`, `ValidationError`, `NotFoundError`, `UnauthorizedError`).
- [ ] `src/core/middleware/errorHandler.ts`: Manejador global que formatea respuestas consistentes para cualquier cliente.
- [ ] Tests unitarios de autenticación y manejo de errores pasando al 100%.

---

## 3. Entregables
1. `src/core/config/db.ts`
2. `src/core/config/env.ts`
3. `src/core/middleware/auth.ts`
4. `src/core/middleware/errorHandler.ts`
5. `src/core/errors/index.ts`
6. `tests/core/auth.test.ts`
7. `tests/core/errorHandler.test.ts`
