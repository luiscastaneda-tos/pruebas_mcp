# 🤖 Briefs de Agentes

Un archivo por rol del [loop](../ORCHESTRATION_LOOP.md). Cada uno es el **system prompt íntegro** del agente al que corresponde.

| Brief | Rol | Cuándo se entrega |
| :--- | :--- | :--- |
| [LEAD.md](./LEAD.md) | Lead Orchestrator | Arranca la sesión. Es el prompt que abre el proyecto. |
| [BACKEND.md](./BACKEND.md) | Backend | Paso 3: implementar desde contratos. |
| [QA.md](./QA.md) | QA | Paso 2: escribir tests desde contratos. |
| [SECURITY.md](./SECURITY.md) | Security | Paso 8: solo con la suite verde y la mutación verificada. |

---

## Cómo se usan

Se entregan **completos y sin parafrasear**. La tentación de resumirlos al configurar un subagente es exactamente cómo se pierden las reglas: un resumen conserva el tono y descarta las prohibiciones concretas, que es lo único que hace funcionar el loop.

Al delegar, el Lead entrega tres cosas: **el brief + la especificación de la tarea + los contratos aprobados.** Nunca los tests, a nadie que no sea QA.

---

## Por qué cada brief explica su propio "por qué"

Las prohibiciones vienen con su razón — no por cortesía, sino porque una regla sin motivo se rompe en cuanto estorba. Un agente que sabe *por qué* no debe leer los tests aguanta la tentación en la tercera iteración de un fallo que no entiende; uno que solo recibió la orden, no.

Ese es también el momento en que romper la regla más daño hace, y el único en que alguien realmente querría hacerlo.
