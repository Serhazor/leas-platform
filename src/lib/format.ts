const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euroRound = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? euroRound.format(cents / 100) : euro.format(cents / 100);
}

export function formatServicePrice(s: {
  priceCents: number | null;
  priceFrom: boolean;
  priceNote: string;
  showPrice: boolean;
}): string | null {
  if (!s.showPrice || s.priceCents == null) return null;
  const base = `${s.priceFrom ? "À partir de " : ""}${formatPrice(s.priceCents)}`;
  return s.priceNote ? `${base} ${s.priceNote}` : base;
}

/** "12,50" | "12" | "12.5" -> cents; empty -> null; invalid -> NaN */
export function parsePriceToCents(input: string): number | null {
  const v = input.trim().replace(/\s|€/g, "").replace(",", ".");
  if (!v) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return Number.NaN;
  return Math.round(Number(v) * 100);
}

export function centsToInput(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2).replace(".", ",");
}

/** URL-safe slug without accents: « État des lieux d'entrée » -> « etat-des-lieux-d-entree ». */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function fullName(p: { firstName: string; lastName: string }) {
  return `${p.firstName} ${p.lastName}`.trim();
}

/** Formats a French phone number for display when possible (0612345678 -> 06 12 34 56 78). */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  return phone;
}

export function phoneHref(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10) return `tel:+33${cleaned.slice(1)}`;
  return `tel:${cleaned}`;
}
