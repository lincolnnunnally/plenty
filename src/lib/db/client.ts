import postgres from "postgres";

// Plenty persists to the shared Life Produces Life Supabase (one person, many
// relationships, one ecosystem). All app tables carry the plenty_ prefix —
// additive-only on the shared database. The connection goes through Supabase's
// transaction pooler, so prepared statements stay off.

export type DatabaseClient = {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

let sqlSingleton: postgres.Sql | null = null;
let clientSingleton: DatabaseClient | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("USER:PASSWORD@HOST"));
}

export function getDatabase(): DatabaseClient {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is required before using database persistence.");
  }

  if (!clientSingleton) {
    const connectionString = process.env.DATABASE_URL!.trim();
    sqlSingleton = postgres(connectionString, {
      ssl: "require",
      prepare: false,
      max: Number(process.env.DATABASE_POOL_MAX || 4),
      idle_timeout: 20,
      connect_timeout: 15
    });

    const sql = sqlSingleton;
    const tagged = (<T,>(strings: TemplateStringsArray, ...values: unknown[]) =>
      sql(strings, ...(values as never[])) as unknown as Promise<T[]>) as DatabaseClient;
    tagged.query = <T,>(text: string, params?: unknown[]) =>
      sql.unsafe(text, (params ?? []) as never[]) as unknown as Promise<T[]>;
    clientSingleton = tagged;
  }

  return clientSingleton;
}
