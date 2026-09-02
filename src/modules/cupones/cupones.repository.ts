import type { QueryExecutor } from "../../core/config/db.js";
import {
  DETALLE_AUTO_Q_CUP_04,
  DETALLE_HOTEL_Q_CUP_02,
  DETALLE_VUELO_CABECERA_Q_CUP_03,
  DETALLE_VUELO_TRAMOS_Q_CUP_03,
  RESOLVER_CUPON_Q_CUP_01,
  SELECT_AGENTE_EXISTS,
} from "./cupones.queries.js";

type NullableText = string | null;
type DatabaseBoolean = boolean | number | string | null;

export interface RawAgenteRow {
  id_agente: string;
}

export interface RawCuponRow {
  type: "flyght" | "vuelo" | "hotel" | "car_rental" | "auto";
  id_relacion: string;
  id_booking: string;
  id_solicitud_client: string;
}

export interface RawCuponHotelRow {
  check_in: string;
  check_out: string;
  codigo_confirmacion: string;
  comentarios: string;
  id_hotel_resuelto: NullableText;
  direccion: NullableText;
  acompanantes: string;
  primer_nombre: NullableText;
  segundo_nombre: NullableText;
  apellido_paterno: NullableText;
  apellido_materno: NullableText;
  id_solicitud: string;
  id_booking: string;
  room: NullableText;
  hotel: NullableText;
  incluye_desayuno: DatabaseBoolean;
  total_solicitud: number | null;
  created_at_solicitud: string | null;
  type: "hotel";
}

export interface RawCuponVueloCabeceraRow {
  total: number | null;
  primer_nombre: NullableText;
  segundo_nombre: NullableText;
  apellido_paterno: NullableText;
  apellido_materno: NullableText;
  id_viaje_aereo: string;
  origen: NullableText;
  destino: NullableText;
  tipo: NullableText;
  codigo_confirmacion: NullableText;
}

export interface RawCuponVueloTramoRow {
  eq_mano: NullableText;
  eq_personal: NullableText;
  eq_documentado: NullableText;
  id_vuelo: string;
  flight_number: NullableText;
  airline: NullableText;
  departure_airport: NullableText;
  departure_city: NullableText;
  departure_date: NullableText;
  departure_time: NullableText;
  arrival_airport: NullableText;
  arrival_city: NullableText;
  arrival_date: NullableText;
  arrival_time: NullableText;
  parada: number | null;
  seat_number: NullableText;
  fly_type: "ida" | "vuelta" | null;
  comentarios: NullableText;
  rate_type: NullableText;
}

export interface RawCuponAutoRow {
  primer_nombre: NullableText;
  segundo_nombre: NullableText;
  apellido_paterno: NullableText;
  apellido_materno: NullableText;
  nombre_proveedor: NullableText;
  codigo_confirmation: NullableText;
  id_conductor_principal: NullableText;
  conductor_principal: NullableText;
  conductores_adicionales: NullableText;
  tipo_auto: NullableText;
  transmission: NullableText;
  lugar_recoger_auto: NullableText;
  hora_recoger_auto: NullableText;
  id_sucursal_recoger_auto: NullableText;
  hora_dejar_auto: NullableText;
  lugar_dejar_auto: NullableText;
  id_sucursal_dejar_auto: NullableText;
  dias: number | null;
  seguro_incluido: DatabaseBoolean;
  additional_driver: NullableText;
  check_in: NullableText;
  check_out: NullableText;
  nombre_sucursal_recoger: NullableText;
  direccion_recoger: NullableText;
  nombre_sucursal_dejar: NullableText;
  direccion_dejar: NullableText;
}

export async function selectAgenteExists(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawAgenteRow[]> {
  const rows = await executor.execute(SELECT_AGENTE_EXISTS, params);
  return rows as RawAgenteRow[];
}

export async function resolverCupon(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawCuponRow[]> {
  const rows = await executor.execute(RESOLVER_CUPON_Q_CUP_01, params);
  return rows as RawCuponRow[];
}

export async function selectDetalleHotel(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawCuponHotelRow[]> {
  const rows = await executor.execute(DETALLE_HOTEL_Q_CUP_02, params);
  return rows as RawCuponHotelRow[];
}

export async function selectDetalleVueloCabecera(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawCuponVueloCabeceraRow[]> {
  const rows = await executor.execute(DETALLE_VUELO_CABECERA_Q_CUP_03, params);
  return rows as RawCuponVueloCabeceraRow[];
}

export async function selectDetalleVueloTramos(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawCuponVueloTramoRow[]> {
  const rows = await executor.execute(DETALLE_VUELO_TRAMOS_Q_CUP_03, params);
  return rows as RawCuponVueloTramoRow[];
}

export async function selectDetalleAuto(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawCuponAutoRow[]> {
  const rows = await executor.execute(DETALLE_AUTO_Q_CUP_04, params);
  return rows as RawCuponAutoRow[];
}
