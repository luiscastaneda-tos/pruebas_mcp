import { describe, expect, it, vi } from "vitest";
const { poolExecute } = vi.hoisted(() => ({ poolExecute: vi.fn(async () => [[{ from: "pool" }], []]) }));
vi.mock("mysql2/promise", () => { const pool = { execute: poolExecute }; return { createPool: () => pool, default: { createPool: () => pool } }; });
import { getExecutor } from "../../src/core/config/db.js";
const SENTINEL = "opaque-query-sentinel";
describe("DB getExecutor", () => {
  it("forwardea texto opaco y parámetros a conexión explícita", async () => {
    const calls: unknown[][] = [];
    const conn = { execute: async (...args: unknown[]) => { calls.push(args); return [[{ ok: 1 }], []]; } };
    const executor = getExecutor(conn as never);
    await expect(executor.execute(SENTINEL, ["opaque-param"])).resolves.toEqual([{ ok: 1 }]);
    expect(calls).toEqual([[SENTINEL, ["opaque-param"]]]);
  });
  it("soporta conexión transaccional explícita", async () => {
    const conn = { execute: async () => [[{ ok: 1 }], []] };
    await expect(getExecutor(conn as never).execute(SENTINEL, [])).resolves.toEqual([{ ok: 1 }]);
  });
  it("usa el pool por defecto para queries independientes", async () => {
    poolExecute.mockResolvedValueOnce([[{ from: "pool" }], []]);
    await expect(getExecutor().execute(SENTINEL, ["pool-param"])).resolves.toEqual([{ from: "pool" }]);
    expect(poolExecute).toHaveBeenCalledWith(SENTINEL, ["pool-param"]);
  });
});
