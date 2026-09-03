import type { QueryExecutor } from "../../core/config/db.js";
import {
  SELECT_AGENTE_EXISTS,
  SELECT_CREDITO_Q_FIN_02,
  SELECT_WALLET_Q_FIN_01,
} from "./finanzas.queries.js";

export interface RawAgenteRow {
  id_agente: string;
}

export interface RawWalletRow {
  total_saldo_favor: number;
}

export interface RawCreditoRow {
  total_saldo_credito: number;
  id_agente: string;
  linea_credito: number | null;
}

export async function selectAgenteExists(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawAgenteRow[]> {
  const rows = await executor.execute(SELECT_AGENTE_EXISTS, params);
  return rows as RawAgenteRow[];
}

export async function selectWallet(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawWalletRow[]> {
  const rows = await executor.execute(SELECT_WALLET_Q_FIN_01, params);
  return rows as RawWalletRow[];
}

export async function selectCredito(
  executor: QueryExecutor,
  params: readonly unknown[],
): Promise<RawCreditoRow[]> {
  const rows = await executor.execute(SELECT_CREDITO_Q_FIN_02, params);
  return rows as RawCreditoRow[];
}
