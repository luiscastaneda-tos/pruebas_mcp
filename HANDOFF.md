# 🤝 HANDOFF — MIA Backend Gateway

**Última actualización:** 1 de septiembre de 2026  
**Repositorio:** `C:\Users\Operaciones\Desktop\MIA_OFICIAL\pruebas_mcp`  
**Estado:** pausa solicitada durante TASK-002b. Progreso aceptado: **2/7 tareas**.

> Este archivo es el punto de entrada para un nuevo Lead Orchestrator. Lee después únicamente
> `PROGRESS.md`, la tarea activa y las secciones contractuales que esa tarea enlace. No recorras todo
> el repositorio ni releas la historia completa.
>
> Prompt listo para copiar al nuevo agente: [`NEXT_ORCHESTRATOR_PROMPT.md`](./NEXT_ORCHESTRATOR_PROMPT.md).

---

## 1. Alcance y reglas no negociables

- Este repositorio construye **solo el backend REST** TypeScript/Express para Vercel. MCPs, agentes y
  frontends son clientes externos.
- Ningún agente escribe, corrige ni inventa SQL. Ángel entrega las queries y la única fuente es
  `QUERIES.md`.
- No existe `DATABASE_SCHEMA.md` y **no debe crearse**. Tampoco se adapta SQL del legacy `bacl`.
- Backend nunca lee ni ejecuta `tests/`. QA deriva pruebas de contratos; solo el Lead ejecuta e
  interpreta la suite completa y realiza mutaciones.
- `id_agente` vigente es UUID string tomado exclusivamente de `x-id-agente`, nunca de body, query o
  params. También se valida `x-api-key`.
- La futura migración a token está preparada mediante
  `ContextResolver.resolve(req): Promise<RequestContext>`, pero hoy no se acepta `Authorization`,
  modo dual ni fallback.
- El gate usa una allowlist sintáctica estricta: queries como strings literales exportados y
  repositorios mediante `executor.execute(CONSTANTE_IMPORTADA, params)`.
- Máximo tres iteraciones sobre el mismo comportamiento. Después se escala a Ángel.

---

## 2. Política actual de agentes y costo

- Usa únicamente subagentes económicos, actualmente equivalentes a `gpt-5.6-luna`.
- No les pidas releer el proyecto. Entrega brief ya cargado + tarea atómica + secciones exactas.
- QA trabaja por lotes:
  - Lote A: TASK-002b y, después de cerrarla, tests previos de TASK-003.
  - Lote B: TASK-004/005/006 cuando lleguen las siete queries restantes.
- Security permanece estacionado. Se invoca una sola vez después de TASK-006 y antes de liberar,
  salvo petición extraordinaria de Ángel.
- Agentes usados en la sesión anterior: `qa_economico` y `backend_economico`. Un nuevo orquestador
  probablemente tendrá que recrearlos con modelo económico y los briefs íntegros de `agents/`.

---

## 3. Tareas completadas

### TASK-001 — COMPLETED

- Setup TypeScript/Express/Vercel, `GET /health` y gate de invariantes.
- Cierre aceptado: build, lint, invariantes y suite verdes; mutación roja y revertida; 9/9
  entregables.
- Security realizó dos auditorías tempranas que endurecieron health y el gate. Ya no se audita cada
  tarea.

### TASK-002 — COMPLETED

- DB/pool y `QueryExecutor`, env Zod, errores tipados, `errorHandler`, auth y `ContextResolver`.
- Cierre aceptado: 6 archivos/28 pruebas verdes, build/lint/invariantes verdes, 7/7 entregables.
- Mutación verificada: relajar UUID de `x-id-agente` puso la suite roja; la reversión volvió a verde.
- Un único fallo real requirió Backend: todo `INTERNAL_ERROR`, incluso tipado, debe loguearse sin
  exponer detalles.

No repitas estas dos tareas.

---

## 4. Estado exacto de TASK-002b

**Estado:** pausada antes del cierre. Los entregables QA existen:

- `tests/helpers/mockExecutor.ts`
- `tests/helpers/catalogIntegrity.ts`
- `tests/fixtures/README.md`
- `tests/core/multiTenant.test.ts`
- `tests/core/errorShape.test.ts`
- `tests/core/infrastructure.test.ts` — prueba realmente los dos helpers.

QA corrigió su primera entrega porque inicialmente los helpers no tenían pruebas ejecutables. Después
de la corrección quedaron cubiertos:

