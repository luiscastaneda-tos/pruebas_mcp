import mysql, {
  type ExecuteValues,
  type Pool,
  type PoolConnection,
  type RowDataPacket,
} from "mysql2/promise";

export type QueryExecutor = {
  execute(sql: string, params: readonly unknown[]): Promise<unknown[]>;
};

export const pool: Pool = mysql.createPool({
    host: process.env.DB_HOST ?? "",
    user: process.env.DB_USER ?? "",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "",
    port: Number(process.env.DB_PORT ?? 3306),
    waitForConnections: true,
    connectionLimit: 10,
});

export function getExecutor(conn?: PoolConnection): QueryExecutor {
  const target = conn ?? pool;
  return {
    async execute(sql: string, params: readonly unknown[]): Promise<unknown[]> {
      const values = [...params] as ExecuteValues[];
      const [rows] = await target.execute<RowDataPacket[]>(sql, values);
      return rows;
    },
  };
}
