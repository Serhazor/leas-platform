"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { adminUsers, siteSettings } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { hashPassword, isPasswordStrongEnough, PASSWORD_RULES } from "@/lib/auth/password";
import { destroyOtherSessions, requireAdmin } from "@/lib/auth/session";
import { sendEmailSafely } from "@/lib/email";
import { getEmailProvider } from "@/lib/email/provider";
import { isFontPair } from "@/lib/theme";
import {
  emailField,
  failure,
  hexColor,
  invalid,
  optionalEmailField,
  optionalPhoneField,
  success,
  urlOrEmpty,
  type FormState,
} from "@/lib/validation";
import { bool, nullableId, revalidatePublic, str, UUID_RE } from "./helpers";

const t = (max: number) => z.string().trim().max(max, `${max} caractères maximum.`);
const int = (label: string, min: number, max: number) =>
  z.coerce
    .number({ error: `${label} : nombre invalide.` })
    .int(`${label} : nombre entier attendu.`)
    .min(min, `${label} : minimum ${min}.`)
    .max(max, `${label} : maximum ${max}.`);

const schemas = {
  general: z.object({
    companyName: z.string().trim().min(1, "Le nom de l'entreprise est obligatoire.").max(80),
    tagline: t(160),
    ownerName: t(80),
    email: optionalEmailField,
    phone: optionalPhoneField,
    addressLine: t(200),
    postalCode: t(10),
    city: t(100),
    serviceArea: t(200),
    contactHoursNote: t(120),
    linkedinUrl: urlOrEmpty,
    instagramUrl: urlOrEmpty,
    facebookUrl: urlOrEmpty,
    footerText: t(500),
  }),
  apparence: z.object({
    colorPrimary: hexColor,
    colorSecondary: hexColor,
    colorAccent: hexColor,
    fontPair: z.string().refine(isFontPair, "Choix de typographie invalide."),
  }),
  reservations: z.object({
    bookingMode: z.enum(["request", "instant"], { error: "Mode de réservation invalide." }),
    defaultDurationMinutes: int("Durée par défaut", 15, 600),
    bufferMinutes: int("Battement", 0, 240),
    slotIntervalMinutes: z.coerce.number().refine((v) => [15, 30, 45, 60].includes(v), "Intervalle invalide."),
    minNoticeHours: int("Délai minimum", 0, 720),
    maxAdvanceDays: int("Réservation jusqu'à", 1, 365),
  }),
  referencement: z.object({ seoTitle: t(120), seoDescription: t(300) }),
  emails: z.object({ notificationEmail: optionalEmailField, emailSenderName: t(80), emailSignature: t(500) }),
  legal: z.object({
    legalName: t(160),
    legalForm: t(80),
    siret: z
      .string()
      .trim()
      .max(20)
      .refine((v) => v === "" || v.replace(/\s/g, "").length === 14, "Le SIRET comporte 14 chiffres."),
    rcs: t(120),
    vatNumber: t(30),
    shareCapital: t(40),
    publicationDirector: t(120),
    hostingInfo: t(600),
  }),
} as const;

export type SettingsSection = keyof typeof schemas;

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const section = str(formData, "section") as SettingsSection;
  const schema = schemas[section];
  if (!schema) return failure("Section inconnue.");

  const raw: Record<string, string> = {};
  for (const key of Object.keys(schema.shape)) raw[key] = str(formData, key);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);

  const extra: Record<string, unknown> = {};
  if (section === "general") extra.showAddress = bool(formData, "showAddress");
  if (section === "apparence") {
    extra.logoId = nullableId(formData, "logoId");
    extra.faviconId = nullableId(formData, "faviconId");
  }
  if (section === "reservations") extra.bookingEnabled = bool(formData, "bookingEnabled");
  if (section === "referencement") extra.ogImageId = nullableId(formData, "ogImageId");

  const db = getDb();
  await db
    .insert(siteSettings)
    .values({ id: 1, ...parsed.data, ...extra })
    .onConflictDoUpdate({ target: siteSettings.id, set: { ...parsed.data, ...extra } });

  await logActivity({ type: "settings.updated", summary: "Paramètres du site modifiés", actorId: admin.id });
  revalidatePublic();
  revalidatePath("/admin", "layout");
  return success("Paramètres enregistrés.");
}

export async function sendTestEmail(): Promise<FormState> {
  const admin = await requireAdmin();
  const [settings] = await getDb().select().from(siteSettings).where(eq(siteSettings.id, 1));
  const to = settings?.notificationEmail || admin.email;
  const provider = getEmailProvider();
  const ok = await sendEmailSafely({
    to,
    subject: "E-mail de test",
    text: "Cet e-mail confirme que l'envoi des notifications fonctionne correctement.",
    html: "<p>Cet e-mail confirme que l'envoi des notifications fonctionne correctement.</p>",
    fromName: settings?.emailSenderName || settings?.companyName,
  });
  if (provider.name === "console") {
    return failure("Aucun service d'envoi n'est configuré (RESEND_API_KEY manquante) : les e-mails ne sont pas envoyés.");
  }
  return ok ? success(`E-mail de test envoyé à ${to}.`) : failure("L'envoi a échoué. Vérifiez la configuration du service d'envoi.");
}

/* ------------------------------ Administrators ------------------------------ */

export async function createAdminUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ name: z.string().trim().min(1, "Le nom est obligatoire.").max(100), email: emailField })
    .safeParse({ name: str(formData, "name"), email: str(formData, "email") });
  if (!parsed.success) return invalid(parsed.error);
  const password = str(formData, "password");
  if (!isPasswordStrongEnough(password)) {
    return { status: "error", message: "Merci de corriger les champs indiqués.", fieldErrors: { password: PASSWORD_RULES }, submittedAt: Date.now() };
  }
  const db = getDb();
  const [exists] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, parsed.data.email));
  if (exists) return { status: "error", fieldErrors: { email: "Un compte existe déjà avec cette adresse." }, submittedAt: Date.now() };
  await db.insert(adminUsers).values({ ...parsed.data, passwordHash: await hashPassword(password), role: "admin" });
  await logActivity({ type: "settings.updated", summary: `Accès administrateur créé pour ${parsed.data.name}`, actorId: admin.id });
  revalidatePath("/admin/parametres/acces");
  return success("Compte créé. Communiquez le mot de passe provisoire à la personne concernée.");
}

export async function setAdminActive(id: string, active: boolean): Promise<FormState> {
  const admin = await requireAdmin();
  if (!UUID_RE.test(id)) return failure("Action invalide.");
  if (id === admin.id) return failure("Vous ne pouvez pas désactiver votre propre compte.");
  const db = getDb();
  const [target] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  if (!target) return failure("Compte introuvable.");
  if (target.role === "owner" && admin.role !== "owner") return failure("Seule la propriétaire du site peut modifier ce compte.");
  await db.update(adminUsers).set({ isActive: active }).where(eq(adminUsers.id, id));
  if (!active) await destroyOtherSessions(id);
  revalidatePath("/admin/parametres/acces");
  return success(active ? "Compte réactivé." : "Compte désactivé.");
}
