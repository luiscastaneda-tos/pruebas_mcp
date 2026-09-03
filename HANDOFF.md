# 🤝 HANDOFF — MIA Backend Gateway

**Última actualización:** 3 de septiembre de 2026  
**Repositorio:** el directorio de trabajo actual del agente (raíz del repo). Ángel trabaja desde dos máquinas — ver tabla de rutas conocidas más abajo.  
**Estado:** `5/7 tareas completadas` (TASK-001, TASK-002, TASK-002b, TASK-003, TASK-004, TASK-005 ✅).  
**Siguiente paso:** `TASK-006 — Consolidación de la suite y cobertura` — **suspendida**: depende de QA/TDD, y esa fase está en pausa por decisión vigente de Ángel (ver regla 3 abajo). No arrancar hasta que él la reactive.

**Rutas conocidas por máquina** (referencia — el Lead identifica la máquina activa por el formato del working directory y usa la fila correspondiente):

| | macOS | Windows |
| :--- | :--- | :--- |
| Repo (`pruebas_mcp`) | `/Users/angelcstd/Documents/Programación/trabajo/pruebas_mcp` | `C:\Users\Operaciones\Desktop\MIA_OFICIAL\pruebas_mcp` |
| Backend legacy (`bacl`) | `/Users/angelcstd/Documents/Programación/trabajo/bacl` | `C:\Users\Operaciones\Desktop\MIA_OFICIAL\bacl` |
| Binario `codex` | `/Users/angelcstd/.local/bin/codex` | en el `PATH` (`codex` basta) |

---

## 1. Alcance y Reglas Operativas Vigentes

1. **Backend Puro:** Este repositorio construye únicamente el backend REST en TypeScript/Express sobre arquitectura limpia desplegable en Vercel. MCPs, bots y frontends son clientes externos.
2. **Mecanismo de Ejecución con Codex CLI:**
   El Lead Orchestrator delega la escritura de código a Codex CLI mediante:
   ```bash
   # macOS (MacBook de Ángel)
   /Users/angelcstd/.local/bin/codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check -C "/Users/angelcstd/Documents/Programación/trabajo/pruebas_mcp" "<INSTRUCCION_ESPECIFICA>" < /dev/null

   # Windows (laptop actual de Ángel)
   codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check -C "C:\Users\Operaciones\Desktop\MIA_OFICIAL\pruebas_mcp" "<INSTRUCCION_ESPECIFICA>" < /dev/null
   ```
   `codex` ya está en el `PATH` en ambas máquinas — no hace falta la ruta completa al binario. El Lead detecta la máquina por el formato del working directory (`/Users/angelcstd/...` → macOS, `C:\Users\Operaciones\...` → Windows) y usa la variante correspondiente; ambos comandos se ejecutan desde Git Bash, así que `< /dev/null` funciona en los dos casos.

   > ⚠️ **REGLA OBLIGATORIA:** El Lead Orchestrator **DEBE presentar la propuesta y pedir confirmación/visto bueno al usuario SIEMPRE antes de ejecutar a Codex**. Nunca ejecutar en segundo plano sin autorización expresa.
3. **Comandos y Validación:**
   * **PROHIBIDO `npm run build`:** Utilizar `npm run dev` (`tsx watch src/server.ts`) para el entorno activo.
   * **Validación estática obligatoria:** `npm run check:invariants` (cero violaciones), `npm run lint` (cero advertencias/errores), y `npx tsc --noEmit` (cero errores de compilación).
   * **Pruebas contra BD real: ya autorizadas desde el 2026-09-03.** La base está conectada (MySQL local, ver §5). Antes de cada tanda de pruebas, confirmar con Ángel que sigue vigente para la sesión actual — no asumir que un `.env` de una sesión anterior sigue siendo válido sin preguntar.
   * **QA / TDD omitido:** No generar archivos `.test.ts` ni correr ciclos TDD en esta etapa para optimizar tokens y velocidad de entrega.
4. **Cero `any`:** Únicamente interfaces, tipos explícitos, genéricos o `unknown` con type guards.
5. **Gate de Invariantes Estricto (`scripts/check-invariants.mjs`):**
   * Archivos `*.queries.ts`: solo importaciones de tipos y constantes exportadas con string literal estático (o template literals sin sustitución).
   * Archivos `*.repository.ts`: llamadas exactas `executor.execute(QUERY_IMPORTADA_DIRECTAMENTE, params)`. Prohibido crear aliases o destructurar `executor`.
   * Archivos `*.controller.ts`: validación obligatoria y directa de `req.body` y `req.params` con Zod (`schema.parse(req.body)` / `schema.parse(req.params)`). Prohibido acceder a propiedades antes de validar.
   * Tenant: `req.context.id_agente` consumido directamente, sin destructurar.
6. **Catálogo de Queries ([QUERIES.md](./QUERIES.md)):** Única fuente de SQL del proyecto. Ningún agente inventa SQL. Toda query es provista o aprobada por Ángel.

