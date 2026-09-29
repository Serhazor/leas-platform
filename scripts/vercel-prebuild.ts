/**
 * Runs automatically before `next build` on Vercel (package.json → "vercel-build").
 * - no database configured → skipped (the site builds with empty content);
 * - database configured    → applies migrations, inserts the initial French content
 *   (idempotent) and creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD if missing.
 */
import { execFileSync } from "node:child_process";
import { directDatabaseUrl } from "../src/db/env";

function run(script: string, args: string[] = []) {
  execFileSync(process.execPath, ["--import", "tsx", `scripts/${script}`, ...args], { stdio: "inherit" });
}

if (!directDatabaseUrl()) {
  console.log("ℹ Aucune base de données configurée : migrations et contenu initial ignorés.");
  process.exit(0);
}

run("migrate.ts");
run("seed.ts");

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (email && password) {
  run("create-admin.ts", [`--email=${email}`, `--password=${password}`, `--name=${process.env.ADMIN_NAME || "Administratrice"}`, "--if-missing"]);
} else {
  console.log("ℹ ADMIN_EMAIL / ADMIN_PASSWORD non définis : aucun compte administrateur créé automatiquement.");
}
