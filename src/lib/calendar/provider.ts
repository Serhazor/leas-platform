/**
 * Calendar synchronisation extension point.
 *
 * Version 1 uses the built-in availability rules only (`NoopCalendarProvider`).
 * A future Google Calendar integration can implement this interface:
 *  - `getBusyIntervals` feeds external events into slot computation;
 *  - `onBookingChanged` creates/updates/deletes the matching external event and
 *    stores its id in `bookings.external_calendar_event_id`.
 */
import type { Booking } from "@/db/schema";
import type { Interval } from "@/lib/booking/slots";

export interface CalendarProvider {
  readonly name: string;
  getBusyIntervals(range: Interval): Promise<Interval[]>;
  onBookingChanged(booking: Booking): Promise<{ externalEventId?: string | null } | void>;
}

class NoopCalendarProvider implements CalendarProvider {
  readonly name = "aucun";
  async getBusyIntervals(): Promise<Interval[]> {
    return [];
  }
  async onBookingChanged(): Promise<void> {}
}

let provider: CalendarProvider = new NoopCalendarProvider();

export function getCalendarProvider(): CalendarProvider {
  return provider;
}

/** Allows registering another provider (e.g. from instrumentation) without touching callers. */
export function setCalendarProvider(next: CalendarProvider) {
  provider = next;
}
