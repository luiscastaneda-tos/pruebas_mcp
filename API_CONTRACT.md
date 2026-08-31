# 📋 Contrato de API: MIA Backend Gateway

**Versión:** 1.0.0  
**Formato:** REST / JSON  
**Consumidores:** Cualquier cliente autenticado (servidores MCP, agentes de IA, frontends, integraciones).  
**Seguridad:** Header `x-api-key` y contexto de `id_agente`.

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

---

## 2. Catálogo de Endpoints

### 2.1. Reservas

#### `POST /api/v1/reservas/filtrar` (o `GET /api/v1/reservas`)
- **Propósito:** Consulta paginada y filtrada de reservas de hotel, vuelos y autos del cliente autenticado.
- **Parámetros:**
  - `temporalidad` (*string*, **requerido**): `'proximas'` (check-in $\ge$ HOY), `'pasadas'` (check-out $<$ HOY) o `'todas'`.
  - `id_viajero` (*number*, opcional): ID de viajero para ver solo sus reservaciones.
  - `nombre_viajero` (*string*, opcional): Búsqueda parcial por nombre.
  - `tipo_servicio` (*string*, opcional): `'hotel'` | `'vuelo'` | `'renta_carros'` | `'todos'`.
  - `codigo_confirmacion` (*string*, opcional): Búsqueda exacta por código.
  - `startDate` / `endDate` (*YYYY-MM-DD*, opcional): Rango de fechas.
  - `page` (*number*, default `1`): Página.
  - `length` (*number*, default `10`, máx `20`): Registros por página.
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id_booking": 1245,
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

### 2.2. Cupones (Basado en `v2/cupon`)

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

#### `GET /api/v1/cupones/vuelo/:id_viaje_aereo`
- **Propósito:** Retorna el itinerario aéreo detallado (tramos ida/vuelta, aerolíneas, claves IATA, horarios y equipaje).

#### `GET /api/v1/cupones/auto/:id_renta_autos`
- **Propósito:** Retorna el cupón de renta de auto (arrendadora, modelo, conductor y sucursales de entrega/devolución).

---

### 2.3. Viajeros

#### `GET /api/v1/viajeros`
- **Propósito:** Directorio optimizado de colaboradores y pasajeros registrados de la agencia autenticada.
- **Parámetros (Query):**
  - `busqueda` (*string*, opcional): Filtro por nombre, apellido o correo.
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      {
        "id_viajero": 105,
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
- **Propósito:** Consulta instantánea de estado de cuenta: wallet (saldos a favor disponibles) y estado de línea de crédito corporativo.
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "wallet": {
        "saldo_a_favor_disponible": 24500.00,
        "desglose": [
          { "metodo": "Transferencia", "saldo": 20000.00 },
          { "metodo": "Tarjeta", "saldo": 4500.00 }
        ]
      },
      "credito": {
        "tiene_credito": true,
        "limite_credito": 100000.00,
        "credito_disponible": 68000.00,
        "credito_utilizado": 32000.00
      }
    }
  }
  ```
