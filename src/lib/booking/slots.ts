/**
 * Pure slot computation (no I/O) — easy to unit-test and reusable if a calendar
 * provider (e.g. Google Calendar) later contributes additional busy intervals.
 */
import {
  addDays,
  daysInMonth,
  minutesToTime,
  timeToMinutes,
  toDateString,
  weekdayOf,
  zonedTimeToUtc,
} from "@/lib/time";

export interface Interval {
  start: Date;
  end: Date;
}

export interface WeeklyRule {
  weekday: number; // 1..7
  startTime: string; // HH:mm or HH:mm:ss
  endTime: string;
}

export interface BookingRules {
  timeZone: string;
  durationMinutes: number;
  bufferMinutes: number;
  slotIntervalMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
}

export interface SlotContext extends BookingRules {
  rules: WeeklyRule[];
  /** Closures (holidays, blocked dates or periods). Slots may not overlap them. */
  blocked: Interval[];
  /** Existing bookings / external events. Slots must keep `bufferMinutes` around them. */
  busy: Interval[];
  now: Date;
}

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/** First and last bookable calendar dates (inclusive) given the notice/advance rules. */
export function bookingWindow(ctx: Pick<SlotContext, "now" | "timeZone" | "minNoticeHours" | "maxAdvanceDays">) {
  const earliest = new Date(ctx.now.getTime() + ctx.minNoticeHours * 3_600_000);
  const first = toDateString(earliest, ctx.timeZone);
  const last = addDays(toDateString(ctx.now, ctx.timeZone), ctx.maxAdvanceDays);
  return { earliest, first, last };
}

/** Returns the available start times (HH:mm, local) for a given date. */
export function computeDaySlots(dateStr: string, ctx: SlotContext): string[] {
  const { earliest, first, last } = bookingWindow(ctx);
  if (dateStr < first || dateStr > last) return [];

  const weekday = weekdayOf(dateStr);
  const dayRules = ctx.rules
    .filter((r) => r.weekday === weekday)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  if (!dayRules.length) return [];

  const step = Math.max(5, ctx.slotIntervalMinutes);
  const bufferMs = ctx.bufferMinutes * 60_000;
  const result = new Set<string>();

  for (const rule of dayRules) {
    const open = timeToMinutes(rule.startTime.slice(0, 5));
    const close = timeToMinutes(rule.endTime.slice(0, 5));
    for (let m = open; m + ctx.durationMinutes <= close; m += step) {
      const time = minutesToTime(m);
      const start = zonedTimeToUtc(dateStr, time, ctx.timeZone);
      const end = new Date(start.getTime() + ctx.durationMinutes * 60_000);
      if (start < earliest) continue;
      const slot = { start, end };
      if (ctx.blocked.some((b) => overlaps(slot, b))) continue;
      const padded = { start: new Date(start.getTime() - bufferMs), end: new Date(end.getTime() + bufferMs) };
      if (ctx.busy.some((b) => overlaps(padded, b))) continue;
      result.add(time);
    }
  }
  return [...result].sort();
}

/** For each day of the month, whether at least one slot is available. */
export function computeMonthAvailability(year: number, month: number, ctx: SlotContext) {
  const days: { date: string; available: boolean }[] = [];
  const total = daysInMonth(year, month);
  for (let d = 1; d <= total; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ date, available: computeDaySlots(date, ctx).length > 0 });
  }
  return days;
}

/** UTC range covering a whole local calendar date range [fromDate, toDate] inclusive. */
export function localRangeToUtc(fromDate: string, toDate: string, timeZone: string): Interval {
  return {
    start: zonedTimeToUtc(fromDate, "00:00", timeZone),
    end: zonedTimeToUtc(addDays(toDate, 1), "00:00", timeZone),
  };
}
