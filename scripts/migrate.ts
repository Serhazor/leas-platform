/**
 * Applies pending SQL migrations from /drizzle.
 * Usage: npm run db:migrate   (reads DATABASE_URL_DIRECT or DATABASE_URL from .env / environment)
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL (ou DATABASE_URL_DIRECT) doit être défini.");
    process.exit(1);
  }
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
    console.log("✓ Migrations appliquées.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("✗ Échec des migrations :", err);
  process.exit(1);
});
