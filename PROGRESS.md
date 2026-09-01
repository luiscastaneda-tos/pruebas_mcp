# 📊 Tablero de Progreso del Proyecto (PROGRESS.md)

Dashboard maestro de seguimiento de sprints, estado de tareas y asignaciones de agentes en el **MIA Backend Gateway**.

---

## 📈 Estado General del Proyecto

- **Fase Actual:** `PAUSA DE HANDOFF — TASK-002b, health sin validar`
- **Progreso Global:** `2/7 tareas`
- **Última Actualización:** 1 de Septiembre de 2026

```
Planeación:     [████████████████████] Cerrada
Implementación: [██████░░░░░░░░░░░░░░] 2/7 tareas
```

> El progreso se mide en **tareas con `npm test` y `npm run build` en verde**, no en checkboxes marcados.
> Ver [Definition of Done Verificable](./ORCHESTRATION_LOOP.md).

---

## 📋 Tablero de Tareas (Kanban)

### 📌 Backlog (Por Iniciar)
| ID | Tarea | Agente | Depende de | Paso del loop | Especificación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `TASK-003` | Módulo de Reservas | Backend + QA | `TASK-002b` | — | [TASK-003](./tasks/TASK-003-reservas.md) |
| `TASK-004` | Módulo de Cupones | Backend + QA | `TASK-003` | — | [TASK-004](./tasks/TASK-004-cupones.md) |
| `TASK-005` | Módulos Viajeros y Finanzas | Backend + QA | `TASK-002b` | — | [TASK-005](./tasks/TASK-005-viajeros-finanzas.md) |
| `TASK-006` | Consolidación de la suite y cobertura | QA | `TASK-005` | — | [TASK-006](./tasks/TASK-006-integration-tests.md) |

> **La columna "Paso del loop"** dice quién tiene el balón: `1` contrato · `2` QA escribiendo tests ·
> `3` encargado a Backend · `4` Backend entregó · `5` suite ejecutándose · `6` verificación de
> mutación · `7` fallo devuelto a Backend (anota la iteración: `7 (2/3)`) · `8` cierre de tarea.
> Security hace una auditoría acumulada después de TASK-006 y antes de liberar.
> El Lead la actualiza en cada transición. Sin esto, retomar en frío obliga a adivinar.

---

### 🚧 En Progreso
| ID | Tarea | Responsable actual | Paso del loop | Estado verificable |
| :--- | :--- | :---: | :---: | :--- |
| `TASK-002b` | Infraestructura compartida de testing | Pausado para handoff | `7 (health 1/3, parcial)` | Backend modificó `src/app.ts` para drenar el stream, pero fue interrumpido antes de entregar o validar. |

### ⏸️ Punto exacto de reanudación

**Checkpoint aceptado:** TASK-001 y TASK-002 están completadas (`2/7`). TASK-002b ya tiene todos sus
entregables QA y pruebas ejecutables para helpers, catálogo, fixtures, aislamiento y errores.

**Trabajo parcial no aceptado:** `src/app.ts` contiene una modificación nueva que drena en streaming
el body de `GET /health` antes de responder. Backend fue interrumpido antes de entregar y no ejecutó
`build`, `lint` ni `check:invariants`; el Lead tampoco ejecutó la suite sobre ese estado.

**Para reanudar TASK-002b, en este orden:**

1. Un Backend económico revisa únicamente el cambio parcial de `src/app.ts`, lo termina si hace
   falta y entrega `build`, `lint` y `check:invariants`, sin leer ni ejecutar tests.
2. El Lead verifica los hashes QA registrados en el handoff, repite esos tres controles y ejecuta
   `npm test`.
3. Si health sigue produciendo `ECONNRESET`, devolver a Backend la misma regla de negocio como
   iteración 2/3; no reactivar QA.
4. Con todo verde, mutar temporalmente `mockExecutor` para que deje de capturar `params`; la suite de
   infraestructura debe ponerse roja. Revertir y confirmar verde.
5. Cerrar TASK-002b y avanzar el progreso a `3/7`.

**Siguiente movimiento:** reactivar el mismo QA económico una sola vez para escribir los tests rojos
de TASK-003 usando `Q-RES-01` y `Q-RES-02`; después estacionarlo y delegar Reservas a Backend
económico.

