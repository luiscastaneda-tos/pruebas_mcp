# 📁 Directorio de Tareas (Task Specifications)

Este directorio contiene las especificaciones atómicas de cada tarea asignada en el **Loop de Desarrollo Multi-Agente**.

---

## 📋 Estructura Estándar de una Tarea (`TASK-XXX.md`)

Cada archivo de tarea contiene:
1. **Identificador y Título** (`TASK-XXX`)
2. **Rol Asignado** — `Backend`, `QA` o ambos. Los nombres canónicos de rol están en [ORCHESTRATION_LOOP §1](../ORCHESTRATION_LOOP.md); no se inventan variantes.
3. **Objetivo y Contexto**
4. **Criterios de Aceptación (Definition of Done)**
5. **Entregables**
6. **Checklist de Verificación del Lead**

---

## 🗂️ Índice de Tareas Planificadas

* [TASK-001: Setup del Proyecto, Gate de Invariantes y Vercel](./TASK-001-setup.md)
* [TASK-002: Capa Core: Base de Datos, Errores & Middleware Auth](./TASK-002-core-auth-db.md)
* [TASK-002b: Infraestructura de Testing (`mockExecutor` y fixtures)](./TASK-002b-testing-infra.md)
* [TASK-003: Módulo Reservas](./TASK-003-reservas.md)
* [TASK-004: Módulo Cupones](./TASK-004-cupones.md)
* [TASK-005: Módulos Viajeros y Finanzas](./TASK-005-viajeros-finanzas.md)
* [TASK-006: Consolidación de la Suite y Cobertura](./TASK-006-integration-tests.md)

> Los títulos no llevan nombres de tablas ni de vistas. Los agentes no conocen el esquema y
> documentarlo — aunque sea de pasada en un título — les da material para inventar queries en vez
> de pedirlas. Ver [HANDOFF §4, decisión 3](../HANDOFF.md).
