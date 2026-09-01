# 🗄️ Catálogo de Queries Autorizadas

Este documento es la **única fuente de acceso a datos** del proyecto.

---

## ⛔ Regla Fundamental

> **El agente de desarrollo no conoce la base de datos y no debe escribir SQL.**
>
> No tiene acceso al esquema, ni a las tablas, ni a las vistas. No infiere nombres de columnas.
> No adapta queries del backend legacy. No "deduce" un JOIN.
>
> Toda query de este catálogo la **provee Ángel**. El agente únicamente:
> 1. La ejecuta desde el repositorio con parámetros seguros.
> 2. Mapea las filas resultantes a DTOs limpios.
>
> Si una tarea requiere datos para los que **no existe una query aprobada aquí**, el agente
> **detiene la tarea** y emite una *Solicitud de Query* (§3). Nunca la inventa para avanzar.

**Por qué:** una query inventada contra un esquema que el agente no conoce falla en runtime, o peor —
devuelve datos incorrectos silenciosamente, o rompe el aislamiento multi-tenant. Ninguno de los tres
lo detectan tests escritos por el mismo agente.

---

## 1. Estado del Catálogo

> Esta tabla es la **única fuente de estado** de las queries en todo el repo. `PROGRESS.md`,
> `HANDOFF.md` y `ORCHESTRATION_LOOP.md` apuntan aquí; no la copian. Si encuentras una copia en
> otro archivo, bórrala — una tabla duplicada se desincroniza y un loop autónomo toma decisiones
> con la copia vieja.

| ID | Módulo | Propósito | Estado |
| :--- | :--- | :--- | :---: |
| `Q-RES-01` | Reservas | Listado filtrado de reservas por agente | ✅ Aprobada |
| `Q-RES-02` | Reservas | Conteo total para paginación | ✅ Aprobada |
| `Q-CUP-01` | Cupones | Resolver cupón por identificador unificado | ⏳ Pendiente |
| `Q-CUP-02` | Cupones | Detalle de cupón de hotel | ⏳ Pendiente |
| `Q-CUP-03` | Cupones | Detalle de cupón de vuelo (tramos) | ⏳ Pendiente |
| `Q-CUP-04` | Cupones | Detalle de cupón de auto | ⏳ Pendiente |
| `Q-VIA-01` | Viajeros | Directorio de viajeros por agente | ⏳ Pendiente |
| `Q-FIN-01` | Finanzas | Desglose de wallet / saldos a favor | ⏳ Pendiente |
| `Q-FIN-02` | Finanzas | Estado de línea de crédito | ⏳ Pendiente |

**Leyenda:** ⏳ Pendiente de Ángel · ✅ Aprobada · 🔄 En revisión

Ninguna tarea que dependa de una query ⏳ puede iniciarse.

### `Q-RES-01` — Listado filtrado de reservas por agente

**Módulo:** `reservas` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-01

**SQL aprobado** (se copia literalmente, incluidos comentarios y formato):

```sql
SELECT
    id_booking,
    id_relacion,
    id_solicitud_client,
    type,
    codigo_confirmacion,
    proveedor,
    nombre_viajero,
    check_in,
    check_out,
    estado,
    total,
    metodo_pago
FROM vw_new_details_booking
WHERE
    estado <> 'Cancelada'
    AND id_agente = ?

    -- Temporalidad
    AND (
        ? = 'todas'
        OR (? = 'proximas' AND check_in > ?)
        OR (
            ? = 'en_curso'
            AND check_in <= ?
            AND check_out >= ?
        )
        OR (? = 'pasadas' AND check_out < ?)
    )

    -- Viajero
    AND (
        ? IS NULL
        OR id_viajero = ?
    )

    -- Tipo de servicio
    AND (
        ? IS NULL
        OR type = ?
    )

    -- Código de confirmación
    AND (
        ? IS NULL
        OR codigo_confirmacion LIKE CONCAT('%', ?, '%')
    )

    -- Rango de fechas
    AND (
        ? IS NULL
        OR check_in >= ?
    )

    AND (
        ? IS NULL
        OR check_in <= ?
    )

ORDER BY
    CASE
        WHEN ? = 'proximas' THEN check_in
    END ASC,

    CASE
        WHEN ? IN ('en_curso', 'pasadas') THEN check_out
    END DESC,

    CASE
        WHEN ? = 'todas' THEN created_at
    END DESC

LIMIT ?
OFFSET ?;
```

**Parámetros posicionales:**

