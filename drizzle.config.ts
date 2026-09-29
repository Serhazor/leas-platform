import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use the direct / session connection (port 5432) for migrations.
    url: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL || "",
  },
  strict: true,
});