**Reglas que no cambian:** agentes económicos; Security hasta la auditoría final; ningún agente
escribe SQL; no existe `DATABASE_SCHEMA.md`; Backend no ve tests; auth actual solo por
`x-api-key` + `x-id-agente`, sin token ni fallback todavía.

---

### 🧪 En QA / Pruebas
*(Ninguna tarea en QA actualmente)*

---

### ✅ Completadas
- [x] **TASK-002 — Core DB, entorno, errores y auth preparada para token.** `build`, `lint`,
  `check:invariants` y suite verdes; 6 archivos/28 pruebas; mutación de validación UUID roja y
  reversión verde; 7/7 entregables presentes.
- [x] **TASK-001 — Setup, gate de invariantes y entorno Vercel.** `build`, `lint`,
  `check:invariants` y suite verdes; 2 archivos/9 pruebas; mutación roja y reversión verde; 9/9
  entregables presentes. Dos auditorías de Security alimentaron el hardening; la siguiente auditoría
  será la acumulada al final del proyecto.
- [x] Definición del alcance: **este repo es solo el backend**; los MCPs y agentes son clientes externos.
- [x] Análisis arquitectónico y descarte de sobreingeniería (NestJS vs Express/TS en Vercel).
- [x] Creación del Contrato de API formal ([API_CONTRACT.md](./API_CONTRACT.md)).
- [x] Definición del modelo de acceso a datos: **el agente no escribe SQL**, las queries las provee Ángel ([QUERIES.md](./QUERIES.md)).
- [x] Definición del marco de desarrollo multi-agente y DoD verificable ([ORCHESTRATION_LOOP.md](./ORCHESTRATION_LOOP.md)).

---

## 🚦 Bloqueadores Abiertos

**Todos los bloqueadores son queries pendientes de Ángel.**

👉 **El estado de las 9 queries y qué tarea bloquea cada una vive en [QUERIES §1](./QUERIES.md)** — única tabla de estado, no se duplica aquí. Para el contexto y las decisiones ya tomadas, ver [HANDOFF.md](./HANDOFF.md).

`TASK-001`, `TASK-002` y `TASK-002b` **no dependen de ninguna query** — son setup, capa core e infraestructura de testing. Se pueden arrancar hoy.

---

## 📝 Registro de decisiones activas

- **TASK-001 avanzó a paso 2.** Contrato fijado; QA escribe los tests antes de la implementación.
- **QA entregó TASK-001:** creó `tests/health.test.ts` y `tests/checkInvariants.test.ts` antes de
  existir implementación. El Lead registró SHA-256 `2412114F…F025` y `A8052EFD…C385`; se
  comprobarán nuevamente tras cada entrega de Backend. La fase roja espera el bootstrap del runner.
- **TASK-001 avanzó a paso 3:** Backend recibió únicamente el contrato y un checkpoint de bootstrap;
  no recibió tests, fixtures, hashes ni resultados.
- **Fase roja verificada por el Lead:** tras el bootstrap y antes de existir funcionalidad, la suite
  terminó con código distinto de cero por ausencia de los entregables funcionales. El resultado
  detallado permanece segregado; Backend recibió únicamente autorización para implementar el
  contrato.
- **Backend entregó TASK-001:** creó los artefactos funcionales autorizados y reportó `build`,
  `lint` y `check:invariants` verdes sin ejecutar tests. El Lead confirmó que los hashes de QA no
  cambiaron y avanzó al paso 4.
- **Validación de paso 4:** el Lead confirmó `npm run build`, `npm run lint` y
  `npm run check:invariants` con código de salida 0; TASK-001 avanzó al paso 5.
- **Suite funcional verde:** el Lead obtuvo 2 archivos y 3 tests aprobados. TASK-001 avanzó al
  paso 6; la mutación seleccionada deshabilita temporalmente la detección de `req.body.id_agente`.
- **Mutación verificada y revertida:** al retirar `body` de las fuentes prohibidas, la suite pasó a
  rojo por la invariante correspondiente; tras restaurarlo, volvió a 2 archivos y 3 tests verdes.
  Los hashes de QA permanecen intactos. TASK-001 avanzó al paso 8.
