"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getDb } from "@/db";
import { bookings, siteSettings, type BookingStatus } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { requireAdmin } from "@/lib/auth/session";
import { isExclusionViolation } from "@/lib/booking/engine";
import { BOOKING_STATUS_LABELS, BOOKING_TRANSITIONS } from "@/lib/booking/status";
import { getCalendarProvider } from "@/lib/calendar/provider";
import { sendEmailSafely } from "@/lib/email";
import { bookingCancelledEmail, bookingConfirmedEmail, bookingRefusedEmail } from "@/lib/email/templates";
import { fullName } from "@/lib/format";
import { failure, success, type FormState } from "@/lib/validation";
import { bool, str, UUID_RE } from "./helpers";

export async function changeBookingStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const next = str(formData, "status") as BookingStatus;
  const note = str(formData, "note").trim().slice(0, 2000);
  const notify = bool(formData, "notify");
  if (!UUID_RE.test(id) || !(next in BOOKING_STATUS_LABELS)) return failure("Action invalide.");

  const db = getDb();
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return failure("Cette réservation n'existe plus.");
  if (!BOOKING_TRANSITIONS[booking.status].includes(next)) {
    return failure(`Impossible de passer de « ${BOOKING_STATUS_LABELS[booking.status]} » à « ${BOOKING_STATUS_LABELS[next]} ».`);
  }

  let updated;
  try {
    [updated] = await db
      .update(bookings)
      .set({ status: next, statusChangedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
  } catch (err) {
    if (isExclusionViolation(err)) {
      return failure("Ce créneau est déjà occupé par une autre réservation. Impossible de la réactiver.");
    }
    throw err;
  }

  after(async () => {
    await logActivity({
      type: "booking.status",
      summary: `Réservation ${updated.reference} (${fullName(updated)}) : ${BOOKING_STATUS_LABELS[next]}`,
      entityType: "booking",
      entityId: id,
      actorId: admin.id,
    });
    if (notify && ["confirmed", "refused", "cancelled"].includes(next)) {
      const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
      if (settings) {
        const mail =
          next === "confirmed"
            ? bookingConfirmedEmail(settings, updated, note)
            : next === "refused"
              ? bookingRefusedEmail(settings, updated, note)
              : bookingCancelledEmail(settings, updated, note);
        await sendEmailSafely({
          ...mail,
          to: updated.email,
          replyTo: settings.email || undefined,
          fromName: settings.emailSenderName || settings.companyName,
        });
      }
    }
    try {
      await getCalendarProvider().onBookingChanged(updated);
    } catch (err) {
      console.error("[calendrier]", err);
    }
  });

  revalidatePath("/admin", "layout");
  const emailed = notify && ["confirmed", "refused", "cancelled"].includes(next) ? " Le client va être prévenu par e-mail." : "";
  return success(`Statut mis à jour : ${BOOKING_STATUS_LABELS[next]}.${emailed}`);
}

export async function updateBookingNotes(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(formData, "id");
  if (!UUID_RE.test(id)) return failure("Action invalide.");
  await getDb()
    .update(bookings)
    .set({ privateNotes: str(formData, "privateNotes").slice(0, 10_000) })
    .where(eq(bookings.id, id));
  revalidatePath(`/admin/reservations/${id}`);
  return success("Notes enregistrées.");
}
