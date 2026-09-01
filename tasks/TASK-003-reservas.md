# 📋 TASK-003: Módulo de Reservas

- **Estado:** `BACKLOG`
- **Agente Asignado:** `Backend` & `QA`
- **Revisor:** `Lead`
- **Dependencias:** `TASK-002b`

---

## 1. Objetivo
Construir el módulo de consulta de reservas siguiendo la arquitectura limpia, forzando el filtro de `id_agente` y las temporalidades exclusivas (`proximas`, `en_curso`, `pasadas`, `todas`) para proteger el consumo de tokens y memoria.

> ⛔ **Bloqueada hasta recibir `Q-RES-01` y `Q-RES-02`** ([QUERIES.md](../QUERIES.md)).
> El agente no escribe SQL ni conoce el esquema. Si algo falta, emite una *Solicitud de Query* y detiene la tarea.

---

## 2. Criterios de Aceptación (Definition of Done)
- [ ] **DTOs / Schemas Zod (`reservas.schema.ts`):**
  - `temporalidad`: enum `['proximas', 'en_curso', 'pasadas', 'todas']` (**requerido**), con las fronteras y orden definidos en `API_CONTRACT.md`.
  - `id_viajero`: string opcional (formato `via-...`).
  - `tipo_servicio`: enum `['hotel', 'vuelo', 'renta_carros', 'todos']` opcional.
  - `codigo_confirmacion`: string opcional (coincidencia parcial sin distinguir mayúsculas).
  - `startDate` / `endDate`: strings `YYYY-MM-DD` opcionales como par; `startDate <= endDate`; filtran `check_in` dentro del rango inclusivo.
  - `page` (default 1), `length` (default 10, max 20).
- [ ] **Queries (`reservas.queries.ts`):**
  - Copia **literal** de `Q-RES-01` y `Q-RES-02` del catálogo. Sin modificar una sola línea.
- [ ] **Repository (`reservas.repository.ts`):**
  - Ejecuta las queries del catálogo con parámetros posicionales (`?`). **No construye SQL.**
  - El `id_agente` se pasa siempre desde `req.context`, nunca desde el input del cliente.
  - Data query y count query en paralelo (`Promise.all`) para la metadata de paginación.
  - `page` / `length` se validan como números antes de pasarse; jamás se interpolan como string.
- [ ] **Service (`reservas.service.ts`):**
  - Lógica pura de negocio y transformación de filas a DTOs limpios (sin campos basura de UI).
  - Normaliza los tipos internos `flyght → vuelo` y `car_rental → renta_carros`; `hotel` se conserva.
  - Recorta extremos y colapsa cualquier secuencia de espacios en nombres a un solo espacio.
- [ ] **Controller & Router (`reservas.controller.ts`, `reservas.router.ts`):**
  - Expone **únicamente** `POST /api/v1/reservas/filtrar`. No hay variante `GET` — ver la nota del endpoint en [API_CONTRACT §2.1](../API_CONTRACT.md).
- [ ] **Tests (QA):**
  - Usan el `mockExecutor` y la convención de fixtures de [TASK-002b](./TASK-002b-testing-infra.md). No se improvisa un mock nuevo.
  - Fixtures construidos desde las "Filas de ejemplo" de `Q-RES-01` / `Q-RES-02`.
  - Verifican que no se pueda consultar sin `id_agente` ni sin `temporalidad`.

---

## 3. Entregables
1. `src/modules/reservas/reservas.schema.ts`
2. `src/modules/reservas/reservas.queries.ts`
3. `src/modules/reservas/reservas.repository.ts`
4. `src/modules/reservas/reservas.service.ts`
5. `src/modules/reservas/reservas.controller.ts`
6. `src/modules/reservas/reservas.router.ts`
7. `tests/modules/reservas.test.ts`
