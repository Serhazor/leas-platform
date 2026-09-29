/**
 * Transactional e-mail templates (French).
 * Kept as plain functions returning { subject, html, text } so the provider can change freely.
 */
import type { Booking, ContactEnquiry, SiteSettings } from "@/db/schema";
import { fullName, formatPhone } from "@/lib/format";
import { formatDateLong, formatTime } from "@/lib/time";

type Brand = Pick<SiteSettings, "companyName" | "email" | "phone" | "emailSignature" | "colorPrimary" | "timezone">;

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const nl2br = (s: string) => esc(s).replace(/\n/g, "<br>");

function layout(brand: Brand, title: string, bodyHtml: string): string {
  const color = /^#[0-9a-f]{6}$/i.test(brand.colorPrimary) ? brand.colorPrimary : "#2f4b45";
  const contact = [brand.email ? esc(brand.email) : "", brand.phone ? esc(formatPhone(brand.phone)) : ""]
    .filter(Boolean)
    .join(" · ");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f6f4f0;font-family:Arial,Helvetica,sans-serif;color:#1f2a2e;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4f0;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:6px;overflow:hidden;">
<tr><td style="padding:24px 28px;border-bottom:3px solid ${color};font-family:Georgia,serif;font-size:20px;color:${color};">${esc(brand.companyName || "")}</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
<tr><td style="padding:18px 28px;background:#faf8f5;font-size:12px;color:#6b7478;">${contact}</td></tr>
</table></td></tr></table></body></html>`;
}

function detailsTable(rows: [string, string][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:18px 0;border-collapse:collapse;font-size:14px;">${rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#6b7478;vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:8px 0;border-bottom:1px solid #eee;">${nl2br(v)}</td></tr>`,
    )
    .join("")}</table>`;
}

function detailsText(rows: [string, string][]): string {
  return rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k} : ${v}`)
    .join("\n");
}

function bookingRows(b: Booking, tz: string): [string, string][] {
  const address = [b.addressLine, [b.postalCode, b.city].filter(Boolean).join(" ")].filter(Boolean).join("\n");
  return [
    ["Référence", b.reference],
    ["Service", b.serviceTitle],
    ["Date", formatDateLong(b.startsAt, tz)],
    ["Heure", formatTime(b.startsAt, tz)],
    ["Adresse", address],
  ];
}

function signature(brand: Brand) {
  return brand.emailSignature || `Cordialement,\n${brand.companyName}`;
}

function build(brand: Brand, subject: string, paragraphs: string[], rows: [string, string][] = [], footer?: string): RenderedEmail {
  const sig = signature(brand);
  const html = layout(
    brand,
    subject,
    paragraphs.map((p) => `<p style="margin:0 0 14px;">${nl2br(p)}</p>`).join("") +
      (rows.length ? detailsTable(rows) : "") +
      (footer ? `<p style="margin:0 0 14px;">${nl2br(footer)}</p>` : "") +
      `<p style="margin:18px 0 0;">${nl2br(sig)}</p>`,
  );
  const text = [...paragraphs, rows.length ? detailsText(rows) : "", footer ?? "", sig].filter(Boolean).join("\n\n");
  return { subject, html, text };
}

const contactLine = (brand: Brand) =>
  brand.phone || brand.email
    ? `Pour toute question ou modification, vous pouvez répondre à cet e-mail${brand.phone ? ` ou appeler le ${formatPhone(brand.phone)}` : ""}.`
    : "Pour toute question ou modification, vous pouvez répondre à cet e-mail.";

/* ------------------------------ Customer e-mails ------------------------------ */

export function bookingReceivedEmail(brand: Brand, b: Booking): RenderedEmail {
  return build(
    brand,
    `Votre demande de rendez-vous — ${b.serviceTitle}`,
    [
      `Bonjour ${b.firstName},`,
      "Votre demande de rendez-vous a bien été reçue. Elle sera examinée dans les meilleurs délais et vous recevrez un e-mail dès qu'elle sera confirmée.",
    ],
    bookingRows(b, brand.timezone),
    contactLine(brand),
  );
}

export function bookingConfirmedEmail(brand: Brand, b: Booking, note?: string): RenderedEmail {
  return build(
    brand,
    `Rendez-vous confirmé — ${b.serviceTitle}`,
    [`Bonjour ${b.firstName},`, "Votre rendez-vous est confirmé. En voici le récapitulatif :", ...(note ? [note] : [])],
    bookingRows(b, brand.timezone),
    contactLine(brand),
  );
}

export function bookingRefusedEmail(brand: Brand, b: Booking, note?: string): RenderedEmail {
  return build(
    brand,
    `Votre demande de rendez-vous — ${b.serviceTitle}`,
    [
      `Bonjour ${b.firstName},`,
      "Nous ne sommes malheureusement pas en mesure de donner suite à votre demande de rendez-vous pour le créneau indiqué.",
      ...(note ? [note] : ["N'hésitez pas à proposer un autre créneau ou à nous contacter directement."]),
    ],
    bookingRows(b, brand.timezone),
    contactLine(brand),
  );
}

export function bookingCancelledEmail(brand: Brand, b: Booking, note?: string): RenderedEmail {
  return build(
    brand,
    `Rendez-vous annulé — ${b.serviceTitle}`,
    [`Bonjour ${b.firstName},`, "Votre rendez-vous a été annulé.", ...(note ? [note] : [])],
    bookingRows(b, brand.timezone),
    contactLine(brand),
  );
}

/* ------------------------------- Admin e-mails -------------------------------- */

export function adminBookingNotification(brand: Brand, b: Booking, adminUrl: string): RenderedEmail {
  const pending = b.status === "pending";
  return build(
    brand,
    `${pending ? "Nouvelle demande de rendez-vous" : "Nouvelle réservation"} — ${b.serviceTitle}`,
    [
      pending
        ? "Une nouvelle demande de rendez-vous attend votre validation."
        : "Une nouvelle réservation a été enregistrée et confirmée automatiquement.",
    ],
    [
      ...bookingRows(b, brand.timezone),
      ["Client", fullName(b)],
      ["Société", b.company],
      ["E-mail", b.email],
      ["Téléphone", formatPhone(b.phone)],
      ["Message", b.message],
    ],
    `Ouvrir la réservation : ${adminUrl}`,
  );
}

export function adminEnquiryNotification(brand: Brand, e: ContactEnquiry, adminUrl: string): RenderedEmail {
  return build(
    brand,
    `Nouvelle demande de contact — ${e.subject}`,
    ["Vous avez reçu un nouveau message depuis le formulaire de contact."],
    [
      ["Nom", fullName(e)],
      ["Société", e.company],
      ["E-mail", e.email],
      ["Téléphone", e.phone ? formatPhone(e.phone) : ""],
      ["Objet", e.subject],
      ["Message", e.message],
    ],
    `Ouvrir la demande : ${adminUrl}`,
  );
}

export function passwordResetEmail(brand: Brand, name: string, url: string): RenderedEmail {
  return build(
    brand,
    "Réinitialisation de votre mot de passe",
    [
      `Bonjour ${name},`,
      "Une demande de réinitialisation du mot de passe de votre espace d'administration a été effectuée. Pour choisir un nouveau mot de passe, ouvrez le lien ci-dessous (valable 1 heure) :",
      url,
      "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail : votre mot de passe reste inchangé.",
    ],
  );
}
