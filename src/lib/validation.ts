import { z } from "zod";
import { isValidDateString, isValidTimeString } from "@/lib/time";

/** Common shape returned by every form server action. */
export type FormState<T = undefined> = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  data?: T;
  /** Changes on every submission so client components can react (toasts, resets). */
  submittedAt?: number;
};

export const initialFormState: FormState = { status: "idle" };

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function invalid<T = undefined>(error: z.ZodError, message = "Merci de corriger les champs indiqués."): FormState<T> {
  return { status: "error", message, fieldErrors: fieldErrorsFrom(error), submittedAt: Date.now() };
}

export function failure<T = undefined>(message = "Une erreur inattendue est survenue. Merci de réessayer."): FormState<T> {
  return { status: "error", message, submittedAt: Date.now() };
}

export function success<T = undefined>(message?: string, data?: T): FormState<T> {
  return { status: "success", message, data, submittedAt: Date.now() };
}

/* -------------------------------------------------------------------------- */
/* Reusable fields                                                             */
/* -------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const text = (max = 200) => z.string().trim().max(max, `${max} caractères maximum.`);

export const requiredText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} est obligatoire.`).max(max, `${max} caractères maximum.`);

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "L'adresse e-mail est obligatoire.")
  .max(200, "Adresse e-mail trop longue.")
  .regex(EMAIL_RE, "Adresse e-mail invalide.");

export const optionalEmailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .refine((v) => v === "" || EMAIL_RE.test(v), "Adresse e-mail invalide.");

export const phoneField = z
  .string()
  .trim()
  .min(1, "Le numéro de téléphone est obligatoire.")
  .max(30, "Numéro de téléphone invalide.")
  .refine((v) => /^[+\d][\d\s.\-()]{7,}$/.test(v) && v.replace(/\D/g, "").length >= 9, "Numéro de téléphone invalide.");

export const optionalPhoneField = z
  .string()
  .trim()
  .max(30)
  .refine(
    (v) => v === "" || (/^[+\d][\d\s.\-()]{7,}$/.test(v) && v.replace(/\D/g, "").length >= 9),
    "Numéro de téléphone invalide.",
  );

export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const urlOrEmpty = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v), "Adresse web invalide (elle doit commencer par https://).");

/** Internal path (/contact) or absolute URL, or empty. */
export const linkField = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v) || v.startsWith("mailto:") || v.startsWith("tel:"),
    "Lien invalide : utilisez une page du site ou une adresse commençant par https://.",
  );

export const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide (format attendu : #1a2b3c).");

/* -------------------------------------------------------------------------- */
/* Public forms                                                                */
/* -------------------------------------------------------------------------- */

export const bookingSchema = z
  .object({
    serviceId: z.uuid("Merci de choisir un service."),
    date: z.string().refine(isValidDateString, "Merci de choisir une date."),
    time: z.string().refine(isValidTimeString, "Merci de choisir un horaire."),
    firstName: requiredText("Le prénom", 80),
    lastName: requiredText("Le nom", 80),
    company: text(120),
    email: emailField,
    phone: phoneField,
    addressLine: text(200),
    postalCode: z
      .string()
      .trim()
      .max(10)
      .refine((v) => v === "" || /^\d{5}$/.test(v), "Code postal invalide (5 chiffres)."),
    city: text(100),
    message: text(2000),
    requiresAddress: checkbox,
    consent: checkbox.refine((v) => v, "Merci d'accepter la politique de confidentialité pour continuer."),
  })
  .superRefine((v, ctx) => {
    if (v.requiresAddress) {
      if (!v.addressLine) ctx.addIssue({ code: "custom", path: ["addressLine"], message: "L'adresse de l'intervention est obligatoire." });
      if (!v.postalCode) ctx.addIssue({ code: "custom", path: ["postalCode"], message: "Le code postal est obligatoire." });
      if (!v.city) ctx.addIssue({ code: "custom", path: ["city"], message: "La ville est obligatoire." });
    }
  });

export const contactSchema = z.object({
  firstName: requiredText("Le prénom", 80),
  lastName: requiredText("Le nom", 80),
  company: text(120),
  email: emailField,
  phone: optionalPhoneField,
  subject: requiredText("L'objet", 150),
  message: z
    .string()
    .trim()
    .min(10, "Votre message doit contenir au moins 10 caractères.")
    .max(5000, "5 000 caractères maximum."),
  consent: checkbox.refine((v) => v, "Merci d'accepter la politique de confidentialité pour continuer."),
});

export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$ACTION")) out[k] = v;
  }
  return out;
}
