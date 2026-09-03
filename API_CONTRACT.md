# 📋 Contrato de API: MIA Backend Gateway

**Versión:** 1.1.0  
**Formato:** REST / JSON  
**Consumidores:** Cualquier cliente autenticado (servidores MCP, agentes de IA, frontends, integraciones).  
**Seguridad:** Header `x-api-key` y contexto de `id_agente`.

---

> 📐 **Los ejemplos de este documento son normativos.** No ilustran: definen. Los *valores* son
> inventados, pero la **forma** (nombres de campo, anidamiento, tipos, nulabilidad) es el contrato
> que QA usa para escribir los tests y Backend para implementar. Si una query aprobada no puede
> entregar un campo que aparece aquí, eso es una *Solicitud de Query* ([QUERIES §3](./QUERIES.md)) —
> no se inventa el campo en el service, ni se cambia el contrato en silencio para que encaje.

---

## 1. Convenciones Globales

### Headers de Autenticación y Contexto
```http
x-api-key: <API_KEY>
x-id-agente: <ID_AGENTE>
Content-Type: application/json
```

> ⚠️ `id_agente` es un **UUID en formato string** (ej. `ce57342e-03e9-440f-b12f-16497f23b8bb`), no un entero.
> Todo el filtrado multi-tenant se hace con este valor tomado del header — **nunca del body ni del query string**.

### Formato de Respuesta Estándar
```json
{
  "success": true,
  "message": "Mensaje descriptivo",
  "data": [ ... ],
  "metadata": {
    "total": 12,
    "page": 1,
    "length": 10
  }
}
```

`metadata` solo aparece en endpoints paginados. En los demás se omite por completo (no se envía en `null`).

### Formato de Respuesta de Error

**Toda** respuesta no exitosa usa esta forma, sin excepción:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo 'temporalidad' es requerido."
  }
}
```

En errores de validación (`400`) se agrega `details` con un elemento por campo inválido:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La petición contiene campos inválidos.",
    "details": [
      { "field": "temporalidad", "issue": "Requerido" },
      { "field": "length", "issue": "Debe ser menor o igual a 20" }
    ]
  }
}
```

En cualquier otro código, `details` se omite.

| Status | `error.code` | Cuándo |
| :---: | :--- | :--- |
| `400` | `VALIDATION_ERROR` | El body o el query string no cumple el schema (campo requerido ausente, tipo incorrecto, valor fuera de rango). |
| `400` | `MISSING_CONTEXT` | Falta el header `x-id-agente`, o su valor no es un UUID válido. La petición no llega al repositorio. |
| `401` | `UNAUTHORIZED` | Falta el header `x-api-key`, o su valor no coincide. |
| `404` | `NOT_FOUND` | El recurso solicitado no existe, o no pertenece al `id_agente` autenticado. |
| `500` | `INTERNAL_ERROR` | Fallo no controlado. El `message` es genérico; el detalle va al log, nunca a la respuesta. |

> ⚠️ `404` no distingue entre "no existe" y "existe pero es de otra agencia". Esa ambigüedad es
> deliberada: responder `403` en el segundo caso confirmaría al cliente que el recurso existe.

---

## 2. Catálogo de Endpoints

### 2.1. Reservas

#### `POST /api/v1/reservas/filtrar`

> Endpoint **único** para consultar reservas. No existe una variante `GET`: los filtros son ocho y
> varios son tipados (números, enums, fechas), lo que en query string obligaría a coerción manual
> en cada uno. Un solo endpoint, un solo schema, un solo set de tests.

