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
| `Q-AGE-01` | Core / Auth | Verificar existencia del agente autenticado | ✅ Aprobada |
| `Q-CUP-01` | Cupones | Resolver cupón por identificador unificado | ✅ Aprobada |
| `Q-CUP-02` | Cupones | Detalle de cupón de hotel | ✅ Aprobada |
| `Q-CUP-03` | Cupones | Detalle de cupón de vuelo (cabecera y tramos) | ✅ Aprobada |
| `Q-CUP-04` | Cupones | Detalle de cupón de auto | ✅ Aprobada |
| `Q-VIA-01` | Viajeros | Directorio de viajeros por agente | ✅ Aprobada |
| `Q-FIN-01` | Finanzas | Saldo a favor (wallet) | ✅ Aprobada |
| `Q-FIN-02` | Finanzas | Estado de línea de crédito | ✅ Aprobada |

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

### `Q-AGE-01` — Verificar existencia de agente autenticado

**Módulo:** `core` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-02

**SQL:**
```sql
SELECT id_agente FROM agentes WHERE id_agente = ?;
```

**Parámetros:**
1. `id_agente` (string UUID)

---

### `Q-CUP-01` — Resolver cupón por identificador unificado

**Módulo:** `cupones` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-02

**Propósito:** Resuelve el tipo de servicio e identificadores de relación a partir de `id_solicitud_client`, `id_booking` o `id_relacion`.

**SQL:**
```sql
SELECT type, id_relacion, id_booking, id_solicitud_client
FROM vw_details_booking
WHERE (id_solicitud_client = ? OR id_booking = ? OR id_relacion = ?)
  AND estado <> 'Cancelada'
LIMIT 1;
```

> **📌 Tarea pendiente confirmada por Ángel:** En esta etapa se valida la existencia del agente (`Q-AGE-01`). La vinculación estricta de pertenencia del cupón por `id_agente` en las vistas/tablas de cupones se integrará en una fase posterior.

---

### `Q-CUP-02` — Detalle de cupón de hotel

**Módulo:** `cupones` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-02

**SQL:**
```sql
SELECT
    COALESCE(vdb.check_in, s.check_in) AS check_in,
    COALESCE(vdb.check_out, s.check_out) AS check_out,
    COALESCE(vdb.id_confirmacion, "") AS codigo_confirmacion,
    COALESCE(hp.comments, "") AS comentarios,
    COALESCE(vdb.id_proveedor_service, s.id_hotel) AS id_hotel_resuelto,
    ho.direccion AS direccion,
    COALESCE(acomp.acompanantes, s.viajeros_adicionales, "") AS acompanantes,
    v.primer_nombre,
    v.segundo_nombre,
    v.apellido_paterno,
    v.apellido_materno,
    COALESCE(vdb.id_solicitud_client, s.id_solicitud) AS id_solicitud,
    COALESCE(vdb.id_booking, s.id_solicitud) AS id_booking,
    COALESCE(vdb.tipo_cuarto_vuelo, s.room) AS room,
    ho.nombre AS hotel,
    COALESCE(hp.nuevo_incluye_desayuno, hp.is_con_desayuno, s.is_con_desayuno) AS incluye_desayuno,
    COALESCE(vdb.costo_total, s.total) AS total_solicitud,
    COALESCE(vdb.created_at, s.created_at) AS created_at_solicitud,
    'hotel' AS type
FROM solicitudes s
LEFT JOIN vw_details_booking vdb
    ON vdb.id_solicitud_client = s.id_solicitud
LEFT JOIN hospedajes hp
    ON hp.id_hospedaje = vdb.id_relacion
LEFT JOIN (
    SELECT
        vh.id_hospedaje,
        GROUP_CONCAT(
            DISTINCT TRIM(
                CONCAT_WS(
                    ' ',
                    v.primer_nombre,
                    v.segundo_nombre,
                    v.apellido_paterno,
                    v.apellido_materno
                )
            )
            SEPARATOR ', '
        ) AS acompanantes
    FROM viajeros_hospedajes vh
    INNER JOIN viajeros v
        ON v.id_viajero = vh.id_viajero
    WHERE vh.is_principal = 0
    GROUP BY vh.id_hospedaje
) acomp
    ON acomp.id_hospedaje = hp.id_hospedaje
LEFT JOIN hoteles ho
    ON ho.id_hotel = COALESCE(vdb.id_proveedor_service, s.id_hotel)
LEFT JOIN viajeros v
    ON v.id_viajero = COALESCE(vdb.id_viajero, s.id_viajero)
WHERE (
    vdb.estado <> 'cancelada'
    OR s.status <> 'canceled'
)
AND (s.id_solicitud = ? OR vdb.id_booking = ? OR vdb.id_relacion = ?)
GROUP BY s.id_solicitud
LIMIT 1;
```

