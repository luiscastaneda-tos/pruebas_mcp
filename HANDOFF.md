# 🤝 HANDOFF — Estado y Siguientes Pasos

**Última actualización:** 31 de Agosto de 2026
**Estado:** Planeación cerrada. Implementación sin iniciar. Bloqueada parcialmente por entrega de queries.

> **Empieza por aquí** si retomas el proyecto después de un tiempo, o si eres un agente
> entrando en frío. Este archivo tiene el *contexto y las decisiones*.
> El *estado vivo* está en [QUERIES.md](./QUERIES.md) y [PROGRESS.md](./PROGRESS.md) —
> este documento no lo duplica, lo apunta.

---

## 1. Qué es esto en una frase

Un **backend REST en TypeScript** con arquitectura limpia, que se conecta a la DB de MIA y expone
endpoints tipados y compactos. Los servidores MCP y agentes de IA son **clientes externos** que lo
consumen; no se construyen aquí.

---

## 2. Ruta crítica: 9 queries pendientes de Ángel

**Esto es lo único que bloquea el proyecto.** El estado real y actualizado está en
[QUERIES.md §1](./QUERIES.md) — no lo copies aquí, se desincroniza.

| Bloque | Desbloquea |
| :--- | :--- |
| `Q-RES-01`, `Q-RES-02` | `TASK-003` (Reservas) |
| `Q-CUP-01` … `Q-CUP-04` | `TASK-004` (Cupones) |
| `Q-VIA-01`, `Q-FIN-01`, `Q-FIN-02` | `TASK-005` (Viajeros y Finanzas) |

**Cómo entregarlas:** con el formato de [QUERIES.md §2](./QUERIES.md) — SQL, params posicionales,
forma de la fila devuelta, y reglas de negocio que la query ya resuelve. Ese último punto importa:
si la query ya filtra o calcula algo, el service **no** lo reimplementa.

**Sugerencia de orden:** empieza por `Q-RES-01` / `Q-RES-02`. Reservas es el módulo central, y
entregarlo primero valida el formato del catálogo end-to-end antes de que escribas las otras siete.

---

## 3. Qué se puede hacer HOY sin bloqueo

`TASK-001` (setup + Vercel) y `TASK-002` (core: DB pool, auth, errores) **no tocan datos de negocio**
y no dependen de ninguna query. Ese es el tramo que el loop puede correr sin que entregues nada.

Al terminar `TASK-002` existe ya un `GET /health` desplegable y el middleware multi-tenant probado —
buen punto de corte para revisar antes de seguir.

---

## 4. Decisiones cerradas — no re-litigar

Están aquí porque son la clase de decisión que una sesión nueva vuelve a proponer al revés.

| # | Decisión | Por qué |
| :-- | :--- | :--- |
| 1 | **Este repo es solo el backend.** El servidor MCP no se construye aquí. | El scope se había mezclado; `.env.example` describía un cliente MCP mientras el README describía un backend. Ya está separado. |
| 2 | **El agente no escribe SQL ni conoce el esquema.** Ángel provee todas las queries. | Un agente que inventa SQL contra un esquema que no conoce falla en runtime, o peor: devuelve datos incorrectos en silencio o rompe el aislamiento multi-tenant. Ninguno de los tres lo detecta un test escrito por ese mismo agente. |
| 3 | **No se documenta DDL en este repo.** Es deliberado, no un olvido. | Documentar esquema le da material al agente para inventar queries en vez de pedirlas. Si ves que falta un `DATABASE_SCHEMA.md`, es intencional — no lo crees. |
| 4 | **`id_agente` solo desde el header `x-id-agente`.** Nunca de body, query o params. | Leerlo del query permitiría a un cliente consultar datos de otra agencia. |
| 5 | **`id_agente` es un UUID string**, no un entero. | Verificado en el legacy. La doc original decía `INT` y usaba `50` de ejemplo; habría producido validación numérica en Zod y roto todo. |
| 6 | **Progreso se mide en `npm test` + `npm run build` en verde**, no en checkboxes. | Un loop autónomo marca checkboxes solo. Ver [DoD verificable](./ORCHESTRATION_LOOP.md). |

---

## 5. Lo que un agente nuevo NO debe hacer

Errores concretos en los que ya se cayó una vez:

- ❌ **Escribir SQL "provisional" para desbloquearse.** Emite una *Solicitud de Query*
  ([QUERIES.md §3](./QUERIES.md)) y **detén la tarea**.
- ❌ **Adaptar queries del backend legacy `bacl`.** No son la fuente de verdad; varias traen
  `SELECT *` y lógica que aquí se quiere rediseñar. Ángel entrega la versión buena.
- ❌ **Documentar el esquema "para ayudar".** Ver decisión #3.
- ❌ **Modificar una query del catálogo** (agregar un filtro, cambiar un JOIN o un `ORDER BY`).
  Eso es una solicitud nueva, no una edición.
- ❌ **Reimplementar en el service reglas que la query ya aplica.**
- ❌ **Proponer construir el servidor MCP aquí.** Ver decisión #1.

---

## 6. Preguntas abiertas

Decisiones que siguen sin tomarse. Ninguna bloquea `TASK-001` / `TASK-002`.

- [ ] **Nombre del repo.** Se llama `pruebas_mcp` pero ya no es eso ni tiene MCP dentro.
      Algo como `mia-backend-gateway` describiría lo que es. No se renombró para no romperte
      remotes sin avisar.
- [ ] **Relación con `bacl/v2`.** El backend legacy ya tiene el mismo patrón
      (repository/service/controller/router, `getExecutor(conn)`, QueryBuilder + Includes) y
      endpoints funcionando para los 4 módulos. Se decidió construir aparte de todos modos.
      Queda pendiente definir: ¿este backend eventualmente reemplaza esos endpoints de `bacl`,
      conviven, o `bacl` termina llamando a este? Sin respuesta, hay riesgo de mantener dos
      lugares con la misma lógica.
- [ ] **Origen de los fixtures de prueba.** `TASK-006` los construye a partir de la "forma de la
      fila" que documenta cada query. Falta confirmar si se anonimizan datos reales o se
      generan sintéticos desde esa forma.
- [ ] **Rotación de `API_KEY`.** El contrato asume una sola API key para todos los clientes.
      Si mañana hay varios MCPs, ¿una key por cliente?

---

## 7. Cómo reanudar

1. Lee este archivo (§4 y §5 sobre todo).
2. Revisa [QUERIES.md §1](./QUERIES.md) — ¿cuántas queries siguen en ⏳?
3. Revisa [PROGRESS.md](./PROGRESS.md) — ¿qué tarea quedó en curso?
4. Si hay queries nuevas entregadas, muévelas a ✅ y desbloquea su tarea.
5. Si no, arranca o continúa `TASK-001` / `TASK-002`, que nunca están bloqueadas.

**Al cerrar una sesión de trabajo:** actualiza §2 si cambió el estado de las queries, y §6 si se
resolvió o apareció una pregunta abierta. El resto de este archivo casi no debería cambiar — si
estás editando §4 seguido, es señal de que una decisión no estaba realmente cerrada.
