# 📋 TASK-006: Suite de Pruebas de Integración y Estrategia de Mocks SQL

- **Estado:** `BACKLOG`
- **Agente Asignado:** `Test & QA Agent`
- **Revisor:** `Lead Orchestrator`
- **Dependencias:** `TASK-005`

---

## 1. Objetivo

Consolidar la suite de pruebas del backend y establecer la **estrategia de mocking de MySQL** que usarán todos los módulos, garantizando que los tests puedan fallar de verdad y no solo validen los mocks que el propio agente escribió.

---

## 2. Estrategia de Testing

| Capa | Tipo de prueba | Qué se mockea |
| :--- | :--- | :--- |
| Repository | Unitaria | El executor. Se afirma sobre **qué query del catálogo se ejecutó y con qué params**. |
| Service | Unitaria | El repositorio completo (interfaz). Sin SQL. |
| Controller / Router | Integración (Supertest) | El repositorio. Express corre de verdad. |

> El agente **no valida el SQL en sí** — no conoce el esquema y no puede juzgarlo.
> Valida que se ejecute la query correcta, sin modificar, con los parámetros correctos.

### Fixtures

- Viven en `tests/fixtures/`, un archivo por entidad.
- Se construyen **a partir de la "Forma de la fila devuelta"** que cada query documenta en [QUERIES.md §2](../QUERIES.md).
- **Prohibido inventar campos.** Si el DTO del contrato necesita un dato que ninguna query documenta, se emite una *Solicitud de Query* y la tarea se detiene.

---

## 3. Criterios de Aceptación (Definition of Done)

- [ ] `tests/helpers/mockExecutor.ts`: helper que captura `{ sql, params }` de cada llamada para poder afirmar sobre ellos.
- [ ] `tests/fixtures/`: fixtures de reservas, cupones (hotel/vuelo/auto), viajeros y finanzas.
- [ ] **Test de integridad del catálogo:** el SQL que ejecuta cada repositorio es **idéntico** al de [QUERIES.md](../QUERIES.md). Si alguien lo edita, el test falla.
- [ ] **Tests de aislamiento multi-tenant** (obligatorio en cada módulo):
  - El primer parámetro enviado a la query es el `id_agente` del contexto autenticado.
  - Ese valor **nunca** proviene del body, del query string ni de los params de la petición.
  - Una petición sin `x-id-agente` responde 400 y no llega al repositorio.
  - Una petición sin `x-api-key` responde 401.
- [ ] **Tests negativos por módulo:** filtros requeridos ausentes (ej. `temporalidad` en reservas) responden 400.
- [ ] **Test de paginación:** `length` mayor al máximo permitido se recorta al tope, no lo excede.
- [ ] `npm test` corre toda la suite en verde y `npm run build` compila sin errores.
- [ ] Cobertura mínima del 80% en `src/modules/` y `src/core/`.

---

## 4. Entregables

1. `tests/helpers/mockExecutor.ts`
2. `tests/fixtures/` (reservas, cupones, viajeros, finanzas)
3. `tests/integration/multiTenant.test.ts`
4. `vitest.config.ts` con umbrales de cobertura configurados
5. Script `test:coverage` en `package.json`

---

## 5. Checklist de Verificación del Orquestador

- [ ] ¿Existe al menos un test que falle si el repositorio deja de pasar el `id_agente` del contexto?
- [ ] ¿El SQL de cada repositorio coincide **carácter por carácter** con el del catálogo?
- [ ] ¿Aparece SQL escrito por el agente en algún archivo? (si sí → **rechazar la tarea completa**)
- [ ] ¿Algún fixture contiene campos que ninguna query documenta? (si sí → rechazar)