| # | Nombre | Tipo | Notas |
| :-- | :--- | :--- | :--- |
| 1 | `id_agente` | `string` (UUID) | Siempre desde `req.context`. |
| 2 | `temporalidad` | enum | Rama `todas`. |
| 3 | `temporalidad` | enum | Rama `proximas`. |
| 4 | `hoy` | `YYYY-MM-DD` | Calculado en `America/Mexico_City`. |
| 5 | `temporalidad` | enum | Rama `en_curso`. |
| 6 | `hoy` | `YYYY-MM-DD` | Frontera de `check_in`. |
| 7 | `hoy` | `YYYY-MM-DD` | Frontera de `check_out`. |
| 8 | `temporalidad` | enum | Rama `pasadas`. |
| 9 | `hoy` | `YYYY-MM-DD` | Frontera de `check_out`. |
| 10 | `id_viajero` | `string \| null` | `null` omite el filtro. |
| 11 | `id_viajero` | `string \| null` | Valor de comparación. |
| 12 | `tipo_servicio` | `string \| null` | Valor interno; `null` omite el filtro. |
| 13 | `tipo_servicio` | `string \| null` | Valor de comparación. |
| 14 | `codigo_confirmacion` | `string \| null` | `null` omite el filtro. |
| 15 | `codigo_confirmacion` | `string \| null` | Texto crudo; el SQL agrega `%`. |
| 16 | `startDate` | `YYYY-MM-DD \| null` | `null` omite el límite inferior. |
| 17 | `startDate` | `YYYY-MM-DD \| null` | Valor de comparación. |
| 18 | `endDate` | `YYYY-MM-DD \| null` | `null` omite el límite superior. |
| 19 | `endDate` | `YYYY-MM-DD \| null` | Valor de comparación. |
| 20 | `temporalidad` | enum | Orden de `proximas`. |
| 21 | `temporalidad` | enum | Orden de `en_curso` / `pasadas`. |
| 22 | `temporalidad` | enum | Orden de `todas`. |
| 23 | `limit` | `number` | Entero validado; máximo 20. |
| 24 | `offset` | `number` | Entero validado. |

**Forma de la fila devuelta** (los doce campos son obligatorios y no admiten `null`):

```ts
{
  id_booking: string;
  id_relacion: string;
  id_solicitud_client: string;
  type: 'flyght' | 'hotel' | 'car_rental';
  codigo_confirmacion: string;
  proveedor: string;
  nombre_viajero: string;
  check_in: string;
  check_out: string;
  estado: string;
  total: number;
  metodo_pago: string;
}
```

**Decisiones confirmadas por Ángel:**

- Se excluye únicamente el estado exacto `Cancelada`; las reservas pendientes sí se muestran.
- El importe público `total` procede del campo de negocio `total`, no de `costo_total`.
- La zona horaria de negocio para determinar “hoy” es `America/Mexico_City`.
- El rango de fechas selecciona reservas cuyo `check_in` comienza dentro del rango.
- `startDate` y `endDate` se envían juntas, el rango es inclusivo y `startDate <= endDate`.
- Se elimina el filtro por nombre: el cliente seleccionará al viajero por `id_viajero`.
- `codigo_confirmacion` usa coincidencia parcial sin distinguir mayúsculas.
- Orden acordado: próximas por fecha más cercana, pasadas por fecha más reciente y todas por
  creación más reciente.
- Las temporalidades son exclusivas: `proximas` usa `check_in > HOY`; `en_curso` usa
  `check_in <= HOY` y `check_out >= HOY`; `pasadas` usa `check_out < HOY`; `todas` no filtra.
  `en_curso` se ordena por `check_out` descendente.
- `id_booking` e `id_viajero` son strings con prefijo, no números.
- El service normaliza tipos internos: `flyght → vuelo`, `car_rental → renta_carros`; `hotel` se
  conserva. La vista no se modifica para esta transformación.
- Los nombres se entregan sin espacios repetidos: el mapeo recorta extremos y colapsa secuencias de
  espacios. Los fixtures deben conservar al menos un nombre crudo con espacios repetidos para probar
  esta regresión, que ya causó fallos en otros desarrollos.
- Sin resultados, el endpoint devuelve `data: []`.

**Filas de ejemplo anonimizadas aprobadas.** Se preservan los valores internos de `type` y un caso
de espacios repetidos porque son entradas que el service debe normalizar:

