import type { QueryExecutor } from "../../core/config/db.js";
import { SELECT_AGENTE_EXISTS, SELECT_VIAJEROS_Q_VIA_01 } from "./viajeros.queries.js";

export interface RawAgenteRow {
  id_agente: string;
}

export interface RawViajeroRow {
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

export async function selectAgenteExists(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawAgenteRow[]> {
  const rows = await executor.execute(SELECT_AGENTE_EXISTS, params);
  return rows as RawAgenteRow[];
}

export async function selectViajeros(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawViajeroRow[]> {
  const rows = await executor.execute(SELECT_VIAJEROS_Q_VIA_01, params);
  return rows as RawViajeroRow[];
}
