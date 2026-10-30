import { describe, expect, test } from "vitest";
import { overlaps, pickTable } from "@/lib/domain/tables";

const at = (iso: string) => new Date(iso);
const window = { startAt: at("2026-11-03T18:00:00Z"), endAt: at("2026-11-03T19:30:00Z") };
const tables = [
  { id: "t8", seats: 8 },
  { id: "t2", seats: 2 },
  { id: "t4a", seats: 4 },
  { id: "t4b", seats: 4 },
];

describe("overlaps", () => {
  test("treats back-to-back bookings as not overlapping", () => {
    const later = { startAt: at("2026-11-03T19:30:00Z"), endAt: at("2026-11-03T21:00:00Z") };
    expect(overlaps(window, later)).toBe(false);
  });

  test("detects partial overlap", () => {
    const clash = { startAt: at("2026-11-03T19:00:00Z"), endAt: at("2026-11-03T20:30:00Z") };
    expect(overlaps(window, clash)).toBe(true);
  });
});

describe("pickTable", () => {
  test("picks the smallest table that fits the party", () => {
    expect(pickTable(tables, [], window, 3)?.id).toBe("t4a");
    expect(pickTable(tables, [], window, 2)?.id).toBe("t2");
  });

  test("skips tables already booked in the window", () => {
    const bookings = [{ tableId: "t4a", ...window }];
    expect(pickTable(tables, bookings, window, 4)?.id).toBe("t4b");
  });

  test("ignores bookings that do not overlap", () => {
    const earlier = {
      tableId: "t2",
      startAt: at("2026-11-03T16:30:00Z"),
      endAt: at("2026-11-03T18:00:00Z"),
    };
    expect(pickTable(tables, [earlier], window, 2)?.id).toBe("t2");
  });

  test("returns null when every fitting table is taken", () => {
    const bookings = [{ tableId: "t8", ...window }];
    expect(pickTable(tables, bookings, window, 6)).toBeNull();
  });

  test("does not reorder the caller's table list", () => {
    const original = tables.map((t) => t.id);
    pickTable(tables, [], window, 1);
    expect(tables.map((t) => t.id)).toEqual(original);
  });
});
