# 📋 TASK-002b: Infraestructura de Testing (`mockExecutor` y Fixtures)

- **Estado:** `PAUSED — health parcial sin validar antes del cierre`
- **Agente Asignado:** `QA`
- **Revisor:** `Lead`
- **Dependencias:** `TASK-002`
- **Bloquea:** `TASK-003`, `TASK-004`, `TASK-005`

---

## 1. Objetivo

Construir la infraestructura de testing **antes del primer módulo**: el helper que captura `{ sql, params }`, el formato de fixtures, el test de integridad del catálogo y los tests de aislamiento multi-tenant sobre la capa core.

> **Por qué existe esta tarea.** Antes, esta infraestructura vivía en TASK-006, que dependía de
> TASK-005 — o sea, se construía *después* de los tres módulos que la necesitan. TASK-003 pedía
> "tests con mock de base de datos" sin que existiera un mock definido. El resultado inevitable era
> que cada módulo improvisara el suyo y que TASK-006 los reescribiera todos.

**No está bloqueada por ninguna query.** No toca datos de negocio: construye el andamio con el que se probarán los módulos cuando sus queries lleguen.

---

## 2. Criterios de Aceptación (Definition of Done)

- [ ] **`tests/helpers/mockExecutor.ts`:**
  - Implementa el mismo objeto `QueryExecutor` de TASK-002, incluido su método `execute`, y
    **captura cada llamada** como `{ sql, params }` en un array inspeccionable.
  - Permite programar la respuesta por llamada (`queueRows([...])`) para simular data query + count query.
  - Expone `calls`, `reset()` y un `assertCalledWithCatalogQuery(sql)` que compara carácter por carácter.

- [ ] **`tests/helpers/catalogIntegrity.ts`:**
  - Lee [QUERIES.md](../QUERIES.md), extrae los bloques SQL por ID (`Q-RES-01`, etc.) y los expone tipados.
  - Es el mecanismo que permite afirmar *"el SQL que ejecuta el repositorio es idéntico al del catálogo"*. Si alguien edita una query en el código y no en el catálogo — o al revés — el test falla.
  - Mientras el catálogo esté vacío, el helper existe y su propio test verifica que parsea correctamente un bloque de ejemplo.

- [ ] **Convención de fixtures documentada en `tests/fixtures/README.md`:**
  - Un archivo por query, nombrado por su ID (`Q-RES-01.fixture.ts`).
  - El contenido **se copia de las "Filas de ejemplo" del catálogo** ([QUERIES §2](../QUERIES.md)). No se inventa, no se extiende, no se "completa" con campos plausibles.
  - Si una query llega sin filas de ejemplo, se trata como query incompleta y se pide igual que se pediría la query.

- [ ] **Tests de aislamiento multi-tenant sobre la capa core** (no requieren queries):
  - Petición sin `x-api-key` → `401` con `error.code === "UNAUTHORIZED"`.
  - Petición sin `x-id-agente` → `400` con `error.code === "MISSING_CONTEXT"`, y el executor **no recibe ninguna llamada**.
  - `x-id-agente` con un valor que no es UUID → `400 MISSING_CONTEXT`.
  - `x-id-agente` válido en header **pero un `id_agente` distinto en el body** → el valor que llega a `req.context` es el del header. Este test es el que protege la decisión #4 de [HANDOFF](../HANDOFF.md).

- [ ] **Test de forma del error:** cualquier error devuelto por el `errorHandler` cumple la forma de [API_CONTRACT §1](../API_CONTRACT.md) — `success: false` y `error: { code, message }`, con `details` presente **solo** en `VALIDATION_ERROR`.

- [ ] `npm test` en verde y `npm run build` sin errores.

---

## 3. Entregables

1. `tests/helpers/mockExecutor.ts`
2. `tests/helpers/catalogIntegrity.ts`
3. `tests/fixtures/README.md`
4. `tests/core/multiTenant.test.ts`
5. `tests/core/errorShape.test.ts`

---

## 4. Checklist de Verificación del Lead

- [ ] ¿El `mockExecutor` permite afirmar sobre `params`, no solo sobre el resultado devuelto?
- [ ] ¿Existe un test que falle si el middleware empieza a leer `id_agente` del body?
- [ ] **Verificación de mutación** ([ORCHESTRATION_LOOP §2.3](../ORCHESTRATION_LOOP.md)): al eliminar la validación de UUID del middleware, ¿se pone roja la suite?
- [ ] ¿Los helpers y fixtures viven bajo `tests/`, sin que nada en `src/` los importe?