```json
[
  {
    "id_booking": "boo-10000000-0000-4000-8000-000000000001",
    "id_relacion": "vue-10000000-0000-4000-8000-000000000001",
    "id_solicitud_client": "sol-10000000-0000-4000-8000-000000000001",
    "type": "flyght",
    "codigo_confirmacion": "PNR-EJEMPLO-01",
    "proveedor": "Aerolínea Ejemplo",
    "nombre_viajero": "ANA  PÉREZ   LÓPEZ",
    "check_in": "2026-06-12",
    "check_out": "2026-06-12",
    "estado": "Confirmada",
    "total": 5550.6,
    "metodo_pago": "Credito"
  },
  {
    "id_booking": "boo-20000000-0000-4000-8000-000000000002",
    "id_relacion": "hos-20000000-0000-4000-8000-000000000002",
    "id_solicitud_client": "sol-20000000-0000-4000-8000-000000000002",
    "type": "hotel",
    "codigo_confirmacion": "HOTEL-EJEMPLO-02",
    "proveedor": "Hotel Ejemplo Centro",
    "nombre_viajero": "LUIS MARTÍNEZ GARCÍA",
    "check_in": "2026-07-23",
    "check_out": "2026-07-24",
    "estado": "Confirmada",
    "total": 1513.8,
    "metodo_pago": "Credito"
  },
  {
    "id_booking": "boo-30000000-0000-4000-8000-000000000003",
    "id_relacion": "ren-30000000-0000-4000-8000-000000000003",
    "id_solicitud_client": "sol-30000000-0000-4000-8000-000000000003",
    "type": "car_rental",
    "codigo_confirmacion": "AUTO-EJEMPLO-03",
    "proveedor": "Arrendadora Ejemplo",
    "nombre_viajero": "MARIO GÓMEZ TORRES",
    "check_in": "2026-02-27",
    "check_out": "2026-03-13",
    "estado": "Confirmada",
    "total": 21697.8,
    "metodo_pago": "Credito"
  }
]
```

**Proyección requerida del `SELECT` final** (solo estos campos de salida, con estos aliases):

| Campo | Tipo público esperado | Tratamiento posterior |
| :--- | :--- | :--- |
| `id_booking` | `string` | Sin transformación. |
| `id_relacion` | `string` | Sin transformación. |
| `id_solicitud_client` | `string` | Sin transformación. |
| `type` | `string` interno | Service: `flyght → vuelo`, `car_rental → renta_carros`, `hotel → hotel`. |
| `codigo_confirmacion` | `string` | Sin transformación. |
| `proveedor` | `string` | Sin transformación. |
| `nombre_viajero` | `string` | Recortar extremos y colapsar espacios repetidos. |
| `check_in` | `YYYY-MM-DD` | String de fecha. |
| `check_out` | `YYYY-MM-DD` | String de fecha. |
| `estado` | `string` | Se excluye únicamente `Cancelada`. |
| `total` | `number` | Procede de `total`, nunca de `costo_total`. |
| `metodo_pago` | `string` | Sin transformación. |

`created_at`, `id_agente`, `id_viajero` y otros campos pueden intervenir en filtros u ordenamiento,
pero no forman parte de la fila devuelta al cliente.

**Entradas lógicas que debe soportar el SQL estático:**

| Entrada | Origen | Regla |
| :--- | :--- | :--- |
| `id_agente` | `req.context` | Obligatoria y primer parámetro; nunca se omite. |
| `hoy` | Aplicación, zona `America/Mexico_City` | No viene del cliente; permite evaluar temporalidad de forma determinista. |
| `temporalidad` | Body validado | Obligatoria: `proximas`, `en_curso`, `pasadas` o `todas`. |
| `id_viajero` | Body validado | `null` omite el filtro; un string `via-...` filtra por coincidencia exacta. |
| `tipo_servicio` | Body validado y normalizado | Ausente o `todos` se convierte en `null`; `vuelo → flyght`, `renta_carros → car_rental`, `hotel → hotel`. |
| `codigo_confirmacion` | Body validado | `null` omite el filtro; otro valor busca una subcadena sin distinguir mayúsculas. |
| `startDate` / `endDate` | Body validado | Ambos `null` omiten el rango; ambos presentes filtran `check_in` dentro del rango inclusivo. Nunca llega solo uno. |
| `limit` | Derivado de `length` | Entero validado, máximo 20. |
| `offset` | Derivado de `page` y `length` | Entero validado: `(page - 1) * length`. |

El SQL entregado puede repetir entradas si necesita más de un placeholder para aplicar una regla.
La tabla posicional final debe enumerar **cada** `?` en el orden real, incluidas repeticiones.