- `execute`, orden y captura exacta de `{ sql, params }`, `queueRows`, `reset` y comparación de query;
- extracción carácter por carácter de `Q-RES-01` y `Q-RES-02` y error para ID inexistente;
- UUID inválido, prioridad del header frente a body/query/params y bloqueo de downstream sin contexto;
- forma contractual de errores y `details` solo para `VALIDATION_ERROR`.

### Hashes QA que deben permanecer intactos

| Archivo | SHA-256 |
| :--- | :--- |
| `tests/helpers/mockExecutor.ts` | `6C25837DB9F096ABCDF9060BC9DAC20F1EF92BC60EC811ED19B2F28899123150` |
| `tests/helpers/catalogIntegrity.ts` | `DF490076B0FA071670841815AF758D50E2E88C64B2A8EDC183111031BADC1A00` |
| `tests/fixtures/README.md` | `A3A62F4010F95B2B6629FAB158D4B7EA8A4925BED77CF37237571B19CF0647DB` |
| `tests/core/multiTenant.test.ts` | `93B9CAE0E9739D32BFD50E688EC69BAC6B17BED21E79DAA42DBA8CC58C46E8CB` |
| `tests/core/errorShape.test.ts` | `8B9CE752D143A79BA1AF5164F759A6AC7B24E5B447F6CE30E7D0673E6215D440` |
| `tests/core/infrastructure.test.ts` | `879456F03DB3458DE0F59FD4E7D5946E006F816B7D9264B996C45FCA1A678FF5` |

### Bloqueo actual: health intermitente

El caso de `GET /health` con body JSON sobredimensionado produjo `read ECONNRESET` tres veces en
corridas distintas, aunque otras corridas fueron verdes. La causa diagnosticada es responder antes
de terminar de recibir el stream del request.

Backend económico recibió esta regla: health debe drenar el stream sin parsearlo ni almacenarlo antes
de responder. Alcanzó a modificar `src/app.ts` con una ruta async que hace `request.resume()` y espera
`end`/`close`, pero fue **interrumpido antes de entregar o validar**. Ese código es parcial y no debe
aceptarse todavía.

No se ejecutaron build, lint, invariantes ni suite después de ese último cambio.

---

## 5. Primeros pasos exactos del nuevo orquestador

1. No modifiques ni descartes el worktree: está intencionalmente sucio y contiene todo el proyecto.
2. Crea/reactiva Backend con modelo económico y brief íntegro `agents/BACKEND.md`. Entrégale solo la
   corrección parcial de health; prohíbele tests y SQL. Debe revisar `src/app.ts` y entregar
   `npm run build`, `npm run lint`, `npm run check:invariants`.
3. Como Lead, calcula los hashes anteriores y ejecuta esos tres controles.
4. Solo entonces ejecuta `npm test`.
   - Si health sigue con `ECONNRESET`, devuelve la misma regla a Backend como **iteración 2/3**.
   - No reactives QA por este fallo.
5. Con la suite verde, muta temporalmente `mockExecutor` para dejar de capturar `params`. La prueba de
   infraestructura debe ponerse roja. Revierte y confirma suite verde.
6. Marca TASK-002b completa y cambia el progreso a **3/7**.
7. Reactiva QA económico una sola vez para escribir, antes de Backend, los tests de TASK-003 usando
   únicamente `tasks/TASK-003-reservas.md`, `API_CONTRACT.md` sección Reservas y `Q-RES-01/02`.

---

## 6. Queries y ruta restante

- Aprobadas: `Q-RES-01` y `Q-RES-02`. Incluyen SQL, parámetros, filas anonimizadas y reglas.
- TASK-003 queda desbloqueada por datos cuando TASK-002b cierre.
- Pendientes de Ángel:
  - `Q-CUP-01` a `Q-CUP-04` para TASK-004.
  - `Q-VIA-01`, `Q-FIN-01`, `Q-FIN-02` para TASK-005.
- Después: TASK-006 consolida cobertura y luego Security realiza la auditoría acumulada final.

---

## 7. Documentos que sí importan al retomar

1. Este `HANDOFF.md`.
2. `PROGRESS.md` para el tablero y evidencia cronológica.
3. `tasks/TASK-002b-testing-infra.md` hasta cerrar la tarea activa.
4. `ORCHESTRATION_LOOP.md` para segregación, mutación y política económica por lotes.
5. Después del cierre, solo la tarea y secciones contractuales de TASK-003.

No es necesario leer toda la documentación otra vez.
