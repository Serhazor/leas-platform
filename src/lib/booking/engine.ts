import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { getDb, type Database } from "@/db";
import {
  availabilityRules,
  blockedPeriods,
  bookings,
  services,
  siteSettings,
  type Booking,
  type Service,
  type SiteSettings,
} from "@/db/schema";
import { getCalendarProvider } from "@/lib/calendar/provider";
import { addDays, daysInMonth, zonedTimeToUtc } from "@/lib/time";
import {
  bookingWindow,
  computeDaySlots,
  computeMonthAvailability,
  localRangeToUtc,
  type BookingRules,
  type SlotContext,
} from "./slots";
import { ACTIVE_BOOKING_STATUSES } from "./status";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Executor = Database | Tx;

export function rulesFor(settings: SiteSettings, service: Pick<Service, "durationMinutes">): BookingRules {
  return {
    timeZone: settings.timezone || "Europe/Paris",
    durationMinutes: service.durationMinutes || settings.defaultDurationMinutes,
    bufferMinutes: settings.bufferMinutes,
    slotIntervalMinutes: settings.slotIntervalMinutes,
    minNoticeHours: settings.minNoticeHours,
    maxAdvanceDays: settings.maxAdvanceDays,
  };
}

async function loadContext(
  db: Executor,
  rules: BookingRules,
  fromDate: string,
  toDate: string,
): Promise<SlotContext> {
  const range = localRangeToUtc(fromDate, toDate, rules.timeZone);
  const margin = rules.bufferMinutes * 60_000;
  const padded = { start: new Date(range.start.getTime() - margin), end: new Date(range.end.getTime() + margin) };

  const [weekly, blocked, busy, external] = await Promise.all([
    db.select().from(availabilityRules).orderBy(asc(availabilityRules.weekday)),
    db
      .select({ start: blockedPeriods.startsAt, end: blockedPeriods.endsAt })
      .from(blockedPeriods)
      .where(and(lt(blockedPeriods.startsAt, range.end), gt(blockedPeriods.endsAt, range.start))),
    db
      .select({ start: bookings.startsAt, end: bookings.endsAt })
      .from(bookings)
      .where(
        and(
          inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
          lt(bookings.startsAt, padded.end),
          gt(bookings.endsAt, padded.start),
        ),
      ),
    getCalendarProvider()
      .getBusyIntervals(padded)
      .catch(() => []),
  ]);

  return {
    ...rules,
    rules: weekly.map((r) => ({ weekday: r.weekday, startTime: r.startTime, endTime: r.endTime })),
    blocked,
    busy: [...busy, ...external],
    now: new Date(),
  };
}

async function loadSettingsAndService(db: Executor, serviceId: string) {
  const [[settings], [service]] = await Promise.all([
    db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1),
    db.select().from(services).where(eq(services.id, serviceId)).limit(1),
  ]);
  return { settings, service };
}

export function isServiceBookable(service: Service | undefined, settings: SiteSettings | undefined): boolean {
  return Boolean(
    service &&
      settings &&
      settings.bookingEnabled &&
      service.isActive &&
      service.bookingEnabled &&
      !service.isComingSoon,
  );
}

/** Days of a month with at least one free slot for a service. */
export async function getMonthAvailability(serviceId: string, year: number, month: number) {
  const db = getDb();
  const { settings, service } = await loadSettingsAndService(db, serviceId);
  if (!isServiceBookable(service, settings)) return null;
  const rules = rulesFor(settings, service);
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = `${year}-${String(month).padStart(2, "0")}-${daysInMonth(year, month)}`;
  const ctx = await loadContext(db, rules, first, last);
  const window = bookingWindow(ctx);
  return {
    days: computeMonthAvailability(year, month, ctx),
    firstDate: window.first,
    lastDate: window.last,
  };
}

/** Free start times for a service on a given local date. */
export async function getDaySlots(serviceId: string, date: string) {
  const db = getDb();
  const { settings, service } = await loadSettingsAndService(db, serviceId);
  if (!isServiceBookable(service, settings)) return null;
  const rules = rulesFor(settings, service);
  const ctx = await loadContext(db, rules, date, date);
  return { slots: computeDaySlots(date, ctx), durationMinutes: rules.durationMinutes };
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function generateReference(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  return `R-${s}`;
}

export class SlotUnavailableError extends Error {
  constructor() {
    super("Ce créneau n'est plus disponible.");
  }
}
export class ServiceUnavailableError extends Error {
  constructor() {
    super("Ce service ne peut pas être réservé en ligne pour le moment.");
  }
}

export interface NewBookingInput {
  serviceId: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  addressLine: string;
  postalCode: string;
  city: string;
  message: string;
}

/**
 * Creates a booking atomically:
 *  1. a per-day advisory lock serialises concurrent bookings for the same date;
 *  2. availability is recomputed inside the transaction;
 *  3. the `bookings_no_overlap` exclusion constraint is the final safety net.
 */
export async function createBooking(input: NewBookingInput): Promise<{ booking: Booking; settings: SiteSettings }> {
  const db = getDb();
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"booking:" + input.date}))`);
      const { settings, service } = await loadSettingsAndService(tx, input.serviceId);
      if (!isServiceBookable(service, settings)) throw new ServiceUnavailableError();
      const rules = rulesFor(settings, service);
      // Include the neighbouring days so buffers across midnight are respected.
      const ctx = await loadContext(tx, rules, addDays(input.date, -1), addDays(input.date, 1));
      if (!computeDaySlots(input.date, ctx).includes(input.time)) throw new SlotUnavailableError();

      const startsAt = zonedTimeToUtc(input.date, input.time, rules.timeZone);
      const endsAt = new Date(startsAt.getTime() + rules.durationMinutes * 60_000);
      const status = settings.bookingMode === "instant" ? "confirmed" : "pending";

      const [booking] = await tx
        .insert(bookings)
        .values({
          reference: generateReference(),
          serviceId: service.id,
          serviceTitle: service.title,
          status,
          startsAt,
          endsAt,
          firstName: input.firstName,
          lastName: input.lastName,
          company: input.company,
          email: input.email,
          phone: input.phone,
          addressLine: service.requiresAddress ? input.addressLine : "",
          postalCode: service.requiresAddress ? input.postalCode : "",
          city: service.requiresAddress ? input.city : "",
          message: input.message,
          consentAt: new Date(),
          statusChangedAt: new Date(),
        })
        .returning();
      return { booking, settings };
    });
  } catch (err) {
    if (isExclusionViolation(err)) throw new SlotUnavailableError();
    throw err;
  }
}

export function isExclusionViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23P01" || e?.cause?.code === "23P01";
}
