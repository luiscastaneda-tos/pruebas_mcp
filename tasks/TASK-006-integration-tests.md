# 📋 TASK-006: Consolidación de la Suite y Cobertura

- **Estado:** `BACKLOG`
- **Agente Asignado:** `QA`
- **Revisor:** `Lead`
- **Dependencias:** `TASK-005`

---

## 1. Objetivo

Consolidar la suite completa una vez que los cuatro módulos existen: cobertura, tests de integración transversales y verificación de que la estrategia definida en [TASK-002b](./TASK-002b-testing-infra.md) se aplicó de forma consistente en todos ellos.

> **Qué NO está aquí.** El `mockExecutor`, la convención de fixtures y el test de integridad del
> catálogo se construyen en [TASK-002b](./TASK-002b-testing-infra.md), **antes** del primer módulo.
> Esta tarea no los inventa: verifica que se usaron.

---

## 2. Estrategia de Testing (referencia)

Definida en TASK-002b y aplicada por cada módulo. Se repite aquí porque es el criterio de revisión:

| Capa | Tipo de prueba | Qué se mockea |
| :--- | :--- | :--- |
| Repository | Unitaria | El executor. Se afirma sobre **qué query del catálogo se ejecutó y con qué params**. |
| Service | Unitaria | El repositorio completo (interfaz). Sin SQL. |
| Controller / Router | Integración (Supertest) | El repositorio. Express corre de verdad. |

> El agente **no valida el SQL en sí** — no conoce el esquema y no puede juzgarlo.
> Valida que se ejecute la query correcta, sin modificar, con los parámetros correctos.

---

## 3. Criterios de Aceptación (Definition of Done)

- [ ] **Auditoría de consistencia:** los cuatro módulos usan el `mockExecutor` de TASK-002b. Ningún módulo trae un mock propio improvisado. Si alguno lo tiene, se migra.

- [ ] **Test de integridad del catálogo, extendido a todas las queries:** el SQL de cada repositorio es idéntico carácter por carácter al de [QUERIES.md](../QUERIES.md), para las 9 queries.

- [ ] **Auditoría de fixtures:** cada fixture procede de las "Filas de ejemplo" de su query en el catálogo. **Ningún fixture contiene campos que ninguna query documenta.**

- [ ] **Tests de aislamiento multi-tenant, por módulo** (los de la capa core ya están en TASK-002b):
  - El primer parámetro enviado a cada query es el `id_agente` del contexto autenticado.
  - Ese valor nunca proviene del body, del query string ni de los params.
  - Ningún endpoint responde datos sin que el `id_agente` haya llegado al repositorio.

- [ ] **Tests negativos por módulo:** filtros requeridos ausentes (ej. `temporalidad` en reservas) responden `400 VALIDATION_ERROR` con la forma de error de [API_CONTRACT §1](../API_CONTRACT.md).

- [ ] **Test de paginación:** `length` mayor al máximo permitido se recorta al tope, no lo excede.

- [ ] **Test de recurso ajeno:** pedir un cupón que pertenece a otro `id_agente` responde `404 NOT_FOUND`, no `403` ni el recurso.

- [ ] `vitest.config.ts` con umbrales de cobertura y script `test:coverage` en `package.json`.

- [ ] Cobertura mínima del 80% en `src/modules/` y `src/core/`.

- [ ] `npm test` en verde, `npm run build` sin errores, `npm run check:invariants` en verde.

---

## 4. Entregables

1. `tests/integration/multiTenant.test.ts` (transversal, los 4 módulos)
2. `tests/integration/catalogIntegrity.test.ts` (las 9 queries)
3. `vitest.config.ts` con umbrales de cobertura configurados
4. Script `test:coverage` en `package.json`

---

## 5. Checklist de Verificación del Lead

- [ ] ¿Existe al menos un test que falle si un repositorio deja de pasar el `id_agente` del contexto?
- [ ] ¿El SQL de cada repositorio coincide **carácter por carácter** con el del catálogo?
- [ ] ¿Aparece SQL escrito por el agente en algún archivo? (si sí → **rechazar la tarea completa**)
- [ ] ¿Algún fixture contiene campos que ninguna query documenta? (si sí → rechazar)
- [ ] ¿Algún módulo se quedó con un mock propio en vez del helper compartido?
- [ ] **Verificación de mutación** ([ORCHESTRATION_LOOP §2.3](../ORCHESTRATION_LOOP.md)): con la cobertura al 80%, ¿sigue habiendo una mutación que la suite detecta en cada módulo?
