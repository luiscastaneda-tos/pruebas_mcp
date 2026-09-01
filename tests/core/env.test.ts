import { describe, expect, it } from "vitest";
import { loadEnv } from "../../src/core/config/env.js";
const valid = { API_KEY: "key", DB_HOST: "localhost", DB_USER: "user", DB_PASSWORD: "pw", DB_NAME: "mia", DB_PORT: "3306" };
describe("configuración de entorno", () => {
  it("valida API_KEY y DB", () => expect(loadEnv(valid)).toMatchObject({ API_KEY: "key", DB_HOST: "localhost", DB_PORT: 3306 }));
  it("rechaza variable requerida ausente", () => { const source = { ...valid }; delete source.DB_NAME; expect(() => loadEnv(source)).toThrow(); });
  it("rechaza DB_PORT inválido", () => expect(() => loadEnv({ ...valid, DB_PORT: "not-a-port" })).toThrow());
});
