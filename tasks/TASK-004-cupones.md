# 📋 TASK-004: Módulo de Cupones (Basado en `v2/cupon`)

- **Estado:** `BACKLOG`
- **Agente Asignado:** `Backend Dev Agent` & `Test & QA Agent`
- **Revisor:** `Antigravity (Lead Orchestrator)`
- **Dependencias:** `TASK-003`

---

## 1. Objetivo
Implementar el módulo de consulta de cupones de reservas basándose en el comportamiento de `v1/mia/reservas/v2/cupon?id=sol-...`. El endpoint debe resolver cupones de **hoteles, vuelos y rentas de autos**, ya sea mediante `id_solicitud` (`sol-...`), `id_booking` o `id_relacion`, devolviendo fichas estructuradas y enriquecidas.

---

## 2. Criterios de Aceptación (Definition of Done)
- [ ] **Repository (`cupones.repository.ts`):**
  - Consultas sobre `vw_new_details_booking`, `hospedaje`, `viajes_aereos`, `vuelos` y `renta_autos`.
  - Validación de que la reserva pertenezca al `id_agente` autenticado.
- [ ] **Service (`cupones.service.ts`):**
  - Detección automática del tipo de producto (`hotel`, `vuelo`, `renta_carros`).
  - Formateo limpio:
    - *Hotel:* Fechas checkin/out, tipo de habitación, desayuno, dirección y titular.
    - *Vuelo:* Tramos ida/vuelta, claves IATA, aerolíneas, horarios y franquicias de equipaje.
    - *Auto:* Arrendadora, modelo, conductor, fechas y sucursales.
- [ ] **Rutas expuestas:**
  - `GET /api/v1/cupones/:id` (unificado).
  - `GET /api/v1/cupones/hotel/:id_booking`.
  - `GET /api/v1/cupones/vuelo/:id_viaje_aereo`.
  - `GET /api/v1/cupones/auto/:id_renta_autos`.
- [ ] **Tests de Integración:**
  - Verificación de formateo de cupones con datos mockeados.

---

## 3. Entregables
1. `src/modules/cupones/cupones.schema.ts`
2. `src/modules/cupones/cupones.repository.ts`
3. `src/modules/cupones/cupones.service.ts`
4. `src/modules/cupones/cupones.controller.ts`
5. `src/modules/cupones/cupones.router.ts`
6. `tests/modules/cupones.test.ts`