- **Security rechazó TASK-001 (iteración 1/3):** reprodujo evasiones de las tres familias del gate,
  el desvío de `/health` mediante cuerpos JSON malformados/sobredimensionados y divulgación de
  framework. No encontró exposición de secretos o archivos, acceso a DB desde health ni fallos del
  despliegue base. El contrato se reforzó y la tarea volvió a QA antes de corregir Backend.
- **Regresiones de Security entregadas por QA:** los nuevos hashes son `B79AB8D6…336F` y
  `CAFF6F51…FCAA`. El Lead confirmó fase roja contra la entrega rechazada. Backend recibió solo las
  reglas de negocio del contrato reforzado, sin tests, fixtures, valores esperados ni trazas.
- **Backend entregó corrección Security 1/3:** modificó únicamente `src/app.ts` y el gate; reportó
  sus tres validaciones permitidas verdes sin ejecutar tests. El Lead confirmó hashes de QA
  intactos y avanzó al paso 4.
- **Corrección funcional verde:** el Lead confirmó 2 archivos y 7 tests aprobados tras las
  regresiones de Security. Se seleccionó como mutación retirar temporalmente la supresión de
  `X-Powered-By`.
- **Segunda mutación verificada y revertida:** retirar `app.disable("x-powered-by")` puso la suite
  roja; restaurarlo devolvió 2 archivos y 7 tests verdes. TASK-001 regresó a Security para confirmar
  los arreglos de la iteración 1/3.
- **Security rechazó nuevamente el gate (iteración 2/3):** `/health` ya resistió todos los casos y
  los patrones básicos añadidos por QA fueron detectados, pero el análisis reforzado conserva
  variantes no detectadas y bloquea código TypeScript ordinario por nombres genéricos como
  `query`/`execute`. El problema dejó de ser una corrección puntual: falta definir si el gate será
  una allowlist sintáctica, una heurística acotada o un analizador de flujo especializado. La tarea
  volvió al paso 1 y no se delegará una tercera ronda sin decisión de Ángel.
- **Modelo del gate resuelto:** Ángel aprobó la allowlist sintáctica estricta. `*.queries.ts`, la
  ejecución de catálogo en repositorios y la entrada HTTP quedan limitados a formas explícitas y
  testeables; métodos ordinarios llamados `query`/`execute` no fallan solo por su nombre. La tercera
  ronda verificará esta gramática acotada, no análisis de flujo arbitrario.
- **Auth preparada para la migración futura:** TASK-002 implementará un `ContextResolver` inyectable.
  Hoy el único resolver habilitado usará `x-api-key` y `x-id-agente`; más adelante podrá sustituirse
  por un resolver que verifique token y produzca el mismo `{ id_agente }`. No se implementará modo
  dual, fallback ni parsing provisional de tokens.
- **TASK-001 retomó el paso 2:** con la allowlist ya aprobada, QA recibió el contrato acotado para
  escribir primero sus regresiones. Backend no recibió tests ni resultados y permanece fuera de esta
  fase.
- **QA entregó la allowlist en rojo:** modificó únicamente `tests/checkInvariants.test.ts`. El Lead
  verificó los checkpoints SHA-256 `B79AB8D6…336F` para health y `BB92C4E9…592A` para el gate. La
  tarea avanzó al paso 3; Backend recibió solo el contrato y mantiene prohibido leer o ejecutar tests.
- **Backend entregó la allowlist:** modificó únicamente `scripts/check-invariants.mjs`, no inspeccionó
  ni ejecutó tests y reportó `build`, `lint` y `check:invariants` verdes. TASK-001 avanzó al paso 4
  para validación independiente del Lead.
- **Validación de la entrega final del gate:** el Lead confirmó los dos hashes de QA sin cambios y
  obtuvo `build`, `lint` y `check:invariants` verdes. TASK-001 avanzó al paso 5.
- **Ajuste de costo de agentes:** Security queda estacionado y no se invocará al cerrar TASK-001 ni
  automáticamente en cada tarea. Volverá para una auditoría acumulada después de TASK-006 y antes de
  liberar, salvo solicitud extraordinaria de Ángel. Backend y QA se recrearán para las tareas
  posteriores con modelos más económicos. Los controles mecánicos del Lead —suite y mutación—
  permanecen sin cambios.