**Nota de evolución futura — no forma parte de la implementación actual.** Se evaluará migrar esta
query estática a un Query Builder limpio y con allowlist si crece la reutilización de filtros. Antes
de hacerlo deben aprobarse un nuevo contrato de persistencia, el rediseño del gate de invariantes y
pruebas de todas las variantes generadas. Hasta entonces, el repositorio ejecuta exclusivamente el
SQL estático anterior.

### `Q-RES-02` — Conteo total para paginación

**Módulo:** `reservas` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-01

**Propósito:** Contar todas las reservas que coinciden con los mismos filtros de `Q-RES-01`, antes
de aplicar paginación. Ángel confirmó que `vw_new_details_booking` produce exactamente una fila por
`id_booking`, sin duplicaciones por joins.

**SQL aprobado** (se copia literalmente, incluidos comentarios y formato):

```sql
SELECT
    count(id_booking) as total
FROM vw_new_details_booking
WHERE
    estado <> 'Cancelada'
    AND id_agente = ?

    -- Temporalidad
    AND (
        ? = 'todas'
        OR (? = 'proximas' AND check_in > ?)
        OR (
            ? = 'en_curso'
            AND check_in <= ?
            AND check_out >= ?
        )
        OR (? = 'pasadas' AND check_out < ?)
    )

    -- Viajero
    AND (
        ? IS NULL
        OR id_viajero = ?
    )

    -- Tipo de servicio
    AND (
        ? IS NULL
        OR type = ?
    )

    -- Código de confirmación
    AND (
        ? IS NULL
        OR codigo_confirmacion LIKE CONCAT('%', ?, '%')
    )

    -- Rango de fechas
    AND (
        ? IS NULL
        OR check_in >= ?
    )

    AND (
        ? IS NULL
        OR check_in <= ?
    );
```

**Parámetros posicionales:**

| # | Nombre | Tipo | Notas |
| :-- | :--- | :--- | :--- |
| 1 | `id_agente` | `string` (UUID) | Siempre desde `req.context`. |
| 2 | `temporalidad` | enum | Rama `todas`. |
| 3 | `temporalidad` | enum | Rama `proximas`. |
| 4 | `hoy` | `YYYY-MM-DD` | Calculado en `America/Mexico_City`. |
| 5 | `temporalidad` | enum | Rama `en_curso`. |
| 6 | `hoy` | `YYYY-MM-DD` | Frontera de `check_in`. |
| 7 | `hoy` | `YYYY-MM-DD` | Frontera de `check_out`. |
| 8 | `temporalidad` | enum | Rama `pasadas`. |
| 9 | `hoy` | `YYYY-MM-DD` | Frontera de `check_out`. |
| 10 | `id_viajero` | `string \| null` | `null` omite el filtro. |
| 11 | `id_viajero` | `string \| null` | Valor de comparación. |
| 12 | `tipo_servicio` | `string \| null` | Valor interno; `null` omite el filtro. |
| 13 | `tipo_servicio` | `string \| null` | Valor de comparación. |
| 14 | `codigo_confirmacion` | `string \| null` | `null` omite el filtro. |
| 15 | `codigo_confirmacion` | `string \| null` | Texto crudo; el SQL agrega `%`. |
| 16 | `startDate` | `YYYY-MM-DD \| null` | `null` omite el límite inferior. |
| 17 | `startDate` | `YYYY-MM-DD \| null` | Valor de comparación. |
| 18 | `endDate` | `YYYY-MM-DD \| null` | `null` omite el límite superior. |
| 19 | `endDate` | `YYYY-MM-DD \| null` | Valor de comparación. |

**Forma de la fila devuelta:**

```ts
{ total: number }
```

La query siempre devuelve una fila. Ejemplos anonimizados de ejecuciones independientes:

```json
[
  { "total": 0 },
  { "total": 3 },
  { "total": 27 }
]
```

**Reglas ya resueltas:**

- Los filtros son equivalentes a `Q-RES-01`.
- No aplica orden, límite ni offset.
- `total` representa todas las coincidencias antes de paginar.
- Sin coincidencias devuelve `{ "total": 0 }`, no ausencia de fila.

> La definición de la vista recibida se usó solo para revisar disponibilidad de campos. No se
> documenta como DDL ni autoriza al agente a derivar o construir SQL.

---

## 2. Formato de una Query Aprobada

Cada query entregada se documenta con esta estructura. El agente **no necesita saber nada más**
que lo que aparece aquí — ni de dónde salen los datos, ni cómo se relacionan las tablas.

