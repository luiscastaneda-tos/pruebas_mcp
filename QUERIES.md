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

| ID | Módulo | Propósito | Estado |
| :--- | :--- | :--- | :---: |
| `Q-RES-01` | Reservas | Listado filtrado de reservas por agente | ⏳ Pendiente |
| `Q-RES-02` | Reservas | Conteo total para paginación | ⏳ Pendiente |
| `Q-CUP-01` | Cupones | Resolver cupón por identificador unificado | ⏳ Pendiente |
| `Q-CUP-02` | Cupones | Detalle de cupón de hotel | ⏳ Pendiente |
| `Q-CUP-03` | Cupones | Detalle de cupón de vuelo (tramos) | ⏳ Pendiente |
| `Q-CUP-04` | Cupones | Detalle de cupón de auto | ⏳ Pendiente |
| `Q-VIA-01` | Viajeros | Directorio de viajeros por agente | ⏳ Pendiente |
| `Q-FIN-01` | Finanzas | Desglose de wallet / saldos a favor | ⏳ Pendiente |
| `Q-FIN-02` | Finanzas | Estado de línea de crédito | ⏳ Pendiente |

**Leyenda:** ⏳ Pendiente de Ángel · ✅ Aprobada · 🔄 En revisión

Ninguna tarea que dependa de una query ⏳ puede iniciarse.

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
- `temporalidad`: 'proximas' | 'pasadas' | 'todas'
- [etc.]

**Campos que el endpoint debe devolver, según API_CONTRACT.md:**
- `id_booking`, `nombre_viajero`, `check_in`, ...

**Estado:** ⛔ Tarea detenida hasta recibir la query.
```

Ángel responde con la query en el formato de §2, se agrega al catálogo con estado ✅,
y la tarea se reanuda.

---

## 4. Responsabilidades

| Responsabilidad | Quién |
| :--- | :--- |
| Diseñar y optimizar el SQL | **Ángel** |
| Conocer el esquema, índices y relaciones | **Ángel** |
| Decidir qué columnas se exponen | **Ángel** (vía este catálogo) + `API_CONTRACT.md` |
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