---

## 2. Estado de Tareas Completadas (5/7)

* ✅ **TASK-001 — Setup y Base:** Configuración TypeScript estricto, Express, Vercel, `GET /health` y gate de invariantes (`scripts/check-invariants.mjs`).
* ✅ **TASK-002 — Core DB y Auth:** Configuración de entorno (`env.ts` con Zod), pool MySQL y `QueryExecutor` (`db.ts`), errores tipados (`errors/index.ts`), `errorHandler.ts` y middleware de autenticación con `HeaderContextResolver` (`auth.ts`).
* ✅ **TASK-002b — Testing Infra y Drenado de Health:** Corrección del socket en `GET /health` (drenado en streaming sin reset), suite base y helpers.
* ✅ **TASK-003 — Módulo de Reservas:**
  * Endpoints: `POST /api/v1/reservas/filtrar`.
  * Queries: `Q-RES-01` (listado) y `Q-RES-02` (conteo) ejecutadas en paralelo con 24 y 19 parámetros posicionales.
  * Lógica: Normalización de servicios (`flyght → vuelo`, `car_rental → renta_carros`), limpieza de nombres, filtros temporales (`proximas`, `en_curso`, `pasadas`, `todas`), paginación y pares de fechas.
* ✅ **TASK-004 — Módulo de Cupones:**
  * Endpoints:
    * `GET /api/v1/cupones/hotel/:id_booking`
    * `GET /api/v1/cupones/vuelo/:id_viaje_aereo`
    * `GET /api/v1/cupones/auto/:id_renta_autos`
    * `GET /api/v1/cupones/:id` (unificado)
  * Queries: `Q-AGE-01` (existencia del agente), `Q-CUP-01` (resolución de tipo/relación), `Q-CUP-02` (detalle hotel), `Q-CUP-03` (cabecera y tramos vuelo), `Q-CUP-04` (detalle auto).
  * Lógica: Verificación previa del agente, mapeo de fichas estructuradas según contrato, rutas específicas antes del comodín `/:id`.

> 📌 **Tarea Pendiente Documentada:** La vinculación estricta de pertenencia del cupón y reserva por `id_agente` dentro de los JOINs de las consultas se implementará en una fase posterior una vez que la base de datos esté plenamente conectada y verificada.

* ✅ **TASK-005 — Módulos de Viajeros y Finanzas:**
  * Endpoints: `GET /api/v1/viajeros` (con `busqueda` opcional), `GET /api/v1/finanzas/saldo-credito` (unificado — no son dos endpoints separados, ver nota abajo).
  * Queries: `Q-VIA-01` (directorio de viajeros), `Q-FIN-01` (wallet) y `Q-FIN-02` (crédito), ejecutadas en paralelo con `Promise.all`.
  * **Contrato de finanzas simplificado el 2026-09-03** (decisión de Ángel, ver `API_CONTRACT.md §2.4`): wallet sin `desglose` por método de pago (no existe esa columna en el origen); crédito sin `tiene_credito` ni `credito_utilizado` (no hay bandera de crédito activo en `agentes` — queda suspendido).
  * Lógica: `nombre_completo` se arma en el service (trim de cada parte + colapso de espacios), no en el SQL.
  * Validado por el Lead (no solo reportado por Codex): `check:invariants`, `lint` y `tsc --noEmit` en verde.
  * ~~Punto abierto: agente inexistente causaba `500` genérico~~ — **resuelto el 2026-09-03**: `viajeros` y `finanzas` ahora corren `assertAgentExists` (patrón de `cupones`, `Q-AGE-01`) antes de cualquier otra query, y lanzan `NotFoundError` tipado si el agente no existe.

---

## 3. Sesión de pruebas en vivo — 2026-09-03 (primera vez con MySQL real)

Hasta hoy, todo el proyecto se había probado únicamente con `mockExecutor` (nunca contra MySQL
real). Ángel conectó su MySQL local y probamos `viajeros`, `finanzas`, `reservas` y `cupones` de
punta a punta. Se encontraron y corrigieron **4 bugs reales**, todos invisibles para los mocks:

1. **`Q-FIN-01` (finanzas):** `id_agente` suelto en el `SELECT` junto a `SUM()` sin `GROUP BY` →
   truena bajo `sql_mode=only_full_group_by`. Corregido quitando `id_agente` del `SELECT` (no se
   usaba en el DTO). Ver `Q-FIN-01` en `QUERIES.md`.
2. **`viajeros` — nombres en `NULL`:** `primer_nombre`/`segundo_nombre`/`apellido_paterno`/
   `apellido_materno` pueden venir `NULL` en producción (no solo `''` como se asumió al aprobar
   `Q-VIA-01`). `mapViajero` ahora tolera `null` en las 4 partes antes de `.trim()`.
