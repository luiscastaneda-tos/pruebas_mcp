# 📋 TASK-005: Módulos de Viajeros y Finanzas (Optimización de Queries)

- **Estado:** `LISTA` — `Q-VIA-01`, `Q-FIN-01` y `Q-FIN-02` aprobadas el 2026-09-03.
- **Agente Asignado:** `Backend` (sin `QA`/TDD en esta etapa — decisión vigente de Ángel)
- **Revisor:** `Lead`
- **Dependencias:** `TASK-002b`

---

## 1. Objetivo
Construir los módulos de **Viajeros** (`/viajeros`) y **Finanzas** (`/finanzas/saldo-credito`) sobre las queries del catálogo.

> ✅ **Desbloqueada:** `Q-VIA-01`, `Q-FIN-01` y `Q-FIN-02` aprobadas en [QUERIES.md](../QUERIES.md).
> **Contrato de finanzas simplificado el 2026-09-03** (ver `API_CONTRACT.md §2.4`): wallet ya no
> lleva `desglose` por método de pago; crédito ya no lleva `tiene_credito` ni `credito_utilizado`
> (sin bandera de crédito activo en el origen). La forma vigente es:
> `{ wallet: { saldo_a_favor_disponible }, credito: { limite_credito, credito_disponible } }`.

---

## 2. Criterios de Aceptación (Definition of Done)

### Módulo Viajeros (`/viajeros`):
- [ ] Ejecuta `Q-VIA-01` con el `id_agente` del contexto y el filtro opcional de búsqueda (`busqueda`).
- [ ] Mapea las filas a **exactamente** los campos del contrato: `id_viajero`, `nombre_completo`, `correo`, `numero_empleado`, `telefono`. Nada más, aunque la query devuelva más columnas.

### Módulo Finanzas (`/finanzas/saldo-credito`):
- [ ] Ejecuta `Q-FIN-01` (wallet) y `Q-FIN-02` (crédito) en paralelo con `Promise.all`.
- [ ] Mapea ambos resultados al DTO unificado definido en [API_CONTRACT.md](../API_CONTRACT.md).
- [ ] Las reglas de negocio del cálculo (qué saldos cuentan, cómo se deriva el crédito utilizado) **vienen resueltas en la query**. El service no las reimplementa ni las "corrige".

> Si el DTO del contrato requiere un campo que ninguna query devuelve, es una *Solicitud de Query*, no un cálculo a inventar en el service.

### Rutas expuestas:
- `GET /api/v1/viajeros`
- `GET /api/v1/finanzas/saldo-credito`

---

## 3. Entregables
1. `src/modules/viajeros/` (schema, repo, service, controller, router)
2. `src/modules/finanzas/` (schema, repo, service, controller, router)

> `tests/modules/*.test.ts` **no aplica en esta etapa** — TDD/QA suspendido por decisión vigente de
> Ángel (`HANDOFF.md §1.3`). Validación vía `npm run check:invariants`, `npm run lint` y
> `npx tsc --noEmit`.
