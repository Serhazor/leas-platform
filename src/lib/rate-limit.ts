import "server-only";
import { and, eq, gt, count } from "drizzle-orm";
import { getDb } from "@/db";
import { bookings, contactEnquiries } from "@/db/schema";

/** Simple spam protections for public forms (no third-party service, no cookies). */
export function isLikelyBot(formData: FormData): boolean {
  // Honeypot: a field hidden from humans.
  if (String(formData.get("site_web") ?? "").trim() !== "") return true;
  // Submitted implausibly fast after the form was displayed.
  const started = Number(formData.get("_t") ?? 0);
  if (started && Date.now() - started < 2500) return true;
  return false;
}

export async function tooManyBookings(email: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60_000);
  const [{ value }] = await getDb()
    .select({ value: count() })
    .from(bookings)
    .where(and(eq(bookings.email, email), gt(bookings.createdAt, since)));
  return value >= 5;
}

export async function tooManyEnquiries(email: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60_000);
  const [{ value }] = await getDb()
    .select({ value: count() })
    .from(contactEnquiries)
    .where(and(eq(contactEnquiries.email, email), gt(contactEnquiries.createdAt, since)));
  return value >= 5;
}
