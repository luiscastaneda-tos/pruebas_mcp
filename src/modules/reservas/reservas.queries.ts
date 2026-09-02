export const SELECT_RESERVAS = `SELECT
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
OFFSET ?;`;

export const COUNT_RESERVAS = `SELECT
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
    );`;