3. **`src/core/config/db.ts` — decimales como string:** mysql2 devuelve columnas `DECIMAL` como
   `string` por defecto (`"10933.00"` en vez de `10933`), rompiendo el contrato de tipos numéricos
   en `reservas.total` y los 3 campos monetarios de `finanzas`. Corregido con `decimalNumbers: true`
   en el pool — arregla todos los módulos de un solo cambio.
4. **`src/core/config/db.ts` — fechas con hora completa:** mysql2 devuelve columnas `DATE` como
   `Date` de JS, serializando a ISO completo (`"2026-08-23T06:00:00.000Z"`) en vez de solo fecha
   (`"2026-08-23"`, lo que promete `API_CONTRACT.md`). Corregido con `dateStrings: true` en el mismo
   pool. Afectaba a `reservas.check_in`/`check_out` desde TASK-003, sin que nadie lo notara.

**Hallazgo operativo, no un bug de código — `cupones/hotel`:**
`Q-CUP-02` también truena bajo `sql_mode=only_full_group_by` (el `GROUP BY s.id_solicitud` con
columnas no dependientes de tablas unidas). Ángel corrió en su MySQL local:
```sql
SET GLOBAL sql_mode = (SELECT REPLACE(@@GLOBAL.sql_mode, 'ONLY_FULL_GROUP_BY', ''));
```
Esto **no persiste** si se reinicia el servicio de MySQL — para que quede fijo hay que agregar
`sql-mode` sin `ONLY_FULL_GROUP_BY` en `my.ini` y reiniciar. Con eso corregido, `cupones/hotel`
**sí funciona** — el bug real no era de código: hay que mandarle **`id_solicitud_client`** (no
`id_booking`) para reservas que todavía viven solo como `solicitudes` y no están sincronizadas a
`vw_details_booking`/`bookings`. La ruta y el parámetro se siguen llamando `:id_booking` porque la
query ya acepta los tres formatos por diseño (`id_solicitud` OR `id_booking` OR `id_relacion`) — es
solo una aclaración operativa para quien pruebe, no requiere cambio de código.

**Cupones — vuelo y auto, verificados también en vivo (2026-09-03):** usando `id_relacion` real
sacado de `reservas` filtrando por `tipo_servicio`, se probó `Q-CUP-03` (vuelo) y `Q-CUP-04` (auto)
contra MySQL real. Ambos responden sin error y con la forma documentada. Con esto, `API_CONTRACT.md
§2.2` quedó **confirmado** (ya no dice "pendiente") — los 3 cupones (hotel, vuelo, auto) verificados
contra datos reales el mismo día.

> 📌 **Punto abierto, decisión de Ángel:** en el cupón de vuelo, `origen.iata`/`destino.iata` mapea
> directo `departure_airport`/`arrival_airport` sin parsear (`cleanText(row.departure_airport)`,
> `cupones.service.ts`). En al menos un caso real, esa columna trae la descripción completa del
> aeropuerto (`"Monterrey, Nuevo Leon, Mexico (MTY/MMMY General Mariano Escobedo Intl.)"`), no un
> código de 3 letras como sugiere el ejemplo del contrato (`"GDL"`). No se tocó — falta que Ángel
> decida si se extrae el código IATA de esa columna (ej. regex sobre el paréntesis) o se deja tal
> cual porque es información real, no un bug.

---

## 4. Punto Exacto de Reanudación: TASK-006

**Objetivo:** Consolidación de la suite y cobertura (`tasks/TASK-006-integration-tests.md`).

**Bloqueada por decisión de Ángel, no por queries:** TASK-006 es trabajo de QA/TDD, y esa fase está
suspendida en esta etapa (regla 3 de la sección 1) para ahorrar tokens y avanzar más rápido. No se
retoma hasta que Ángel lo indique explícitamente.

---

## 5. Cómo dejar el entorno local para probar contra BD real

Estos pasos son específicos de la máquina Windows actual, documentados el 2026-09-03:

1. `cp .env.example .env` (o copiarlo a mano) — `.env` está en `.gitignore`, nunca se commitea.
2. Confirmar que `agentes_viajeros` (vista) tiene `DEFINER` válido en el MySQL local — si no
   existe el usuario definer, hay que corregirlo directo en MySQL (no es algo que este backend
   pueda arreglar).
3. Si aparecen errores `ER_MIX_OF_GROUP_FUNC_AND_FIELDS` / `ER_WRONG_FIELD_WITH_GROUP`, correr en
   MySQL: `SET GLOBAL sql_mode = (SELECT REPLACE(@@GLOBAL.sql_mode, 'ONLY_FULL_GROUP_BY', ''));`
4. Arrancar con `npm run dev` y probar. Si necesitas ver errores reales de un endpoint y el log del
   proceso en background no muestra el `console.error` (pasó varias veces hoy, causa no
   diagnosticada — posible buffering de stdio de Windows/Git Bash con procesos anidados
   `npm.cmd → tsx → node`), invoca el service directo con un script `tsx` suelto en vez de pasar
   por HTTP — es más confiable para depurar.
