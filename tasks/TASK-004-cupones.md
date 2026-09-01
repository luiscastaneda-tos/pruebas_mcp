# 📋 TASK-004: Módulo de Cupones

- **Estado:** `BACKLOG`
- **Agente Asignado:** `Backend` & `QA`
- **Revisor:** `Lead`
- **Dependencias:** `TASK-003`

---

## 1. Objetivo
Implementar el módulo de consulta de cupones. El endpoint debe resolver cupones de **hoteles, vuelos y rentas de autos**, ya sea mediante `id_solicitud` (`sol-...`), `id_booking` o `id_relacion`, devolviendo fichas estructuradas y limpias.

> ⛔ **Bloqueada hasta recibir `Q-CUP-01` … `Q-CUP-04`** ([QUERIES.md](../QUERIES.md)).
> El agente no escribe SQL ni conoce el esquema, y **no adapta la lógica del backend legacy**.
> Toda la resolución de datos llega como query aprobada.

---

## 2. Criterios de Aceptación (Definition of Done)
- [ ] **Queries (`cupones.queries.ts`):**
  - Copia literal de `Q-CUP-01` … `Q-CUP-04` del catálogo.
- [ ] **Repository (`cupones.repository.ts`):**
  - Ejecuta las queries del catálogo con parámetros posicionales. **No construye SQL.**
  - Pasa siempre el `id_agente` del contexto, de modo que la query valide la pertenencia de la reserva.
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
- [ ] **Tests (QA):**
  - Usan el `mockExecutor` y la convención de fixtures de [TASK-002b](./TASK-002b-testing-infra.md).
  - Verifican el formateo de los tres tipos de cupón contra la forma de [API_CONTRACT §2.2](../API_CONTRACT.md).
  - `tramos` se prueba con un vuelo sencillo (un elemento) además del redondo: el cliente no debe asumir que siempre hay dos.
  - Un cupón que pertenece a otro `id_agente` responde `404 NOT_FOUND` — nunca `403` ni el recurso.

---

## 3. Entregables
1. `src/modules/cupones/cupones.schema.ts`
2. `src/modules/cupones/cupones.queries.ts`
3. `src/modules/cupones/cupones.repository.ts`
4. `src/modules/cupones/cupones.service.ts`
5. `src/modules/cupones/cupones.controller.ts`
6. `src/modules/cupones/cupones.router.ts`
7. `tests/modules/cupones.test.ts`
