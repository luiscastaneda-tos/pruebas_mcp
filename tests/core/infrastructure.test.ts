import { describe, expect, it } from "vitest";
import { mockExecutor } from "../helpers/mockExecutor.js";
import { catalogQuery } from "../helpers/catalogIntegrity.js";

describe("infraestructura QA de executor y catálogo", () => {
  it("captura sql y params en orden, encola filas y permite reset", async () => {
    const mock = mockExecutor();
    mock.queueRows([{ n: 1 }]); mock.queueRows([{ n: 2 }]);
    await expect(mock.executor.execute("opaque-a", ["a"])).resolves.toEqual([{ n: 1 }]);
    await expect(mock.executor.execute("opaque-b", ["b"])).resolves.toEqual([{ n: 2 }]);
    expect(mock.calls).toEqual([{ sql: "opaque-a", params: ["a"] }, { sql: "opaque-b", params: ["b"] }]);
    mock.reset(); expect(mock.calls).toEqual([]);
  });
  it("afirma SQL exacto del catálogo y rechaza cualquier diferencia", () => {
    const mock = mockExecutor();
    const q = catalogQuery("Q-RES-01");
    mock.calls.push({ sql: q.sql, params: [] });
    expect(() => mock.assertCalledWithCatalogQuery(q.sql)).not.toThrow();
    expect(() => mock.assertCalledWithCatalogQuery(`${q.sql} `)).toThrow();
  });
  it("extrae carácter por carácter Q-RES-01 y Q-RES-02, y rechaza ID inexistente", () => {
    const first = catalogQuery("Q-RES-01"); const second = catalogQuery("Q-RES-02");
    expect(first.sql).toContain("SELECT"); expect(first.sql).toContain("id_agente = ?");
    expect(second.sql).toContain("count(id_booking) as total");
    expect(first.sql).not.toBe(second.sql);
    expect(() => catalogQuery("Q-NOT-EXIST")).toThrow();
  });
});
