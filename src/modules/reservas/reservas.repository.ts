import type { QueryExecutor } from "../../core/config/db.js";
import { COUNT_RESERVAS, SELECT_RESERVAS } from "./reservas.queries.js";

export interface RawReservaRow {
  id_booking: string;
  id_relacion: string;
  id_solicitud_client: string;
  type: "flyght" | "hotel" | "car_rental";
  codigo_confirmacion: string;
  proveedor: string;
  nombre_viajero: string;
  check_in: string;
  check_out: string;
  estado: string;
  total: number;
  metodo_pago: string;
}

export interface RawReservaCountRow {
  total: number;
}

export async function selectReservas(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawReservaRow[]> {
  const rows = await executor.execute(SELECT_RESERVAS, params);
  return rows as RawReservaRow[];
}

export async function countReservas(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawReservaCountRow[]> {
  const rows = await executor.execute(COUNT_RESERVAS, params);
  return rows as RawReservaCountRow[];
}
