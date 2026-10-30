import { describe, expect, test } from "vitest";
import {
  addCalendarDays,
  bookingWindow,
  hoursForDate,
  isDateString,
  isValidPickupTime,
  isWithinBookingWindow,
  nextPickupWindow,
  reservationSlotsForDate,
  toVenueDate,
  venueTime,
} from "@/lib/domain/schedule";

const TZ = "America/New_York";

describe("isDateString", () => {
  test("accepts real calendar dates", () => {
    expect(isDateString("2026-11-03")).toBe(true);
  });

  test("rejects impossible or malformed dates", () => {
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("2026-1-3")).toBe(false);
    expect(isDateString("tomorrow")).toBe(false);
  });
});

describe("venue time conversion", () => {
  test("interprets wall-clock time in the venue timezone", () => {
    // New York is UTC-5 in November.
    expect(venueTime("2026-11-03", "08:00", TZ).toISOString()).toBe("2026-11-03T13:00:00.000Z");
  });

  test("reports the venue's calendar date, not UTC's", () => {
    // 02:00 UTC on Nov 4 is still the evening of Nov 3 in New York.
    expect(toVenueDate(new Date("2026-11-04T02:00:00Z"), TZ)).toBe("2026-11-03");
  });

  test("treats Monday as closed", () => {
    expect(hoursForDate("2026-11-02")).toBeNull();
    expect(hoursForDate("2026-11-03")).toEqual({ open: "08:00", close: "22:00" });
  });
});

describe("reservationSlotsForDate", () => {
  const farPast = new Date("2026-01-01T00:00:00Z");

  test("returns no slots on a closed day", () => {
    expect(reservationSlotsForDate("2026-11-02", { now: farPast, timeZone: TZ })).toEqual([]);
  });

  test("runs every 30 minutes from opening to the last seating", () => {
    const slots = reservationSlotsForDate("2026-11-03", { now: farPast, timeZone: TZ });
    // 08:00 to 20:30 inclusive (22:00 close minus 90 minute sitting).
    expect(slots).toHaveLength(26);
    expect(slots[0].toISOString()).toBe("2026-11-03T13:00:00.000Z");
    expect(slots.at(-1)?.toISOString()).toBe("2026-11-04T01:30:00.000Z");
  });

  test("drops slots inside the one-hour booking lead time", () => {
    const now = new Date("2026-11-03T15:10:00Z"); // 10:10 in New York
    const slots = reservationSlotsForDate("2026-11-03", { now, timeZone: TZ });
    expect(slots[0].toISOString()).toBe("2026-11-03T16:30:00.000Z"); // 11:30
  });
});

describe("isWithinBookingWindow", () => {
  const now = new Date("2026-11-03T15:00:00Z");

  test("allows today through 60 days ahead", () => {
    expect(isWithinBookingWindow("2026-11-03", now, TZ)).toBe(true);
    expect(isWithinBookingWindow("2027-01-02", now, TZ)).toBe(true);
  });

  test("rejects past days and days too far out", () => {
    expect(isWithinBookingWindow("2026-11-02", now, TZ)).toBe(false);
    expect(isWithinBookingWindow("2027-01-03", now, TZ)).toBe(false);
  });
});

describe("nextPickupWindow", () => {
  test("starts 20 minutes out, rounded up to the next 15-minute mark", () => {
    const now = new Date("2026-11-03T15:07:00Z"); // 10:07 in New York
    const window = nextPickupWindow({ now, timeZone: TZ });
    expect(window?.date).toBe("2026-11-03");
    expect(window?.slots[0].toISOString()).toBe("2026-11-03T15:30:00.000Z");
    expect(window?.slots.at(-1)?.toISOString()).toBe("2026-11-04T02:45:00.000Z"); // 21:45
  });

  test("rolls over to the next open day after closing", () => {
    // Sunday 20:50 in New York; Monday is closed, so Tuesday opens at 08:00.
    const now = new Date("2026-11-02T01:50:00Z");
    const window = nextPickupWindow({ now, timeZone: TZ });
    expect(window?.date).toBe("2026-11-03");
    expect(window?.slots[0].toISOString()).toBe("2026-11-03T13:00:00.000Z");
  });

  test("returns null when the venue is closed all week", () => {
    const closed = { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null };
    expect(nextPickupWindow({ now: new Date(), hours: closed })).toBeNull();
  });
});

describe("isValidPickupTime", () => {
  const now = new Date("2026-11-03T15:07:00Z");

  test("accepts an offered slot", () => {
    expect(isValidPickupTime(new Date("2026-11-03T16:00:00Z"), now, TZ)).toBe(true);
  });

  test("rejects off-grid and too-early times", () => {
    expect(isValidPickupTime(new Date("2026-11-03T16:05:00Z"), now, TZ)).toBe(false);
    expect(isValidPickupTime(new Date("2026-11-03T15:15:00Z"), now, TZ)).toBe(false);
  });
});

describe("calendar arithmetic across DST", () => {
  test("steps one calendar day at a time over the spring-forward weekend", () => {
    expect(addCalendarDays("2026-03-07", 1)).toBe("2026-03-08");
    expect(addCalendarDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addCalendarDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  test("offers Sunday pickups on the night before clocks change", () => {
    // Saturday 23:30 in New York, 8 March 2026 is the spring-forward Sunday.
    const now = new Date("2026-03-08T04:30:00Z");
    expect(nextPickupWindow({ now, timeZone: TZ })?.date).toBe("2026-03-08");
  });

  test("slots on the spring-forward day still start at local opening time", () => {
    const slots = reservationSlotsForDate("2026-03-08", { now: new Date("2026-01-01T00:00:00Z"), timeZone: TZ });
    // Sunday opens 09:00 EDT (UTC-4) after the change.
    expect(slots[0].toISOString()).toBe("2026-03-08T13:00:00.000Z");
  });

  test("booking window runs from the venue's today for 60 days", () => {
    expect(bookingWindow(new Date("2026-11-04T02:00:00Z"), TZ)).toEqual({
      today: "2026-11-03",
      lastDay: "2027-01-02",
    });
  });
});