---

### `Q-CUP-03` — Detalle de cupón de vuelo (cabecera y tramos)

**Módulo:** `cupones` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-02

**SQL Cabecera:**
```sql
SELECT b.total, v.primer_nombre, v.segundo_nombre, v.apellido_paterno, v.apellido_materno, 
       va.id_viaje_aereo, va.ciudad_origen as origen, va.ciudad_destino as destino, 
       va.trip_type as tipo, va.codigo_confirmacion 
FROM viajes_aereos va
LEFT JOIN viajeros v ON va.id_viajero = v.id_viajero
LEFT JOIN bookings b ON b.id_booking = va.id_booking
WHERE va.id_viaje_aereo = ?
LIMIT 1;
```

**SQL Tramos:**
```sql
SELECT eq_mano, eq_personal, eq_documentado, id_vuelo, flight_number, airline, 
       departure_airport, departure_city, departure_date, departure_time, 
       arrival_airport, arrival_city, arrival_date, arrival_time, 
       stop_count as parada, seat_number, fly_type, comentarios, rate_type 
FROM vuelos 
WHERE id_viaje_aereo = ?;
```

---

### `Q-VIA-01` — Directorio de viajeros por agente

**Módulo:** `viajeros` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-03

**Propósito:** Directorio de viajeros asociados a la agencia autenticada, con búsqueda opcional por nombre, correo o número de empleado.

**SQL:**
```sql
SELECT
    av.id_agente,
    av.id_viajero,
    v.primer_nombre,
    v.segundo_nombre,
    v.apellido_paterno,
    v.apellido_materno,
    v.correo,
    v.telefono,
    v.numero_empleado
FROM agentes_viajeros av
LEFT JOIN viajeros v ON v.id_viajero = av.id_viajero
WHERE
    v.activo = 1
    AND av.id_agente = ?
    AND (
        ? IS NULL
        OR REPLACE(TRIM(CONCAT_WS(' ', TRIM(v.primer_nombre), TRIM(v.segundo_nombre), TRIM(v.apellido_paterno), TRIM(v.apellido_materno))), '  ', ' ') LIKE CONCAT('%', ?, '%')
        OR v.correo LIKE CONCAT('%', ?, '%')
        OR v.numero_empleado LIKE CONCAT('%', ?, '%')
    )
LIMIT 20;
```

> **Revisión 2026-09-03 (decisión de Ángel):** se agregó `LIMIT 20` — sin esto, un agente con
> miles de viajeros registrados devolvía el directorio completo en una sola respuesta. Es un tope
> fijo, no paginación: no hay `OFFSET` ni conteo total. Si el cliente necesita resultados más
> específicos, usa `busqueda` para acotar. No confundir con `Q-RES-01`/`Q-RES-02`, que sí pagina.

**Parámetros (en orden posicional):**

| # | Nombre | Tipo | Obligatorio | Notas |
| :-- | :--- | :--- | :---: | :--- |
| 1 | `id_agente` | `string` (UUID) | ✅ | Siempre desde `req.context`, nunca del input del cliente. |
| 2 | `busqueda` | `string \| null` | | `null` omite el filtro por completo. |
| 3 | `busqueda` | `string \| null` | | Mismo valor que #2; compara contra nombre completo normalizado. |
| 4 | `busqueda` | `string \| null` | | Mismo valor que #2; compara contra `correo`. |
| 5 | `busqueda` | `string \| null` | | Mismo valor que #2; compara contra `numero_empleado`. |

**Forma de la fila devuelta** (el agente mapea **solo** los campos del contrato — `id_agente` se ignora, no forma parte del DTO):

```ts
{
  id_agente: string;
  id_viajero: string;
  primer_nombre: string | null;
  segundo_nombre: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  correo: string | null;
  telefono: string | null;
  numero_empleado: string | null;
}
```

> **Corrección 2026-09-03 (verificado en pruebas contra la BD real):** las 4 partes del nombre
> pueden venir en `NULL`, no solo `''`. El mapeo a `nombre_completo` debe tolerar `NULL` en
> cualquiera de las 4, igual que ya tolera `NULL` en `correo`/`telefono`/`numero_empleado`.

**Filas de ejemplo — anonimizadas:**

