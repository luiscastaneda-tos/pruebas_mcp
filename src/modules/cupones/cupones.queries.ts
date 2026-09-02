export const SELECT_AGENTE_EXISTS = `SELECT id_agente FROM agentes WHERE id_agente = ?;`;

export const RESOLVER_CUPON_Q_CUP_01 = `SELECT type, id_relacion, id_booking, id_solicitud_client
FROM vw_details_booking
WHERE (id_solicitud_client = ? OR id_booking = ? OR id_relacion = ?)
  AND estado <> 'Cancelada'
LIMIT 1;`;

export const DETALLE_HOTEL_Q_CUP_02 = `SELECT
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
LIMIT 1;`;

export const DETALLE_VUELO_CABECERA_Q_CUP_03 = `SELECT b.total, v.primer_nombre, v.segundo_nombre, v.apellido_paterno, v.apellido_materno, 
       va.id_viaje_aereo, va.ciudad_origen as origen, va.ciudad_destino as destino, 
       va.trip_type as tipo, va.codigo_confirmacion 
FROM viajes_aereos va
LEFT JOIN viajeros v ON va.id_viajero = v.id_viajero
LEFT JOIN bookings b ON b.id_booking = va.id_booking
WHERE va.id_viaje_aereo = ?
LIMIT 1;`;

export const DETALLE_VUELO_TRAMOS_Q_CUP_03 = `SELECT eq_mano, eq_personal, eq_documentado, id_vuelo, flight_number, airline, 
       departure_airport, departure_city, departure_date, departure_time, 
       arrival_airport, arrival_city, arrival_date, arrival_time, 
       stop_count as parada, seat_number, fly_type, comentarios, rate_type 
FROM vuelos 
WHERE id_viaje_aereo = ?;`;

export const DETALLE_AUTO_Q_CUP_04 = `SELECT v.primer_nombre, v.segundo_nombre, v.apellido_paterno, v.apellido_materno, 
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
LIMIT 1;`;
