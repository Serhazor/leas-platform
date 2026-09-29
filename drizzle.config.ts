import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { defineConfig } from "drizzle-kit";
import { directDatabaseUrl } from "./src/db/env";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Use the direct / session connection (port 5432) for migrations.
    url: directDatabaseUrl() || "",
  },
  strict: true,
});