```json
[
  { "id_agente": "age-10000000-0000-4000-8000-000000000001", "id_viajero": "via-10000000-0000-4000-8000-000000000001", "primer_nombre": "EDUARDO", "segundo_nombre": "", "apellido_paterno": "MENDOZA", "apellido_materno": "", "correo": null, "telefono": null, "numero_empleado": null },
  { "id_agente": "age-10000000-0000-4000-8000-000000000001", "id_viajero": "via-10000000-0000-4000-8000-000000000002", "primer_nombre": "SOFÍA", "segundo_nombre": "ELENA", "apellido_paterno": "TORRES", "apellido_materno": "IBARRA", "correo": null, "telefono": null, "numero_empleado": null },
  { "id_agente": "age-10000000-0000-4000-8000-000000000001", "id_viajero": "via-10000000-0000-4000-8000-000000000003", "primer_nombre": "MATEO", "segundo_nombre": "ISAAC", "apellido_paterno": "VARGAS", "apellido_materno": "PRIETO", "correo": "mateo.vargas@ejemplo.com", "telefono": "5512345678", "numero_empleado": "234" },
  { "id_agente": "age-10000000-0000-4000-8000-000000000001", "id_viajero": "via-10000000-0000-4000-8000-000000000004", "primer_nombre": "RENATA", "segundo_nombre": "ISABEL", "apellido_paterno": "OCHOA", "apellido_materno": "DELGADO", "correo": "RENATA.OCHOA@EJEMPLO.MX", "telefono": null, "numero_empleado": null },
  { "id_agente": "age-10000000-0000-4000-8000-000000000001", "id_viajero": "via-10000000-0000-4000-8000-000000000005", "primer_nombre": "GERARDO", "segundo_nombre": "", "apellido_paterno": "SALAZAR", "apellido_materno": "SALAZAR", "correo": "gerardo.salazar@ejemplo.mx", "telefono": "6141234567", "numero_empleado": null }
]
```

**Reglas de negocio que la query ya aplica:**
- Filtra por agencia autenticada (`av.id_agente = ?`) y solo viajeros activos (`v.activo = 1`).
- `LEFT JOIN` + `v.activo = 1` en el `WHERE` descarta implícitamente cualquier `av.id_viajero` huérfano sin fila en `viajeros` (se comporta como `INNER JOIN`).
- La búsqueda es un único término que compara contra nombre completo normalizado, correo y número de empleado (coincidencia parcial, `OR`).

**Notas / advertencias:**
- `correo`, `telefono` y `numero_empleado` pueden ser `NULL` — confirmado por Ángel. El mapeo al DTO debe tolerarlo.
- La query **no** devuelve `nombre_completo` armado — el service debe construirlo concatenando `primer_nombre`, `segundo_nombre`, `apellido_paterno`, `apellido_materno`, recortando extremos y colapsando espacios repetidos cuando alguna parte venga vacía (mismo patrón de normalización ya usado en `Q-RES-01` para `nombre_viajero`).
- `id_agente` viene en el `SELECT` solo por trazabilidad; no es parte del DTO de salida y no debe mapearse.

---

### `Q-FIN-01` — Desglose de wallet / saldo a favor

**Módulo:** `finanzas` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-03

**Propósito:** Saldo a favor disponible del agente autenticado (suma de saldos vigentes, no cancelados, que no son crédito).

**SQL:**
```sql
SELECT COALESCE(SUM(saldo), 0) AS total_saldo_favor
FROM saldos_a_favor
WHERE id_agente = ?
  AND is_wallet_credito <> 1
  AND is_cancelado = 0
  AND activo = 1;
```

> **Corrección 2026-09-03 (bug real, detectado en pruebas contra la BD):** la versión anterior
> dejaba `id_agente` suelto en el `SELECT` junto al `SUM()` sin `GROUP BY`. Bajo
> `sql_mode=only_full_group_by` eso truena (`ER_MIX_OF_GROUP_FUNC_AND_FIELDS`). Se quitó `id_agente`
> del `SELECT` — no se usaba en el DTO de salida de todos modos.

**Parámetros:**
1. `id_agente` (`string` UUID) — siempre desde `req.context`.

**Forma de la fila devuelta** (siempre exactamente una fila):

```ts
{
  total_saldo_favor: number;
}
```

**Filas de ejemplo — anonimizadas:**

```json
[
  { "total_saldo_favor": 4541.40, "id_agente": "age-20000000-0000-4000-8000-000000000001" },
  { "total_saldo_favor": 336.40, "id_agente": "age-20000000-0000-4000-8000-000000000002" },
  { "total_saldo_favor": 0.00, "id_agente": "age-20000000-0000-4000-8000-000000000003" }
]
```

