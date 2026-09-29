import { describe, expect, it } from "vitest";
import { computeDaySlots, computeMonthAvailability, type SlotContext } from "./slots";
import { formatDate, formatTime, toDateString, zonedTimeToUtc } from "@/lib/time";

const TZ = "Europe/Paris";

function ctx(overrides: Partial<SlotContext> = {}): SlotContext {
  return {
    timeZone: TZ,
    durationMinutes: 60,
    bufferMinutes: 30,
    slotIntervalMinutes: 30,
    minNoticeHours: 24,
    maxAdvanceDays: 60,
    rules: [
      { weekday: 1, startTime: "09:00:00", endTime: "12:00:00" },
      { weekday: 4, startTime: "10:00", endTime: "12:00" },
    ],
    blocked: [],
    busy: [],
    // Wednesday 30 September 2026, 10:00 Paris time
    now: zonedTimeToUtc("2026-09-30", "10:00", TZ),
    ...overrides,
  };
}

describe("time helpers", () => {
  it("converts Paris wall-clock time to UTC across DST", () => {
    expect(zonedTimeToUtc("2026-07-01", "09:00", TZ).toISOString()).toBe("2026-07-01T07:00:00.000Z");
    expect(zonedTimeToUtc("2026-12-01", "09:00", TZ).toISOString()).toBe("2026-12-01T08:00:00.000Z");
    // DST ends on 25 October 2026
    expect(zonedTimeToUtc("2026-10-26", "09:00", TZ).toISOString()).toBe("2026-10-26T08:00:00.000Z");
  });

  it("formats dates the French way", () => {
    const d = new Date("2026-10-05T07:30:00Z");
    expect(formatDate(d, TZ)).toBe("05/10/2026");
    expect(formatTime(d, TZ)).toBe("09:30");
    expect(toDateString(d, TZ)).toBe("2026-10-05");
  });
});

describe("computeDaySlots", () => {
  it("lists slots within opening hours", () => {
    // Monday 5 October 2026
    expect(computeDaySlots("2026-10-05", ctx())).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
  });

  it("returns nothing on closed days", () => {
    expect(computeDaySlots("2026-10-06", ctx())).toEqual([]); // Tuesday
  });

  it("respects the minimum notice", () => {
    // Thursday 1 October: now + 24h = 1 Oct 10:00
    expect(computeDaySlots("2026-10-01", ctx())).toEqual(["10:00", "10:30", "11:00"]);
    expect(computeDaySlots("2026-10-01", ctx({ minNoticeHours: 25 }))).toEqual(["11:00"]);
  });

  it("respects the maximum advance period", () => {
    expect(computeDaySlots("2026-10-05", ctx({ maxAdvanceDays: 3 }))).toEqual([]);
  });

  it("keeps a buffer around existing bookings", () => {
    const busy = [
      { start: zonedTimeToUtc("2026-10-05", "10:00", TZ), end: zonedTimeToUtc("2026-10-05", "11:00", TZ) },
    ];
    // 09:00–10:00 + 30 min buffer overlaps => excluded; 11:30 would end 12:30 > close
    expect(computeDaySlots("2026-10-05", ctx({ busy }))).toEqual([]);
    expect(computeDaySlots("2026-10-05", ctx({ busy, bufferMinutes: 0 }))).toEqual(["09:00", "11:00"]);
  });

  it("excludes blocked periods", () => {
    const blocked = [
      { start: zonedTimeToUtc("2026-10-05", "00:00", TZ), end: zonedTimeToUtc("2026-10-06", "00:00", TZ) },
    ];
    expect(computeDaySlots("2026-10-05", ctx({ blocked }))).toEqual([]);
  });

  it("supports per-service durations", () => {
    expect(computeDaySlots("2026-10-05", ctx({ durationMinutes: 150 }))).toEqual(["09:00", "09:30"]);
  });
});

describe("computeMonthAvailability", () => {
  it("flags available days", () => {
    const days = computeMonthAvailability(2026, 10, ctx());
    expect(days).toHaveLength(31);
    const available = days.filter((d) => d.available).map((d) => d.date);
    expect(available[0]).toBe("2026-10-01");
    expect(available).toContain("2026-10-05");
    expect(available).not.toContain("2026-10-06");
  });
});
