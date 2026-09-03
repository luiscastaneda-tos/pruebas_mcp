import type { QueryExecutor } from "../../core/config/db.js";
import { NotFoundError } from "../../core/errors/index.js";
import {
  selectAgenteExists,
  selectCredito,
  selectWallet,
} from "./finanzas.repository.js";

export interface SaldoCreditoData {
  wallet: {
    saldo_a_favor_disponible: number;
  };
  credito: {
    limite_credito: number | null;
    credito_disponible: number;
  };
}

export class FinanzasService {
  private async assertAgentExists(idAgente: string, executor: QueryExecutor): Promise<void> {
    const rows = await selectAgenteExists(executor, [idAgente]);
    if (rows.length === 0) throw new NotFoundError("Agente", idAgente);
  }

  public async obtenerSaldoCredito(
    idAgente: string,
    executor: QueryExecutor,
  ): Promise<SaldoCreditoData> {
    await this.assertAgentExists(idAgente, executor);
    const [walletRows, creditoRows] = await Promise.all([
      selectWallet(executor, [idAgente]),
      selectCredito(executor, [idAgente]),
    ]);
    const wallet = walletRows[0];
    const credito = creditoRows[0];

    if (wallet === undefined || credito === undefined) {
      throw new NotFoundError("Agente", idAgente);
    }

    return {
      wallet: {
        saldo_a_favor_disponible: wallet.total_saldo_favor,
      },
      credito: {
        limite_credito: credito.linea_credito,
        credito_disponible: credito.total_saldo_credito,
      },
    };
  }
}

export const finanzasService = new FinanzasService();