- **Propósito:** Consulta paginada y filtrada de reservas de hotel, vuelos y autos del cliente autenticado.
- **Parámetros (body JSON):**
  - `temporalidad` (*string*, **requerido**):
    - `'proximas'`: `check_in > HOY`.
    - `'en_curso'`: `check_in <= HOY` y `check_out >= HOY`.
    - `'pasadas'`: `check_out < HOY`.
    - `'todas'`: sin filtro de temporalidad.
    - `HOY` se evalúa en la zona horaria `America/Mexico_City`; las categorías no se solapan.
  - `id_viajero` (*string*, opcional; ej. `via-10000000-0000-4000-8000-000000000001`): ID de viajero para ver solo sus reservaciones.
  - `tipo_servicio` (*string*, opcional): `'hotel'` | `'vuelo'` | `'renta_carros'` | `'todos'`.
  - `codigo_confirmacion` (*string*, opcional): Búsqueda parcial sin distinguir mayúsculas.
  - `startDate` / `endDate` (*YYYY-MM-DD*, opcionales como par): seleccionan reservas cuyo `check_in`
    está dentro del rango inclusivo. Si se envía una, la otra también es requerida, y
    `startDate <= endDate`.
  - `page` (*number*, default `1`): Página.
  - `length` (*number*, default `10`, máx `20`): Registros por página.
- **Orden:** próximas por `check_in` ascendente; en curso por `check_out` descendente; pasadas por
  `check_out` descendente; todas por `created_at` descendente.
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id_booking": "boo-10000000-0000-4000-8000-000000000001",
        "id_relacion": "REL-992",
        "id_solicitud_client": "sol-e1b9b32e-1372-44b9-a14c-932b4d940cfc",
        "type": "hotel",
        "codigo_confirmacion": "CONF-HOTEL-88",
        "proveedor": "Grand Fiesta Americana Guadalajara",
        "nombre_viajero": "Carlos Ruiz Gómez",
        "check_in": "2026-09-10",
        "check_out": "2026-09-14",
        "estado": "Confirmada",
        "total": 6800.00,
        "metodo_pago": "credito"
      }
    ],
    "metadata": { "total": 1, "page": 1, "length": 10 }
  }
  ```

---

### 2.2. Cupones

> ✅ **Confirmado contra datos reales el 2026-09-03.** Las formas de los tres cupones específicos
> (hotel, vuelo, auto) se verificaron en vivo contra MySQL real: hotel con 3 casos distintos, vuelo
> y auto con 1 caso cada uno, todos para el mismo agente. La estructura documentada abajo coincide
> con lo que devuelven `Q-CUP-02`, `Q-CUP-03` y `Q-CUP-04`. Detalle de la verificación en
> `HANDOFF.md §3`.

#### `GET /api/v1/cupones/:id`
- **Propósito:** Resuelve y retorna el cupón unificado para cualquier identificador (`id_solicitud` tipo `sol-...`, `id_booking` o `id_relacion`).
- **Parámetros (Path):**
  - `:id` (*string*): Identificador único (ej. `sol-e1b9b32e-1372-44b9-a14c-932b4d940cfc`).
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id_solicitud": "sol-e1b9b32e-...",
      "tipo_servicio": "hotel",
      "codigo_confirmacion": "CONF-8821",
      "detalles": {
        "hotel": "Hotel Fiesta Americana",
        "check_in": "2026-09-10",
        "check_out": "2026-09-14",
        "habitacion": "Sencilla Deluxe",
        "titular": "Carlos Ruiz Gómez"
      }
    }
  }
  ```

