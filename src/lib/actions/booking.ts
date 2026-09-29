"use server";

import { eq } from "drizzle-orm";
import { after } from "next/server";
import { getDb } from "@/db";
import { services } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { createBooking, ServiceUnavailableError, SlotUnavailableError } from "@/lib/booking/engine";
import { BOOKING_STATUS_LABELS } from "@/lib/booking/status";
import { getCalendarProvider } from "@/lib/calendar/provider";
import { sendEmailSafely, siteUrl } from "@/lib/email";
import { adminBookingNotification, bookingConfirmedEmail, bookingReceivedEmail } from "@/lib/email/templates";
import { fullName } from "@/lib/format";
import { isLikelyBot, tooManyBookings } from "@/lib/rate-limit";
import { formatDateLong, formatTime } from "@/lib/time";
import { bookingSchema, failure, formDataToObject, invalid, success, type FormState } from "@/lib/validation";

export type BookingResult = {
  reference: string;
  status: "pending" | "confirmed";
  serviceTitle: string;
  dateLabel: string;
  timeLabel: string;
  email: string;
};

export type BookingFormState = FormState<BookingResult | { code: "slot_unavailable" }>;

export async function submitBooking(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  if (isLikelyBot(formData)) return failure("Votre demande n'a pas pu être envoyée. Merci de réessayer.");

  const raw = formDataToObject(formData);
  const db = getDb();

  // The address requirement depends on the service, never on client input.
  let requiresAddress = true;
  if (raw.serviceId && /^[0-9a-f-]{36}$/i.test(raw.serviceId)) {
    const [svc] = await db.select({ r: services.requiresAddress }).from(services).where(eq(services.id, raw.serviceId));
    requiresAddress = svc?.r ?? true;
  }
  const parsed = bookingSchema.safeParse({ ...raw, requiresAddress: requiresAddress ? "true" : "" });
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  try {
    if (await tooManyBookings(input.email)) {
      return failure("Vous avez déjà envoyé plusieurs demandes récemment. Merci de nous contacter directement.");
    }

    const { booking, settings } = await createBooking(input);

    after(async () => {
      await logActivity({
        type: "booking.created",
        summary: `${booking.status === "pending" ? "Nouvelle demande" : "Nouvelle réservation"} : ${booking.serviceTitle} — ${fullName(booking)} (${BOOKING_STATUS_LABELS[booking.status]})`,
        entityType: "booking",
        entityId: booking.id,
      });
      const fromName = settings.emailSenderName || settings.companyName;
      const customerMail =
        booking.status === "confirmed" ? bookingConfirmedEmail(settings, booking) : bookingReceivedEmail(settings, booking);
      await sendEmailSafely({ ...customerMail, to: booking.email, replyTo: settings.email || undefined, fromName });
      const adminTo = settings.notificationEmail || settings.email;
      if (adminTo) {
        const adminMail = adminBookingNotification(settings, booking, siteUrl(`/admin/reservations/${booking.id}`));
        await sendEmailSafely({ ...adminMail, to: adminTo, replyTo: booking.email, fromName });
      }
      try {
        const res = await getCalendarProvider().onBookingChanged(booking);
        void res;
      } catch (err) {
        console.error("[calendrier]", err);
      }
    });

    const tz = settings.timezone;
    return success("Votre demande a bien été enregistrée.", {
      reference: booking.reference,
      status: booking.status as "pending" | "confirmed",
      serviceTitle: booking.serviceTitle,
      dateLabel: formatDateLong(booking.startsAt, tz),
      timeLabel: formatTime(booking.startsAt, tz),
      email: booking.email,
    });
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return {
        status: "error",
        message: "Ce créneau vient d'être réservé ou n'est plus disponible. Merci d'en choisir un autre.",
        data: { code: "slot_unavailable" },
        submittedAt: Date.now(),
      };
    }
    if (err instanceof ServiceUnavailableError) return failure(err.message);
    console.error("[réservation] échec", err);
    return failure("Votre demande n'a pas pu être enregistrée. Merci de réessayer dans quelques instants ou de nous contacter.");
  }
}