- **Suite roja por ambigüedad de ContextResolver:** la corrida segregada aprobó health y las cinco
  categorías de rechazo del gate, pero rechazó la forma limpia. El Lead contrastó contrato y prueba:
  QA había modelado un resolver que devolvía solo el UUID, mientras TASK-002 establece que devuelve
  el contexto completo. Se fijó la firma asíncrona
  `resolve(req): Promise<RequestContext>` y la asignación directa en auth; la tarea volvió a QA antes
  de dar cualquier instrucción a Backend.
- **Regresión de ContextResolver alineada:** QA actualizó únicamente su prueba del gate, confirmó
  rojo y el Lead registró los hashes `B79AB8D6…336F` y `75F5570C…7BB`. Backend recibió la regla de
  negocio asíncrona, sin acceso a tests, fixtures, hashes ni salida de Vitest.
- **Backend entregó la corrección asíncrona:** modificó únicamente el gate, no inspeccionó tests y
  reportó `build`, `lint` y `check:invariants` verdes. La tarea avanzó al paso 4.
- **Validación asíncrona independiente:** el Lead confirmó los hashes de QA sin cambios y repitió
  `build`, `lint` y `check:invariants` en verde. TASK-001 avanzó al paso 5.
- **Suite de allowlist verde:** el Lead obtuvo 2 archivos y 9 pruebas aprobadas. TASK-001 avanzó al
  paso 6; la mutación seleccionada hará que el gate rechace temporalmente el `await` contractual del
  ContextResolver.
- **Mutación final verificada y revertida:** al hacer que el gate rechazara temporalmente el `await`
  autorizado, la suite se puso roja; restaurar la condición devolvió 2 archivos y 9 pruebas a verde.
- **TASK-001 completada:** el cierre final confirmó `build`, `lint`, `check:invariants`, suite y 9/9
  entregables. El progreso global avanzó a 1/7. Conforme a la política de costo aprobada, Security no
  se invocó otra vez y permanece estacionado hasta la auditoría acumulada final.
- **TASK-002 inició pasos 1→2:** el contrato fija un `ContextResolver` asíncrono con una única
  implementación vigente por headers y sin modo token provisional. QA se recrea con un modelo más
  económico y escribe las pruebas antes de cualquier implementación Backend.
- **Ajuste contractual previo a Backend:** la primera entrega QA reveló que `getExecutor` seguía
  ambiguo frente a la allowlist ya aprobada. Se fijó `QueryExecutor` como objeto con método
  `execute`, `getExecutor(conn?)` con pool por defecto, y los exports públicos de auth. QA debe
  retirar el `mockExecutor` adelantado de TASK-002b y reemplazar el SQL de prueba inventado por un
  sentinel opaco antes de que Backend reciba la tarea.
- **Fase roja base confirmada por el Lead:** TASK-001 permanece verde (2 archivos/9 pruebas) y las
  cuatro suites nuevas fallan únicamente porque todavía no existen los módulos core. Antes de
  Backend, QA debe completar dos bordes del contrato: pool por defecto en `getExecutor()` y rechazo
  de configuración ausente o inválida en `loadEnv`.
- **QA completó TASK-002 en rojo:** el Lead verificó los hashes finales de auth
  `E525AA99…8EA6`, errores `181166CF…2E7B`, DB `756F3E62…1E6E` y env `C480DF56…B099`.
  No existe el helper reservado a TASK-002b. La tarea avanzó al paso 3 con un Backend económico.
- **Pausa solicitada durante TASK-002:** el Backend económico fue interrumpido en el paso 3. Alcanzó
  a crear los cinco archivos core previstos, pero no emitió entrega ni se ejecutaron validaciones
  posteriores; todo ese código se considera parcial y pendiente de revisión al reanudar.
- **TASK-002 reanudada por Ángel:** continúa el mismo Backend económico desde sus archivos parciales.
  No se le pidió releer la documentación completa; solo puede volver a la especificación atómica si
  necesita confirmar el contrato. La segregación de tests permanece intacta.
- **Backend entregó TASK-002:** completó los cinco módulos core e integró auth/error handling en la
  aplicación y validación de entorno en el servidor. Reportó `build`, `lint` y `check:invariants`
  verdes, sin leer/ejecutar tests ni escribir SQL. La tarea avanzó al paso 4.
