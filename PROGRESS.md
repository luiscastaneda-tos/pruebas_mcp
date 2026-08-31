# 📊 Tablero de Progreso del Proyecto (PROGRESS.md)

Dashboard maestro de seguimiento de sprints, estado de tareas y asignaciones de agentes en el **MIA Backend Gateway**.

---

## 📈 Estado General del Proyecto

- **Fase Actual:** `FASE 1: Planeación y Definición Arquitectónica`
- **Progreso Global:** `0% de código` (planeación cerrada, implementación sin iniciar)
- **Última Actualización:** 31 de Agosto de 2026

```
Planeación:     [████████████████████] Cerrada
Implementación: [░░░░░░░░░░░░░░░░░░░░] 0/6 tareas
```

> El progreso se mide en **tareas con `npm test` y `npm run build` en verde**, no en checkboxes marcados.
> Ver [Definition of Done Verificable](./ORCHESTRATION_LOOP.md).

---

## 📋 Tablero de Tareas (Kanban)

### 📌 Backlog (Por Iniciar)
| ID | Tarea | Agente Asignado | Dependencias | Archivo de Especificación |
| :--- | :--- | :---: | :---: | :--- |
| `TASK-001` | Setup del Proyecto & Entorno Vercel Serverless | Backend Dev Agent | Ninguna | [tasks/TASK-001-setup.md](./tasks/TASK-001-setup.md) |
| `TASK-002` | Capa Core: Base de Datos, Errores & Middleware Auth | Backend Dev Agent | `TASK-001` | [tasks/TASK-002-core-auth-db.md](./tasks/TASK-002-core-auth-db.md) |
| `TASK-003` | Módulo de Reservas (`/reservas` sobre `vw_new_details_booking`) | Backend Dev Agent + QA | `TASK-002` | [tasks/TASK-003-reservas.md](./tasks/TASK-003-reservas.md) |
| `TASK-004` | Módulo de Cupones (`/cupones` basado en `v2/cupon`) | Backend Dev Agent + QA | `TASK-003` | [tasks/TASK-004-cupones.md](./tasks/TASK-004-cupones.md) |
| `TASK-005` | Módulos Viajeros y Finanzas (Saldos/Crédito) | Backend Dev Agent + QA | `TASK-002` | [tasks/TASK-005-viajeros-finanzas.md](./tasks/TASK-005-viajeros-finanzas.md) |
| `TASK-006` | Suite de Pruebas de Integración y Mocks SQL | Test & QA Agent | `TASK-005` | [tasks/TASK-006-integration-tests.md](./tasks/TASK-006-integration-tests.md) |

---

### 🚧 En Progreso
*(Ninguna tarea en progreso — listo para iniciar `TASK-001`)*

---

### 🧪 En QA / Pruebas
*(Ninguna tarea en QA actualmente)*

---

### ✅ Completadas
- [x] Definición del alcance: **este repo es solo el backend**; los MCPs y agentes son clientes externos.
- [x] Análisis arquitectónico y descarte de sobreingeniería (NestJS vs Express/TS en Vercel).
- [x] Creación del Contrato de API formal ([API_CONTRACT.md](./API_CONTRACT.md)).
- [x] Definición del modelo de acceso a datos: **el agente no escribe SQL**, las queries las provee Ángel ([QUERIES.md](./QUERIES.md)).
- [x] Definición del marco de desarrollo multi-agente y DoD verificable ([ORCHESTRATION_LOOP.md](./ORCHESTRATION_LOOP.md)).

---

## 🚦 Bloqueadores Abiertos

**Todos los bloqueadores son queries pendientes de Ángel.** Ver [QUERIES.md](./QUERIES.md).

| Queries pendientes | Bloquea |
| :--- | :--- |
| `Q-RES-01`, `Q-RES-02` | `TASK-003` |
| `Q-CUP-01` … `Q-CUP-04` | `TASK-004` |
| `Q-VIA-01`, `Q-FIN-01`, `Q-FIN-02` | `TASK-005` |

`TASK-001` y `TASK-002` **no dependen de ninguna query** — son setup y capa core. Se pueden arrancar hoy.

---

## 👥 Registro de Agentes y Roles

| Rol | Agente | Especialidad |
| :--- | :--- | :--- |
| 👑 **Lead Orchestrator** | Main Agent | Arquitectura, desglose de tasks, code review y verificación de calidad. |
| 💻 **Backend Developer** | Subagente `Backend-Dev` | TypeScript, Express, Zod, SQL Repositories y Services. |
| 🛡️ **Test & QA Specialist** | Subagente `QA-Tester` | Vitest, Supertest, SQL Mocking y validación de cobertura. |