#### `GET /api/v1/cupones/hotel/:id_booking`
- **Propósito:** Retorna la ficha estructurada de cupón de hotel (estancia, hotel, dirección, fechas y notas).
- **Parámetros (Path):** `:id_booking` (*string*; formato `boo-...`).
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id_booking": "boo-10000000-0000-4000-8000-000000000001",
      "codigo_confirmacion": "CONF-HOTEL-88",
      "titular": "Carlos Ruiz Gómez",
      "hotel": {
        "nombre": "Grand Fiesta Americana Guadalajara",
        "direccion": "Av. Aurelio Ortega 764, Zapopan, Jalisco",
        "telefono": "+52 33 3648 3200"
      },
      "estancia": {
        "check_in": "2026-09-10",
        "check_out": "2026-09-14",
        "noches": 4,
        "habitacion": "Sencilla Deluxe",
        "desayuno_incluido": true
      },
      "notas": "Check-in a partir de las 15:00."
    }
  }
  ```

#### `GET /api/v1/cupones/vuelo/:id_viaje_aereo`
- **Propósito:** Retorna el itinerario aéreo detallado (tramos ida/vuelta, aerolíneas, claves IATA, horarios y equipaje).
- **Parámetros (Path):** `:id_viaje_aereo` (*string*).
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id_viaje_aereo": "VA-3391",
      "codigo_confirmacion": "PNR-4XK2LM",
      "pasajero": "Carlos Ruiz Gómez",
      "tramos": [
        {
          "sentido": "ida",
          "aerolinea": "Aeroméxico",
          "numero_vuelo": "AM 165",
          "origen": { "iata": "GDL", "ciudad": "Guadalajara" },
          "destino": { "iata": "MEX", "ciudad": "Ciudad de México" },
          "salida": "2026-09-10T07:40:00",
          "llegada": "2026-09-10T09:05:00"
        },
        {
          "sentido": "vuelta",
          "aerolinea": "Aeroméxico",
          "numero_vuelo": "AM 172",
          "origen": { "iata": "MEX", "ciudad": "Ciudad de México" },
          "destino": { "iata": "GDL", "ciudad": "Guadalajara" },
          "salida": "2026-09-14T19:20:00",
          "llegada": "2026-09-14T20:45:00"
        }
      ],
      "equipaje": {
        "personal": "1 artículo personal",
        "mano": "1 pieza de 10 kg",
        "documentado": "1 pieza de 25 kg"
      }
    }
  }
  ```

> `tramos` es siempre un array. Un vuelo sencillo devuelve un solo elemento con `sentido: "ida"`;
> el cliente no debe asumir que hay exactamente dos.

#### `GET /api/v1/cupones/auto/:id_renta_autos`
- **Propósito:** Retorna el cupón de renta de auto (arrendadora, modelo, conductor y sucursales de entrega/devolución).
- **Parámetros (Path):** `:id_renta_autos` (*string*).
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "id_renta_autos": "RA-8812",
      "codigo_confirmacion": "CONF-AUTO-31",
      "arrendadora": "Hertz",
      "conductor": "Carlos Ruiz Gómez",
      "vehiculo": {
        "categoria": "Compacto",
        "modelo": "Nissan Versa o similar",
        "transmision": "Automática"
      },
      "entrega": {
        "sucursal": "Aeropuerto Internacional de Guadalajara",
        "fecha_hora": "2026-09-10T10:00:00"
      },
      "devolucion": {
        "sucursal": "Aeropuerto Internacional de Guadalajara",
        "fecha_hora": "2026-09-14T18:00:00"
      }
    }
  }
  ```

---

### 2.3. Viajeros

#### `GET /api/v1/viajeros`
- **Propósito:** Directorio optimizado de colaboradores y pasajeros registrados de la agencia autenticada.
- **Parámetros (Query):**
  - `busqueda` (*string*, opcional): Filtro por nombre, apellido, correo o número de empleado.
- **Límite:** la respuesta trae como máximo **20** resultados (tope fijo, no paginado — sin `OFFSET`
  ni conteo total). Si hay más de 20 coincidencias, usa `busqueda` para acotar.
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id_viajero": "via-10000000-0000-4000-8000-000000000001",
        "nombre_completo": "Carlos Ruiz Gómez",
        "correo": "carlos.ruiz@empresa.com",
        "numero_empleado": "EMP-042",
        "telefono": "+52 55 1234 5678"
      }
    ]
  }
  ```

---

### 2.4. Finanzas

#### `GET /api/v1/finanzas/saldo-credito`
- **Propósito:** Consulta instantánea de estado de cuenta: wallet (saldo a favor disponible) y línea de crédito corporativo.
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "wallet": {
        "saldo_a_favor_disponible": 24500.00
      },
      "credito": {
        "limite_credito": 100000.00,
        "credito_disponible": 68000.00
      }
    }
  }
  ```
  > **Simplificado el 2026-09-03 (decisión de Ángel):** se quitó `desglose` de wallet (no hay
  > columna de método de pago disponible en la query aprobada) y `tiene_credito` /
  > `credito_utilizado` de crédito (no hay bandera de "crédito activo" en la tabla `agentes`;
  > queda suspendido hasta que se maneje esa información). Ver `Q-FIN-01` y `Q-FIN-02` en
  > `QUERIES.md`.