- **Validación independiente de TASK-002:** el Lead confirmó los cuatro hashes QA intactos y obtuvo
  `build`, `lint` y `check:invariants` verdes. La tarea avanzó al paso 5.
- **Primera suite de TASK-002 interpretada:** TASK-001, env y el gate permanecen verdes. El Lead
  separó dos defectos del harness —auth sin `errorHandler` y mock DB acoplado al estilo de import— de
  un fallo real: `INTERNAL_ERROR` tipado no queda registrado. QA corrige primero sus pruebas sin ver
  implementación; después el Lead repetirá la suite antes de instruir Backend.
- **Harness QA corregido:** auth ahora prueba la cadena middleware + `errorHandler` y DB acepta ambos
  estilos válidos de importación. QA reportó DB, env y auth verdes; el Lead revalida la suite completa.
- **Fallo real aislado, iteración 1/3:** la suite completa obtuvo 5/6 archivos y 27/28 pruebas verdes.
  El único comportamiento pendiente es registrar internamente un `INTERNAL_ERROR` aunque llegue como
  `AppError` tipado, manteniendo genérica y sin `details` la respuesta. Backend recibió solo esa
  instrucción de negocio.
- **Backend entregó corrección 1/3:** modificó únicamente `errorHandler.ts`, sin inspeccionar tests,
  y reportó `build`, `lint` y `check:invariants` verdes. La tarea volvió al paso 4.
- **Corrección 1/3 validada mecánicamente:** el Lead confirmó hashes QA intactos y repitió build,
  lint e invariantes en verde. TASK-002 avanzó al paso 5.
- **Suite TASK-002 verde:** el Lead obtuvo 6 archivos y 28 pruebas aprobadas. La tarea avanzó al paso
  6; se seleccionó relajar temporalmente la validación UUID de `x-id-agente` como mutación.
- **Mutación UUID verificada y revertida:** aceptar temporalmente cualquier string como
  `x-id-agente` puso en rojo las pruebas de aislamiento; restaurar la validación UUID devolvió 6
  archivos y 28 pruebas a verde.
- **TASK-002 completada:** el cierre confirmó build, lint, invariantes, suite y 7/7 entregables. El
  progreso global avanzó a 2/7. Durante ejecuciones paralelas se observó de forma intermitente un
  `ECONNRESET` en el caso health con body sobredimensionado; las corridas finales fueron verdes y se
  conserva como señal a vigilar sin reactivar QA ahora.
- **QA pasa a ejecución por lotes:** para reducir tokens queda estacionado entre lotes. Se reactivará
  una vez para TASK-002b + pruebas previas de TASK-003, y otra para TASK-004/005/006 cuando estén
  aprobadas las siete queries restantes. Los tests siguen precediendo a Backend; no se abandona la
  caja negra.
- **Lote QA A iniciado:** el mismo QA económico continúa con TASK-002b sin releer el proyecto. El
  lote se divide en checkpoints para no contaminar el verde global: primero se cierra TASK-002b y
  después se escriben las pruebas rojas de TASK-003.
- **Primera entrega TASK-002b rechazada:** aunque la suite global quedó verde, ningún test importaba
  `mockExecutor` ni `catalogIntegrity`, por lo que sus garantías no tenían evidencia y una mutación
  sobreviviría. También faltaban UUID inválido, bloqueo de la llamada downstream y la fuente params.
  QA recibe una única corrección acotada, sin recargar documentación.
- **Cobertura TASK-002b corregida:** QA agregó pruebas ejecutables para `mockExecutor`, integridad del
  catálogo y los bordes multi-tenant faltantes. La infraestructura específica quedó verde, pero la
  corrida global volvió a observar `ECONNRESET` en health con body sobredimensionado. Al ser la
  tercera aparición, Backend económico recibe el requisito de drenar el stream sin parsearlo ni
  almacenarlo; QA vuelve a quedar estacionado.
- **Pausa y handoff solicitados por Ángel:** Backend alcanzó a modificar `src/app.ts` para drenar el
  stream de health, pero fue interrumpido antes de entregar o validar. TASK-002b permanece abierta en
  health 1/3; no se corrieron comandos después de ese cambio. `HANDOFF.md` fue reescrito como entrada
  autosuficiente para el siguiente orquestador, con hashes y orden exacto de reanudación.