---

### `Q-XXX-NN` — Nombre descriptivo

**Módulo:** `reservas` · **Estado:** ✅ Aprobada · **Entregada:** YYYY-MM-DD

**Propósito:** Qué responde esta query, en una línea.

**SQL:**
```sql
SELECT ...
FROM ...
WHERE id_agente = ?
  AND ...;
```

**Parámetros (en orden posicional):**

| # | Nombre | Tipo | Obligatorio | Notas |
| :-- | :--- | :--- | :---: | :--- |
| 1 | `id_agente` | `string` (UUID) | ✅ | Siempre desde `req.context`, nunca del input del cliente. |
| 2 | `...` | | | |

**Forma de la fila devuelta** (para tipar el DTO — el agente mapea **solo estos campos**):

```ts
{
  campo_a: string;
  campo_b: number | null;
}
```

**Filas de ejemplo — 2 a 3, anonimizadas** (obligatorio; son el fixture de los tests):

```json
[
  { "campo_a": "...", "campo_b": 1234 },
  { "campo_a": "...", "campo_b": null }
]
```

> **Por qué esto es obligatorio y no un extra.** El agente no tiene acceso a la base de datos —
> por diseño. Si además inventa las filas con las que prueba, escribe el mock y el test contra su
> propio mock: verde permanente que no prueba nada. Estas filas son la única entrada de datos
> reales al loop. Inclúyelas siempre, con al menos una que ejercite los casos incómodos:
> un `NULL`, un cero, un string con acentos, una fecha en frontera.
>
> Si una query llega sin filas de ejemplo, el agente **no las inventa**: la trata como query
> incompleta y pide las filas igual que pediría la query (§3).

**Reglas de negocio que la query ya aplica** (el agente no las reimplementa en el service):
- ...

**Notas / advertencias:**
- ...

---

## 3. Protocolo de Solicitud de Query

Cuando el agente necesita datos sin query aprobada, **para la tarea** y emite esto.
No escribe SQL tentativo, no propone un esquema, no continúa con un stub.

```markdown
## 🔴 Solicitud de Query — bloquea `TASK-XXX`

**Módulo:** reservas
**Propósito:** Necesito obtener [descripción funcional, en lenguaje de negocio].

**Contexto:** El criterio de aceptación "[cita textual de la tarea]" requiere estos datos.

**Entradas disponibles en ese punto del flujo:**
- `id_agente` (del contexto autenticado)
- `temporalidad`: 'proximas' | 'en_curso' | 'pasadas' | 'todas'
- [etc.]

**Campos que el endpoint debe devolver, según API_CONTRACT.md:**
- `id_booking`, `nombre_viajero`, `check_in`, ...

**Estado:** ⛔ Tarea detenida hasta recibir la query.
```

Ángel responde con la query en el formato de §2 — **SQL, parámetros, forma de la fila y las 2–3
filas de ejemplo anonimizadas** —, se agrega al catálogo con estado ✅, y la tarea se reanuda.

Una query sin filas de ejemplo se queda en 🔄 En revisión, no pasa a ✅.

---

## 4. Responsabilidades

| Responsabilidad | Quién |
| :--- | :--- |
| Diseñar y optimizar el SQL | **Ángel** |
| Conocer el esquema, índices y relaciones | **Ángel** |
| Decidir qué columnas se exponen | **Ángel** (vía este catálogo) + `API_CONTRACT.md` |
| Entregar 2–3 filas de ejemplo anonimizadas por query | **Ángel** (§2) |
| Ejecutar la query con parámetros seguros | Agente (repositorio) |
| Mapear filas → DTO tipado | Agente (service) |
| Validar input del cliente | Agente (Zod, en el controller) |
| Inyectar `id_agente` desde el contexto | Agente (middleware) |

---

## 5. Invariantes que el Agente Sí Debe Verificar

Aunque no escriba el SQL, el agente **sí es responsable** de estas tres cosas en el repositorio:

1. **Parámetros siempre posicionales (`?`).** Jamás interpolar strings en el SQL. Ni siquiera
   valores "seguros" como `LIMIT`, que deben pasarse validados como números.
2. **El `id_agente` que se pasa a la query viene de `req.context`**, nunca del body, query string
   o params de la petición.
3. **La query se usa tal como fue entregada.** Si el agente cree que necesita modificarla
   (agregar un filtro, cambiar un JOIN, alterar el `ORDER BY`), eso es una **nueva Solicitud de
   Query**, no una edición.
