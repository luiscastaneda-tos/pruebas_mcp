import { z } from "zod";

const envSchema = z.object({
  API_KEY: z.string().min(1),
  DB_HOST: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().min(1),
  DB_PORT: z.coerce.number().int().min(1).max(65535),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Configuración de entorno inválida: ${issues}`);
  }
  return result.data;
}
