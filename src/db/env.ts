/**
 * Database connection strings, accepting the variable names set by the usual providers:
 * - Supabase / manual setup: DATABASE_URL (+ DATABASE_URL_DIRECT for migrations)
 * - Vercel Marketplace → Neon: DATABASE_URL / POSTGRES_URL (+ DATABASE_URL_UNPOOLED)
 */
export function runtimeDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
}

/** Direct (non-pooled) connection preferred for migrations and scripts. */
export function directDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL_DIRECT ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    runtimeDatabaseUrl()
  );
}
