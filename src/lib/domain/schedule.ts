import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import {
  OPENING_HOURS,
  ORDER_LIMITS,
  RESERVATION_RULES,
  RESTAURANT_TIMEZONE,
  type DayHours,
} from "@/lib/config";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

/** Calendar date (yyyy-MM-dd) of an instant, in the restaurant's timezone. */
export function toVenueDate(instant: Date, timeZone = RESTAURANT_TIMEZONE): string {
  return formatInTimeZone(instant, timeZone, "yyyy-MM-dd");
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Adds days to a yyyy-MM-dd calendar date. Works on the date itself, so the
 * server's timezone and DST changes can never skip or repeat a day.
 */
export function addCalendarDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

export function hoursForDate(date: string, hours = OPENING_HOURS): DayHours {
  // The weekday of a calendar date does not depend on timezone.
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return hours[weekday] ?? null;
}

/** Converts a wall-clock time at the venue into a UTC instant. */
export function venueTime(date: string, time: string, timeZone = RESTAURANT_TIMEZONE): Date {
  return fromZonedTime(`${date}T${time}:00`, timeZone);
}

function buildSlots(start: Date, lastStart: Date, stepMinutes: number): Date[] {
  const slots: Date[] = [];
  for (let slot = start; slot <= lastStart; slot = addMinutes(slot, stepMinutes)) {
    slots.push(slot);
  }
  return slots;
}

function ceilToStep(instant: Date, stepMinutes: number): Date {
  const stepMs = stepMinutes * 60_000;
  return new Date(Math.ceil(instant.getTime() / stepMs) * stepMs);
}

type SlotOptions = { now: Date; timeZone?: string; hours?: typeof OPENING_HOURS };

/** Reservation start times for a date, excluding ones too soon to book. */
export function reservationSlotsForDate(date: string, options: SlotOptions): Date[] {
  const { now, timeZone = RESTAURANT_TIMEZONE, hours = OPENING_HOURS } = options;
  const dayHours = hoursForDate(date, hours);
  if (!dayHours) return [];

  const open = venueTime(date, dayHours.open, timeZone);
  const close = venueTime(date, dayHours.close, timeZone);
  const lastSeating = addMinutes(close, -RESERVATION_RULES.durationMinutes);
  const earliest = addMinutes(now, RESERVATION_RULES.minLeadMinutes);

  return buildSlots(open, lastSeating, RESERVATION_RULES.slotMinutes).filter(
    (slot) => slot >= earliest,
  );
}

/** First and last bookable calendar dates at the venue. */
export function bookingWindow(now: Date, timeZone = RESTAURANT_TIMEZONE) {
  const today = toVenueDate(now, timeZone);
  return { today, lastDay: addCalendarDays(today, RESERVATION_RULES.maxDaysAhead) };
}

export function isWithinBookingWindow(date: string, now: Date, timeZone = RESTAURANT_TIMEZONE) {
  const { today, lastDay } = bookingWindow(now, timeZone);
  return date >= today && date <= lastDay;
}

export type PickupWindow = { date: string; slots: Date[] };

/** Pickup times on the first day (from today) that still has any left. */
export function nextPickupWindow(options: SlotOptions): PickupWindow | null {
  const { now, timeZone = RESTAURANT_TIMEZONE, hours = OPENING_HOURS } = options;
  const earliest = ceilToStep(
    addMinutes(now, ORDER_LIMITS.pickupLeadMinutes),
    ORDER_LIMITS.pickupSlotMinutes,
  );

  const today = toVenueDate(now, timeZone);
  for (let offset = 0; offset < ORDER_LIMITS.pickupSearchDays; offset += 1) {
    const date = addCalendarDays(today, offset);
    const dayHours = hoursForDate(date, hours);
    if (!dayHours) continue;

    const open = venueTime(date, dayHours.open, timeZone);
    const close = venueTime(date, dayHours.close, timeZone);
    const lastPickup = addMinutes(close, -ORDER_LIMITS.pickupSlotMinutes);
    const first = open > earliest ? open : earliest;
    const slots = buildSlots(first, lastPickup, ORDER_LIMITS.pickupSlotMinutes);
    if (slots.length > 0) return { date, slots };
  }
  return null;
}

export function isValidPickupTime(pickupAt: Date, now: Date, timeZone = RESTAURANT_TIMEZONE) {
  const window = nextPickupWindow({ now, timeZone });
  return window?.slots.some((slot) => slot.getTime() === pickupAt.getTime()) ?? false;
}