- **Prompt de arranque preparado:** `NEXT_ORCHESTRATOR_PROMPT.md` contiene el bloque listo para copiar
  al nuevo Lead, incluyendo alcance, reglas, estado parcial y los primeros pasos exactos de TASK-002b.
- **Health confirmado:** `GET /health` será público y usará la respuesta normativa documentada en
  [TASK-001](./tasks/TASK-001-setup.md).
- **Gate de invariantes:** sus pruebas usarán proyectos mínimos temporales; no duplicarán el código
  real. Tras obtener verde, el Lead hará y revertirá una mutación controlada del gate para comprobar
  que su test detecta una regresión.
- **Contexto multi-tenant vigente:** durante estas tareas, `id_agente` sigue siendo un UUID tomado de
  `x-id-agente`. Está prevista una migración futura para derivarlo de un token, pero requiere cambiar
  y aprobar el contrato antes de implementarse; no se anticipará silenciosamente.
- **Queries:** se están recopilando con Ángel las nueve entradas de [QUERIES.md](./QUERIES.md).
  Cada entrada incompleta permanece pendiente o en revisión hasta contar con SQL aprobado,
  parámetros, forma de fila, reglas resueltas y ejemplos anonimizados suficientes.
- **Revisión de Reservas iniciada:** Ángel entregó material de origen para `Q-RES-01`. No se
  documentó el DDL ni se derivó SQL de él. La entrada permanece incompleta hasta recibir el `SELECT`
  ejecutable aprobado, sus parámetros, reglas cerradas y ejemplos; el estado exacto vive únicamente
  en [QUERIES.md](./QUERIES.md).
- **Decisiones parciales de `Q-RES-01`:** ya se fijaron exclusión de `Cancelada`, origen de `total`,
  zona horaria, filtro por `id_viajero`, semántica inicial del rango, búsqueda parcial de código y
  ordenamiento. Las discrepancias de identificadores, temporalidad y valores internos se conservan
  como pendientes en el catálogo; TASK-001 continúa en paso 1.
- **Contrato de Reservas actualizado:** `API_CONTRACT.md` v1.1.0 incorpora `en_curso`, rango de
  fechas emparejado, identificadores string, búsqueda parcial de confirmación y ordenamientos.
  También quedaron fijados los mapeos `flyght → vuelo`, `car_rental → renta_carros` y la regresión
  de espacios repetidos en nombres.
- **`Q-RES-01` aprobada:** SQL estático, 24 parámetros, fila no nullable y tres ejemplos
  anonimizados quedaron registrados en `QUERIES.md`. Se anotó como evolución futura —fuera del
  alcance actual— una posible migración a Query Builder limpio, condicionada a rediseñar gate,
  contrato de persistencia y pruebas. TASK-003 sigue bloqueada por `Q-RES-02`.
- **`Q-RES-02` aprobada:** el conteo replica los filtros de `Q-RES-01` con 19 parámetros y omite
  orden/paginación. Ángel confirmó una fila por `id_booking`. TASK-003 quedó desbloqueada por
  queries, pero conserva su dependencia de TASK-002b.

---

## 👥 Registro de Agentes y Roles

Nombres canónicos definidos en [ORCHESTRATION_LOOP §1](./ORCHESTRATION_LOOP.md). El brief que se le entrega a cada subagente vive en [`agents/`](./agents/).

| Rol | Brief | Especialidad |
| :--- | :--- | :--- |
| 👑 **Lead** | [agents/LEAD.md](./agents/LEAD.md) | Desglose de tareas, segregación, ejecución e interpretación de la suite, verificación de mutación. |
| 💻 **Backend** | [agents/BACKEND.md](./agents/BACKEND.md) | TypeScript, Express, Zod, repositorios y services. No lee tests ni escribe SQL. |
| 🛡️ **QA** | [agents/QA.md](./agents/QA.md) | Vitest, Supertest, mocking del executor y fixtures del catálogo. |
| 🔴 **Security** | [agents/SECURITY.md](./agents/SECURITY.md) | Red teaming de aislamiento multi-tenant, validación e inyección. |
