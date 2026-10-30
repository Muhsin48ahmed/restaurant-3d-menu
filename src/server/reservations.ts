import { Prisma } from "@prisma/client";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { UserFacingError } from "@/lib/errors";
import { RESERVATION_RULES } from "@/lib/config";
import { isWithinBookingWindow, reservationSlotsForDate, toVenueDate } from "@/lib/domain/schedule";
import {
  ACTIVE_RESERVATION_STATUSES,
  canTransitionReservation,
  isReservationStatus,
  type ReservationStatus,
} from "@/lib/domain/status";
import { pickTable } from "@/lib/domain/tables";
import type { ReservationInput } from "@/lib/validation";
import { withUniqueCode } from "@/server/codes";

const RESERVATION_CODE_PREFIX = "RSV";
const ADMIN_RESERVATION_LIMIT = 200;
const MAX_SERIALIZATION_RETRIES = 3;
// Postgres reports a serialization failure as P2034; the booking is simply retried.
const SERIALIZATION_FAILURE = "P2034";

type Db = Pick<typeof prisma, "diningTable" | "reservation">;

function sittingWindow(startAt: Date) {
  return { startAt, endAt: addMinutes(startAt, RESERVATION_RULES.durationMinutes) };
}

async function activeBookingsBetween(db: Db, from: Date, to: Date) {
  return db.reservation.findMany({
    where: {
      status: { in: [...ACTIVE_RESERVATION_STATUSES] },
      startAt: { lt: to },
      endAt: { gt: from },
    },
    select: { tableId: true, startAt: true, endAt: true },
  });
}

export type SlotAvailability = { startAt: string; available: boolean };

export async function getAvailability(date: string, partySize: number, now = new Date()) {
  if (!isWithinBookingWindow(date, now)) return [];

  const slots = reservationSlotsForDate(date, { now });
  if (slots.length === 0) return [];

  const [tables, bookings] = await Promise.all([
    prisma.diningTable.findMany({ select: { id: true, seats: true } }),
    activeBookingsBetween(prisma, slots[0], sittingWindow(slots.at(-1)!).endAt),
  ]);

  return slots.map(
    (slot): SlotAvailability => ({
      startAt: slot.toISOString(),
      available: pickTable(tables, bookings, sittingWindow(slot), partySize) !== null,
    }),
  );
}

function assertBookableSlot(startAt: Date, now: Date) {
  const date = toVenueDate(startAt);
  const offered = isWithinBookingWindow(date, now)
    ? reservationSlotsForDate(date, { now }).some((slot) => slot.getTime() === startAt.getTime())
    : false;
  if (!offered) throw new UserFacingError("That time isn't bookable. Please choose another slot.");
}

async function assertUnderContactLimit(input: ReservationInput, now: Date) {
  const upcoming = await prisma.reservation.count({
    where: {
      status: { in: [...ACTIVE_RESERVATION_STATUSES] },
      endAt: { gt: now },
      OR: [{ email: input.email }, { phone: input.phone }],
    },
  });
  if (upcoming >= RESERVATION_RULES.maxActivePerContact) {
    throw new UserFacingError(
      `You already have ${upcoming} upcoming bookings. Call us to change one or add another.`,
      429,
    );
  }
}

export async function createReservation(input: ReservationInput, now = new Date()) {
  assertBookableSlot(input.startAt, now);
  await assertUnderContactLimit(input, now);
  const window = sittingWindow(input.startAt);

  // Check and insert in one serializable transaction so two guests can't take
  // the same table, on SQLite and on Postgres (where READ COMMITTED would allow it).
  return withUniqueCode(RESERVATION_CODE_PREFIX, (code) =>
    withSerializationRetry(() => prisma.$transaction(async (tx) => {
      const [tables, bookings] = await Promise.all([
        tx.diningTable.findMany({ select: { id: true, seats: true, label: true } }),
        activeBookingsBetween(tx, window.startAt, window.endAt),
      ]);
      const table = pickTable(tables, bookings, window, input.partySize);
      if (!table) throw new UserFacingError("Sorry, that time just filled up. Try another.", 409);

      return tx.reservation.create({
        data: {
          code,
          name: input.name,
          email: input.email,
          phone: input.phone,
          partySize: input.partySize,
          notes: input.notes,
          startAt: window.startAt,
          endAt: window.endAt,
          tableId: table.id,
        },
        include: { table: { select: { label: true } } },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })),
  );
}

async function withSerializationRetry<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      const isConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === SERIALIZATION_FAILURE;
      if (!isConflict || attempt >= MAX_SERIALIZATION_RETRIES) throw error;
    }
  }
}

export async function listReservationsForAdmin(now = new Date()) {
  return prisma.reservation.findMany({
    where: { endAt: { gte: now } },
    orderBy: { startAt: "asc" },
    include: { table: { select: { label: true, seats: true } } },
    take: ADMIN_RESERVATION_LIMIT,
  });
}

export async function updateReservationStatus(id: string, next: ReservationStatus) {
  const booking = await prisma.reservation.findUnique({ where: { id }, select: { status: true } });
  if (!booking) throw new UserFacingError("Reservation not found.", 404);
  if (!isReservationStatus(booking.status) || !canTransitionReservation(booking.status, next)) {
    throw new UserFacingError(`Can't move a booking from ${booking.status} to ${next}.`, 409);
  }
  return prisma.reservation.update({ where: { id }, data: { status: next } });
}
