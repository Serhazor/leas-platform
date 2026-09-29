/**
 * Creates (or resets the password of) an administrator account.
 * There is no public registration: this script is the only way to create the first account.
 *
 * Usage:
 *   npm run admin:create -- --email=vous@exemple.fr --name="Prénom Nom" --password="MotDePasse123"
 * If --password is omitted, a strong random password is generated and printed once.
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { adminUsers } from "../src/db/schema";
import { hashPassword, isPasswordStrongEnough, PASSWORD_RULES } from "../src/lib/auth/password";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim() || "Administratrice";
  let password = arg("password");
  const generated = !password;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('✗ Indiquez une adresse e-mail valide : --email=vous@exemple.fr');
    process.exit(1);
  }
  if (!password) password = randomBytes(12).toString("base64url") + "7a";
  if (!isPasswordStrongEnough(password)) {
    console.error(`✗ Mot de passe trop faible. ${PASSWORD_RULES}`);
    process.exit(1);
  }

  const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
  if (!url) {
    console.error("✗ DATABASE_URL doit être défini.");
    process.exit(1);
  }
  const client = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(client);
  try {
    const passwordHash = await hashPassword(password);
    const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    if (existing.length) {
      await db
        .update(adminUsers)
        .set({ passwordHash, isActive: true, name })
        .where(eq(adminUsers.email, email));
      console.log(`✓ Compte existant mis à jour : ${email}`);
    } else {
      const [{ total }] = await client`select count(*)::int as total from admin_users`;
      await db.insert(adminUsers).values({
        email,
        name,
        passwordHash,
        role: total === 0 ? "owner" : "admin",
      });
      console.log(`✓ Compte administrateur créé : ${email}`);
    }
    if (generated) console.log(`  Mot de passe généré (à conserver) : ${password}`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("✗ Erreur :", err);
  process.exit(1);
});
