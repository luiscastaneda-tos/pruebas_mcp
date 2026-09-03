export const SELECT_AGENTE_EXISTS = `SELECT id_agente FROM agentes WHERE id_agente = ?;`;

export const SELECT_VIAJEROS_Q_VIA_01 = `SELECT
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
LIMIT 20;`;
