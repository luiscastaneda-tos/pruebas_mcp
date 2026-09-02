# 🤝 HANDOFF — MIA Backend Gateway

**Última actualización:** 2 de septiembre de 2026  
**Repositorio:** `/Users/angelcstd/Documents/Programación/trabajo/pruebas_mcp`  
**Estado:** `4/7 tareas completadas` (TASK-001, TASK-002, TASK-002b, TASK-003, TASK-004 ✅).  
**Siguiente paso:** `TASK-005 — Módulos Viajeros y Finanzas`.

---

## 1. Alcance y Reglas Operativas Vigentes

1. **Backend Puro:** Este repositorio construye únicamente el backend REST en TypeScript/Express sobre arquitectura limpia desplegable en Vercel. MCPs, bots y frontends son clientes externos.
2. **Mecanismo de Ejecución con Codex CLI:**
   El Lead Orchestrator delega la escritura de código a Codex CLI mediante:
   ```bash
   /Users/angelcstd/.local/bin/codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check -C "/Users/angelcstd/Documents/Programación/trabajo/pruebas_mcp" "<INSTRUCCION_ESPECIFICA>" < /dev/null
   ```
   > ⚠️ **REGLA OBLIGATORIA:** El Lead Orchestrator **DEBE presentar la propuesta y pedir confirmación/visto bueno al usuario SIEMPRE antes de ejecutar a Codex**. Nunca ejecutar en segundo plano sin autorización expresa.
3. **Comandos y Validación:**
   * **PROHIBIDO `npm run build`:** Utilizar `npm run dev` (`tsx watch src/server.ts`) para el entorno activo.
   * **Validación estática obligatoria:** `npm run check:invariants` (cero violaciones), `npm run lint` (cero advertencias/errores), y `npx tsc --noEmit` (cero errores de compilación).
   * **Sin pruebas HTTP contra BD:** NO hacer peticiones `curl` ni tests de integración contra la base de datos hasta que el usuario la conecte.
   * **QA / TDD omitido:** No generar archivos `.test.ts` ni correr ciclos TDD en esta etapa para optimizar tokens y velocidad de entrega.
4. **Cero `any`:** Únicamente interfaces, tipos explícitos, genéricos o `unknown` con type guards.
5. **Gate de Invariantes Estricto (`scripts/check-invariants.mjs`):**
   * Archivos `*.queries.ts`: solo importaciones de tipos y constantes exportadas con string literal estático (o template literals sin sustitución).
   * Archivos `*.repository.ts`: llamadas exactas `executor.execute(QUERY_IMPORTADA_DIRECTAMENTE, params)`. Prohibido crear aliases o destructurar `executor`.
   * Archivos `*.controller.ts`: validación obligatoria y directa de `req.body` y `req.params` con Zod (`schema.parse(req.body)` / `schema.parse(req.params)`). Prohibido acceder a propiedades antes de validar.
   * Tenant: `req.context.id_agente` consumido directamente, sin destructurar.
6. **Catálogo de Queries ([QUERIES.md](./QUERIES.md)):** Única fuente de SQL del proyecto. Ningún agente inventa SQL. Toda query es provista o aprobada por Ángel.

---

## 2. Estado de Tareas Completadas (4/7)

* ✅ **TASK-001 — Setup y Base:** Configuración TypeScript estricto, Express, Vercel, `GET /health` y gate de invariantes (`scripts/check-invariants.mjs`).
* ✅ **TASK-002 — Core DB y Auth:** Configuración de entorno (`env.ts` con Zod), pool MySQL y `QueryExecutor` (`db.ts`), errores tipados (`errors/index.ts`), `errorHandler.ts` y middleware de autenticación con `HeaderContextResolver` (`auth.ts`).
* ✅ **TASK-002b — Testing Infra y Drenado de Health:** Corrección del socket en `GET /health` (drenado en streaming sin reset), suite base y helpers.
* ✅ **TASK-003 — Módulo de Reservas:**
  * Endpoints: `POST /api/v1/reservas/filtrar`.
  * Queries: `Q-RES-01` (listado) y `Q-RES-02` (conteo) ejecutadas en paralelo con 24 y 19 parámetros posicionales.
  * Lógica: Normalización de servicios (`flyght → vuelo`, `car_rental → renta_carros`), limpieza de nombres, filtros temporales (`proximas`, `en_curso`, `pasadas`, `todas`), paginación y pares de fechas.
* ✅ **TASK-004 — Módulo de Cupones:**
  * Endpoints:
    * `GET /api/v1/cupones/hotel/:id_booking`
    * `GET /api/v1/cupones/vuelo/:id_viaje_aereo`
    * `GET /api/v1/cupones/auto/:id_renta_autos`
    * `GET /api/v1/cupones/:id` (unificado)
  * Queries: `Q-AGE-01` (existencia del agente), `Q-CUP-01` (resolución de tipo/relación), `Q-CUP-02` (detalle hotel), `Q-CUP-03` (cabecera y tramos vuelo), `Q-CUP-04` (detalle auto).
  * Lógica: Verificación previa del agente, mapeo de fichas estructuradas según contrato, rutas específicas antes del comodín `/:id`.

> 📌 **Tarea Pendiente Documentada:** La vinculación estricta de pertenencia del cupón y reserva por `id_agente` dentro de los JOINs de las consultas se implementará en una fase posterior una vez que la base de datos esté plenamente conectada y verificada.

---

## 3. Punto Exacto de Reanudación: TASK-005

**Objetivo:** Construir los módulos de **Viajeros** y **Finanzas**.

### Endpoints a Implementar:
1. `GET /api/v1/viajeros` — Directorio de viajeros del agente autenticado (requiere `Q-VIA-01`).
2. `GET /api/v1/finanzas/wallet` — Desglose de wallet y saldos a favor (requiere `Q-FIN-01`).
3. `GET /api/v1/finanzas/credito` — Estado de línea de crédito (requiere `Q-FIN-02`).

### Instrucciones para el Nuevo Agente:
1. Revisa si las queries `Q-VIA-01`, `Q-FIN-01` y `Q-FIN-02` se encuentran en el backend legacy (`/Users/angelcstd/Documents/Programación/trabajo/bacl`) o solicítalas a Ángel.
2. Registra las queries aprobadas en `QUERIES.md`.
3. Presenta a Ángel el plan de archivos para `src/modules/viajeros/` y `src/modules/finanzas/`.
4. **Pide aprobación explícita antes de ejecutar a Codex CLI.**
5. Una vez aprobado, ejecuta Codex, valida con `npm run check:invariants && npm run lint && npx tsc --noEmit`.
