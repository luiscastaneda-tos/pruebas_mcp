# 📋 TASK-003: Módulo de Reservas (`/reservas` sobre `vw_new_details_booking`)

- **Estado:** `BACKLOG`
- **Agente Asignado:** `Backend Dev Agent` & `Test & QA Agent`
- **Revisor:** `Antigravity (Lead Orchestrator)`
- **Dependencias:** `TASK-002`

---

## 1. Objetivo
Construir el módulo de consulta de reservas siguiendo la arquitectura limpia. Debe consultar la vista `vw_new_details_booking` forzando el filtro de `id_agente` y los filtros de temporalidad (`proximas` vs `pasadas`) para proteger el consumo de tokens y memoria.

---

## 2. Criterios de Aceptación (Definition of Done)
- [ ] **DTOs / Schemas Zod (`reservas.schema.ts`):**
  - `temporalidad`: enum `['proximas', 'pasadas', 'todas']` (**requerido**).
  - `id_viajero`: number opcional.
  - `nombre_viajero`: string opcional (LIKE).
  - `tipo_servicio`: enum `['hotel', 'vuelo', 'renta_carros', 'todos']` opcional.
  - `codigo_confirmacion`: string opcional.
  - `page` (default 1), `length` (default 10, max 20).
- [ ] **Repository (`reservas.repository.ts`):**
  - Query SQL dinámico y parametrizado sobre `vw_new_details_booking`.
  - Inyecta obligatoriamente `WHERE id_agente = ?`.
  - Temporalidad:
    - `'proximas'`: `check_in >= CURDATE()`.
    - `'pasadas'`: `check_out < CURDATE()`.
  - Count query en paralelo para metadata de paginación (`Promise.all`).
- [ ] **Service (`reservas.service.ts`):**
  - Lógica pura de negocio y transformación de filas a DTOs limpios (sin campos basura de UI).
- [ ] **Controller & Router (`reservas.controller.ts`, `reservas.router.ts`):**
  - Expone `POST /api/v1/reservas/filtrar` y `GET /api/v1/reservas`.
- [ ] **Tests de Integración:**
  - Pruebas con mock de base de datos verificando que no se pueda consultar sin `id_agente` ni sin `temporalidad`.

---

## 3. Entregables
1. `src/modules/reservas/reservas.schema.ts`
2. `src/modules/reservas/reservas.repository.ts`
3. `src/modules/reservas/reservas.service.ts`
4. `src/modules/reservas/reservas.controller.ts`
5. `src/modules/reservas/reservas.router.ts`
6. `tests/modules/reservas.test.ts`
