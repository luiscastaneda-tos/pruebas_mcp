export type QueryExecutor = { execute(sql: string, params: readonly unknown[]): Promise<unknown[]> };
export type ExecutorCall = { sql: string; params: readonly unknown[] };
export function mockExecutor() {
  const calls: ExecutorCall[] = [];
  const queued: unknown[][] = [];
  const executor: QueryExecutor = { execute: async (sql, params) => { calls.push({ sql, params }); return queued.shift() ?? []; } };
  return { executor, calls, queueRows(rows: unknown[]) { queued.push(rows); }, reset() { calls.length = 0; queued.length = 0; }, assertCalledWithCatalogQuery(sql: string) { if (!calls.some(c => c.sql === sql)) throw new Error("Executor no recibió el SQL exacto del catálogo"); } };
}
