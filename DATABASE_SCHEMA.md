# 🗄️ Esquema de Base de Datos y Vistas SQL

Este documento contiene la definición de las vistas y tablas principales de MySQL consumidas por este backend especializado.

---

## 1. Vista Maestra de Reservas: `vw_new_details_booking`

Vista central utilizada para el módulo de `/reservas` y `/cupones`.

### Definición DDL:
```sql
CREATE 
    ALGORITHM = UNDEFINED 
    DEFINER = `admin`@`%` 
    SQL SECURITY DEFINER
VIEW `vw_new_details_booking` AS
    SELECT 
        `b`.`id_relacion` AS `id_relacion`,
        `v`.`id_viajero` AS `id_viajero`,
        `b`.`id_solicitud` AS `id_solicitud_client`,
        `b`.`created_at` AS `created_at`,
        `b`.`total` AS `total`,
        `b`.`check_in` AS `check_in`,
        `b`.`estado` AS `estado`,
        `b`.`tipo_cuarto_vuelo` AS `tipo_cuarto_vuelo`,
        `b`.`check_out` AS `check_out`,
        `b`.`costo_total` AS `costo_total`,
        `b`.`tipo_pago` AS `metodo_pago`,
        `s`.`id_agente` AS `id_agente`,
        `ag`.`nombre` AS `nombre_agente`,
        TRIM(CONCAT_WS(' ',
                    NULLIF(`v`.`primer_nombre`, ''),
                    NULLIF(`v`.`segundo_nombre`, ''),
                    NULLIF(`v`.`apellido_paterno`, ''),
                    NULLIF(`v`.`apellido_materno`, ''))) AS `nombre_viajero`,
        `b`.`id_booking` AS `id_booking`,
        `b`.`envio_autorizacion` AS `prefacturado`,
        `b`.`codigo_confirmacion` AS `codigo_confirmacion`,
        `b`.`is_comisionable` AS `is_comisionable`,
        `b`.`monto_comisionable` AS `monto_comisionable`,
        `b`.`porcentaje_comisionable` AS `porcentaje_comisionable`,
        `b`.`comentarios_comisionables` AS `comentarios_comisionables`,
        `b`.`comision_cobrada` AS `comision_cobrada`,
        `pro`.`proveedor` AS `proveedor`,
        `pro`.`id` AS `id_proveedor`,
        `pro`.`id_relacion` AS `id_proveedor_service`,
        `pro`.`negociacion` AS `negociacion_proveedor`,
        `b`.`tipo_servicio` AS `type`,
        `b`.`id_intermediario` AS `id_intermediario`,
        `b`.`usuario_creador` AS `usuario_creador_reserva`,
        `s`.`id_user_creador` AS `usuario_creador_asignado`
    FROM
        ((((`bookings` `b`
        LEFT JOIN `servicios` `s` ON ((`b`.`id_servicio` = `s`.`id_servicio`)))
        LEFT JOIN `agentes` `ag` ON ((`ag`.`id_agente` = `s`.`id_agente`)))
        LEFT JOIN `viajeros` `v` ON ((`v`.`id_viajero` = `b`.`id_viajero_principal`)))
        LEFT JOIN `proveedores` `pro` ON ((`pro`.`id` = `b`.`id_proveedor`)));
```

---

## 2. Columnas Clave y Filtros Indexados

| Columna | Tipo | Uso en Backend Especializado |
| :--- | :--- | :--- |
| `id_agente` | `INT / VARCHAR` | **Filtro raíz obligatorio** para multi-tenancy en toda query. |
| `id_booking` | `INT` | Identificador primario de la reserva. |
| `id_relacion` | `VARCHAR` | Identificador agrupador de la solicitud/reserva. |
| `id_solicitud_client` | `VARCHAR` | Identificador de solicitud para cupones (`sol-...`). |
| `type` (`tipo_servicio`) | `VARCHAR` | Discriminador de producto: `'hotel'`, `'vuelo'`, `'renta_carros'`. |
| `check_in` / `check_out` | `DATETIME / DATE` | Base para el cálculo de `temporalidad` (`proximas` $\ge \text{HOY}$, `pasadas` $< \text{HOY}$). |
| `codigo_confirmacion` | `VARCHAR` | Búsqueda directa por localizador / PNR. |
| `nombre_viajero` | `VARCHAR` | Nombre completo del pasajero/huésped principal. |
| `proveedor` | `VARCHAR` | Cadena hotelera, aerolínea o arrendadora. |
| `total` / `costo_total` | `DECIMAL` | Montos financieros de la reserva. |
| `estado` | `VARCHAR` | Estatus operativo: `'Confirmada'`, `'Cancelada'`, `'Pendiente'`. |

---

## 3. Consultas en Planeación para Optimización

1. **Directorio de Viajeros (`/viajeros`):**
   - Rediseñar la query sobre `viajeros` y `agentes_viajeros` indexando por `id_agente` para eliminar la lentitud del backend anterior.
2. **Finanzas / Saldos y Créditos (`/finanzas`):**
   - Query unificada y directa a `agente_details`, `credito` y `saldos_a_favor` evitando subconsultas redundantes.
