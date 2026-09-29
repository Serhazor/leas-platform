"use server";

import { and, count, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/db";
import { adminUsers, loginAttempts, passwordResetTokens, siteSettings } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { hashPassword, isPasswordStrongEnough, PASSWORD_RULES, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroyOtherSessions,
  destroySession,
  generateToken,
  getClientIpHash,
  hashToken,
  requireAdmin,
} from "@/lib/auth/session";
import { sendEmailSafely, siteUrl } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";
import { emailField, failure, invalid, success, type FormState } from "@/lib/validation";
import { str } from "./helpers";

const GENERIC_LOGIN_ERROR = "Adresse e-mail ou mot de passe incorrect.";
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60_000;

// A valid hash used to keep response times similar when the account does not exist.
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email: emailField, password: z.string().min(1, "Le mot de passe est obligatoire.").max(200) })
    .safeParse({ email: str(formData, "email"), password: str(formData, "password") });
  if (!parsed.success) return invalid(parsed.error, "Merci de renseigner votre e-mail et votre mot de passe.");
  const { email, password } = parsed.data;

  const db = getDb();
  const ipHash = await getClientIpHash();
  const since = new Date(Date.now() - WINDOW_MS);
  const [{ value: failures }] = await db
    .select({ value: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), eq(loginAttempts.success, false), gt(loginAttempts.createdAt, since)));
  if (failures >= MAX_FAILURES) {
    return failure("Trop de tentatives de connexion. Merci de patienter 15 minutes avant de réessayer.");
  }
  if (ipHash) {
    const [{ value: ipFailures }] = await db
      .select({ value: count() })
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ipHash, ipHash), eq(loginAttempts.success, false), gt(loginAttempts.createdAt, since)));
    if (ipFailures >= MAX_FAILURES * 4) {
      return failure("Trop de tentatives de connexion. Merci de patienter 15 minutes avant de réessayer.");
    }
  }

  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH).catch(() => false);
  const ok = Boolean(user && user.isActive && valid);
  await db.insert(loginAttempts).values({ email, ipHash, success: ok });
  if (!ok || !user) return failure(GENERIC_LOGIN_ERROR);

  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await createSession(user.id);
  await logActivity({ type: "auth.login", summary: `Connexion de ${user.name}`, actorId: user.id });

  const next = str(formData, "suite");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/connexion");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: emailField }).safeParse({ email: str(formData, "email") });
  if (!parsed.success) return invalid(parsed.error);
  const message =
    "Si un compte correspond à cette adresse, vous allez recevoir un e-mail contenant un lien de réinitialisation (valable 1 heure).";
  const db = getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, parsed.data.email)).limit(1);
  if (user && user.isActive) {
    // Limit to 3 requests per hour per account.
    const [{ value: recent }] = await db
      .select({ value: count() })
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.userId, user.id), gt(passwordResetTokens.createdAt, new Date(Date.now() - 3_600_000))));
    if (recent < 3) {
      const token = generateToken();
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 3_600_000),
      });
      const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
      if (settings) {
        const mail = passwordResetEmail(settings, user.name, siteUrl(`/admin/reinitialiser?jeton=${token}`));
        await sendEmailSafely({ ...mail, to: user.email, fromName: settings.emailSenderName || settings.companyName });
      }
    }
  }
  return success(message);
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = str(formData, "jeton");
  const password = str(formData, "password");
  const confirm = str(formData, "confirm");
  if (!isPasswordStrongEnough(password)) return { status: "error", fieldErrors: { password: PASSWORD_RULES }, submittedAt: Date.now() };
  if (password !== confirm) return { status: "error", fieldErrors: { confirm: "Les deux mots de passe ne correspondent pas." }, submittedAt: Date.now() };

  const db = getDb();
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, hashToken(token)),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);
  if (!row) return failure("Ce lien de réinitialisation n'est plus valide. Merci d'en demander un nouveau.");

  await db.transaction(async (tx) => {
    await tx.update(adminUsers).set({ passwordHash: await hashPassword(password) }).where(eq(adminUsers.id, row.userId));
    await tx.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
  });
  await destroyOtherSessions(row.userId);
  return success("Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const current = str(formData, "current");
  const password = str(formData, "password");
  const confirm = str(formData, "confirm");
  const db = getDb();
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, admin.id));
  if (!user || !(await verifyPassword(current, user.passwordHash))) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", fieldErrors: { current: "Mot de passe actuel incorrect." }, submittedAt: Date.now() };
  }
  if (!isPasswordStrongEnough(password)) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", fieldErrors: { password: PASSWORD_RULES }, submittedAt: Date.now() };
  }
  if (password !== confirm) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", fieldErrors: { confirm: "Les deux mots de passe ne correspondent pas." }, submittedAt: Date.now() };
  }
  await db.update(adminUsers).set({ passwordHash: await hashPassword(password) }).where(eq(adminUsers.id, admin.id));
  await destroyOtherSessions(admin.id);
  return success("Mot de passe modifié. Vos autres sessions ont été déconnectées.");
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ name: z.string().trim().min(1, "Le nom est obligatoire.").max(100), email: emailField })
    .safeParse({ name: str(formData, "name"), email: str(formData, "email") });
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  const [clash] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, parsed.data.email));
  if (clash && clash.id !== admin.id) {
    return { status: "error", fieldErrors: { email: "Cette adresse est déjà utilisée par un autre compte." }, submittedAt: Date.now() };
  }
  await db.update(adminUsers).set(parsed.data).where(eq(adminUsers.id, admin.id));
  return success("Vos informations ont été enregistrées.");
}