**Reglas de negocio que la query ya aplica:**
- Solo suma saldos activos, no cancelados y que no son de tipo crédito (`is_wallet_credito <> 1`).
- Sin `GROUP BY`: el `SUM()` + `COALESCE` garantizan **siempre una sola fila**, con `0` cuando el agente no tiene saldos — el service no necesita manejar el caso de "cero filas".

**Notas / advertencias:**
- Mapea a `wallet.saldo_a_favor_disponible` en el contrato (`API_CONTRACT.md §2.4`, simplificado el 2026-09-03: ya no incluye `desglose` por método de pago, esa columna no existe en la fuente).

---

### `Q-FIN-02` — Estado de línea de crédito

**Módulo:** `finanzas` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-03

**Propósito:** Crédito disponible y límite de línea de crédito corporativo del agente autenticado.

**SQL:**
```sql
SELECT saldo AS total_saldo_credito, id_agente, linea_credito
FROM agentes
WHERE id_agente = ?;
```

**Parámetros:**
1. `id_agente` (`string` UUID) — siempre desde `req.context`.

**Forma de la fila devuelta:**

```ts
{
  total_saldo_credito: number;
  id_agente: string;
  linea_credito: number | null;
}
```

**Filas de ejemplo — anonimizadas:**

```json
[
  { "total_saldo_credito": 46759.60, "id_agente": "age-20000000-0000-4000-8000-000000000001", "linea_credito": 134560.00 },
  { "total_saldo_credito": 0.00, "id_agente": "age-20000000-0000-4000-8000-000000000002", "linea_credito": 50000.00 },
  { "total_saldo_credito": 0.00, "id_agente": "age-20000000-0000-4000-8000-000000000003", "linea_credito": null },
  { "total_saldo_credito": 164117.20, "id_agente": "age-20000000-0000-4000-8000-000000000004", "linea_credito": null }
]
```

**Reglas de negocio que la query ya aplica:**
- Ninguna transformación: `saldo` **es** el crédito disponible (confirmado por Ángel), tal cual.

**Notas / advertencias:**
- `linea_credito` puede ser `NULL` cuando el agente no tiene línea de crédito configurada — el DTO de salida (`limite_credito`) debe tolerarlo (`number | null`), no forzar `0`.
- La cuarta fila de ejemplo es un caso real donde `total_saldo_credito` es positivo con `linea_credito` en `NULL` — dato inconsistente de origen, pero el service **no lo corrige ni lo descarta**: se mapea tal cual, igual que cualquier otra fila.
- `tiene_credito` y `credito_utilizado` quedaron **suspendidos** del contrato (decisión de Ángel, 2026-09-03): no hay bandera de "crédito activo" en `agentes`. Si se necesitan más adelante, requieren una nueva *Solicitud de Query*, no se derivan aquí.
- Contrato de salida esperado: `{ "credito": { "limite_credito": linea_credito, "credito_disponible": total_saldo_credito } }`.

---

### `Q-CUP-04` — Detalle de cupón de auto

**Módulo:** `cupones` · **Estado:** ✅ Aprobada · **Entregada:** 2026-09-02

**SQL:**
```sql
SELECT v.primer_nombre, v.segundo_nombre, v.apellido_paterno, v.apellido_materno, 
       ra.nombre_proveedor, ra.codigo_renta_carro as codigo_confirmation, 
       ra.id_conductor_principal, ra.conductor_principal, ra.conductores_adicionales, 
       ra.descripcion_auto as tipo_auto, ra.transmission, ra.lugar_recoger_auto,
       ra.hora_recoger_auto, ra.id_sucursal_recoger_auto, ra.hora_dejar_auto, 
       ra.lugar_dejar_auto, ra.id_sucursal_dejar_auto, ra.dias, ra.seguro_incluido, 
       ra.additional_driver, b.check_in, b.check_out,
       sr.nombre as nombre_sucursal_recoger, 
       CONCAT(sr.direccion, " ", sr.codigo_postal, ", ", sr.ciudad, ", ", sr.pais) as direccion_recoger,
       sd.nombre as nombre_sucursal_dejar, 
       CONCAT(sd.direccion, " ", sd.codigo_postal, ", ", sd.ciudad, ", ", sd.pais) as direccion_dejar
FROM renta_autos ra 
LEFT JOIN viajeros v ON v.id_viajero = ra.id_conductor_principal
LEFT JOIN sucursales sr ON ra.id_sucursal_recoger_auto = sr.id_sucursal
LEFT JOIN sucursales sd ON ra.id_sucursal_dejar_auto = sd.id_sucursal
LEFT JOIN bookings b ON b.id_booking = ra.id_booking 
WHERE ra.id_renta_autos = ?
LIMIT 1;
```

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
