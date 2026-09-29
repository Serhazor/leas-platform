import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/db";
import { adminSessions, adminUsers, type AdminUser } from "@/db/schema";
import { SESSION_COOKIE, SESSION_DURATION_DAYS } from "./constants";
import { DEMO_ADMIN_EMAIL, isAdminOpenAccess } from "./demo";
import { hashPassword } from "./password";

export type CurrentAdmin = Pick<AdminUser, "id" | "email" | "name" | "role">;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Creates a session for the user and sets the httpOnly cookie. */
export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 86_400_000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  await getDb().insert(adminSessions).values({ userId, tokenHash: hashToken(token), expiresAt, userAgent });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Returns the signed-in administrator, or null. Memoised per request. */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return isAdminOpenAccess() ? getDemoAdmin() : null;
  const db = getDb();
  const rows = await db
    .select({
      sessionId: adminSessions.id,
      lastSeenAt: adminSessions.lastSeenAt,
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(
      and(
        eq(adminSessions.tokenHash, hashToken(token)),
        gt(adminSessions.expiresAt, new Date()),
        eq(adminUsers.isActive, true),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return isAdminOpenAccess() ? getDemoAdmin() : null;
  // Touch the session at most every 10 minutes.
  if (Date.now() - row.lastSeenAt.getTime() > 10 * 60_000) {
    await db.update(adminSessions).set({ lastSeenAt: new Date() }).where(eq(adminSessions.id, row.sessionId));
  }
  return { id: row.id, email: row.email, name: row.name, role: row.role };
});

/** Use at the top of every admin page and server action. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/connexion");
  return admin;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

/** Signs the user out everywhere except (optionally) the current session. */
export async function destroyOtherSessions(userId: string) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const db = getDb();
  const all = await db.select({ id: adminSessions.id, tokenHash: adminSessions.tokenHash }).from(adminSessions).where(eq(adminSessions.userId, userId));
  const current = token ? hashToken(token) : null;
  for (const s of all) {
    if (s.tokenHash !== current) await db.delete(adminSessions).where(eq(adminSessions.id, s.id));
  }
}

export async function purgeExpiredSessions() {
  await getDb().delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
}

/** Anonymised client IP (hashed, never stored in clear). */
export async function getClientIpHash(): Promise<string | null> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  if (!ip) return null;
  const secret = process.env.AUTH_SECRET ?? "";
  return createHash("sha256").update(`${secret}:${ip}`).digest("hex").slice(0, 32);
}

/** Demo mode: a real (but login-less) account so every foreign key keeps working. */
async function getDemoAdmin(): Promise<CurrentAdmin> {
  const db = getDb();
  const [existing] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role })
    .from(adminUsers)
    .where(eq(adminUsers.email, DEMO_ADMIN_EMAIL))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(adminUsers)
    .values({
      email: DEMO_ADMIN_EMAIL,
      name: "Démo",
      role: "admin",
      // Random unusable password: this account can never log in normally.
      passwordHash: await hashPassword(generateToken()),
    })
    .onConflictDoNothing()
    .returning({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role });
  if (created) return created;
  const [again] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role })
    .from(adminUsers)
    .where(eq(adminUsers.email, DEMO_ADMIN_EMAIL));
  return again;
}
