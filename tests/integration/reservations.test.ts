import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { createReservation, getAvailability, updateReservationStatus } from "@/server/reservations";
import { resetAndSeed } from "./helpers";

const NOW = new Date("2026-11-03T15:00:00Z"); // Tuesday 10:00 in New York
const DATE = "2026-11-04";
const SEVEN_PM = new Date("2026-11-05T00:00:00Z"); // Wed 19:00 in New York

const guest = (partySize: number) => ({
  name: "Grace Hopper",
  email: "grace@example.com",
  phone: "7185550100",
  partySize,
  notes: "",
  startAt: SEVEN_PM,
});

beforeEach(resetAndSeed);
afterAll(() => prisma.$disconnect());

describe("getAvailability", () => {
  test("offers every slot on an empty evening", async () => {
    const slots = await getAvailability(DATE, 2, NOW);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((slot) => slot.available)).toBe(true);
  });

  test("returns nothing on a closed Monday", async () => {
    expect(await getAvailability("2026-11-09", 2, NOW)).toEqual([]);
  });

  test("marks a slot full once the only big table is taken", async () => {
    await createReservation(guest(8), NOW);
    const slots = await getAvailability(DATE, 7, NOW);
    const sevenPm = slots.find((slot) => slot.startAt === SEVEN_PM.toISOString());
    expect(sevenPm?.available).toBe(false);
  });
});

describe("createReservation", () => {
  test("seats a couple at a two-top", async () => {
    const reservation = await createReservation(guest(2), NOW);
    expect(reservation.code).toMatch(/^RSV-/);
    expect(reservation.table.label).toMatch(/^Window/);
    expect(reservation.endAt.getTime() - reservation.startAt.getTime()).toBe(90 * 60_000);
  });

  test("refuses a second booking when no table fits", async () => {
    await createReservation(guest(8), NOW);
    await expect(createReservation(guest(8), NOW)).rejects.toThrow(/filled up/);
  });

  test("frees the table again after a cancellation", async () => {
    const first = await createReservation(guest(8), NOW);
    await updateReservationStatus(first.id, "CANCELLED");
    await expect(createReservation(guest(8), NOW)).resolves.toBeDefined();
  });

  test("never revives a cancelled booking", async () => {
    const booking = await createReservation(guest(2), NOW);
    await updateReservationStatus(booking.id, "CANCELLED");
    await expect(updateReservationStatus(booking.id, "CONFIRMED")).rejects.toThrow(/Can't move/);
  });

  test("limits upcoming bookings per contact", async () => {
    await createReservation(guest(2), NOW);
    await createReservation({ ...guest(2), startAt: new Date("2026-11-05T01:00:00Z") }, NOW);
    const third = createReservation({ ...guest(2), startAt: new Date("2026-11-04T23:00:00Z") }, NOW);
    await expect(third).rejects.toThrow(/upcoming bookings/);
  });

  test("rejects times that are not on the slot grid", async () => {
    const offGrid = { ...guest(2), startAt: new Date("2026-11-05T00:10:00Z") };
    await expect(createReservation(offGrid, NOW)).rejects.toThrow(/isn't bookable/);
  });
});
