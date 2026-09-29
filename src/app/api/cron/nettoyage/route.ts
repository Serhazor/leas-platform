import { and, inArray, lt } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/db";
import { activityLog, adminSessions, bookings, contactEnquiries, loginAttempts, passwordResetTokens } from "@/db/schema";

export const dynamic = "force-dynamic";

const YEARS_3 = 3 * 365 * 86_400_000;

/**
 * Daily data-retention job (RGPD), triggered by Vercel Cron (see vercel.json).
 * - contact enquiries: deleted 3 years after receipt
 * - bookings: personal data anonymised 3 years after the appointment
 * - technical data (sessions, login attempts, reset tokens, activity log) purged.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const db = getDb();
  const now = Date.now();
  const threeYearsAgo = new Date(now - YEARS_3);

  const enquiries = await db.delete(contactEnquiries).where(lt(contactEnquiries.createdAt, threeYearsAgo)).returning({ id: contactEnquiries.id });
  const anonymised = await db
    .update(bookings)
    .set({
      firstName: "Anonyme",
      lastName: "",
      company: "",
      email: "anonyme@invalid",
      phone: "",
      addressLine: "",
      postalCode: "",
      message: "",
      privateNotes: "",
    })
    .where(and(lt(bookings.endsAt, threeYearsAgo), inArray(bookings.status, ["pending", "confirmed", "refused", "cancelled", "completed"])))
    .returning({ id: bookings.id });
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date(now)));
  await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date(now - 86_400_000)));
  await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, new Date(now - 30 * 86_400_000)));
  await db.delete(activityLog).where(lt(activityLog.createdAt, new Date(now - 365 * 86_400_000)));

  return NextResponse.json({ ok: true, enquiriesDeleted: enquiries.length, bookingsAnonymised: anonymised.length });
}
