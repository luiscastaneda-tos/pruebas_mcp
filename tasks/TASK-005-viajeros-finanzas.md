# 📋 TASK-005: Módulos de Viajeros y Finanzas (Optimización de Queries)

- **Estado:** `BACKLOG`
- **Agente Asignado:** `Backend Dev Agent` & `Test & QA Agent`
- **Revisor:** `Antigravity (Lead Orchestrator)`
- **Dependencias:** `TASK-002`

---

## 1. Objetivo
Construir los módulos de **Viajeros** (`/viajeros`) y **Finanzas** (`/finanzas/saldo-credito`) rediseñando las queries SQL desde cero para eliminar la lentitud del backend anterior.

---

## 2. Criterios de Aceptación (Definition of Done)

### Módulo Viajeros (`/viajeros`):
- [ ] Query optimizada que cruza `viajeros` directamente con `agentes_viajeros` indexado por `id_agente`.
- [ ] Soporte para filtro opcional de búsqueda (`busqueda`) sobre nombre, apellido o email.
- [ ] Retorna únicamente: `id_viajero`, `nombre_completo`, `correo`, `numero_empleado`, `telefono`.

### Módulo Finanzas (`/finanzas/saldo-credito`):
- [ ] Consulta consolidada en paralelo (`Promise.all`):
  1. `saldos_a_favor`: Suma y desglose de saldos activos por método de pago para `id_agente`.
  2. `credito` y `agente_details`: Saldo de línea de crédito, límite y crédito utilizado.
- [ ] Retorna DTO unificado y amigable para IA.

### Rutas expuestas:
- `GET /api/v1/viajeros`
- `GET /api/v1/finanzas/saldo-credito`

---

## 3. Entregables
1. `src/modules/viajeros/` (schema, repo, service, controller, router)
2. `src/modules/finanzas/` (schema, repo, service, controller, router)
3. `tests/modules/viajeros.test.ts`
4. `tests/modules/finanzas.test.ts`
