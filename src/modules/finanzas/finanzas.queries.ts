export const SELECT_AGENTE_EXISTS = `SELECT id_agente FROM agentes WHERE id_agente = ?;`;

export const SELECT_WALLET_Q_FIN_01 = `SELECT COALESCE(SUM(saldo), 0) AS total_saldo_favor
FROM saldos_a_favor
WHERE id_agente = ?
  AND is_wallet_credito <> 1
  AND is_cancelado = 0
  AND activo = 1;`;

export const SELECT_CREDITO_Q_FIN_02 = `SELECT saldo AS total_saldo_credito, id_agente, linea_credito
FROM agentes
WHERE id_agente = ?;`;
