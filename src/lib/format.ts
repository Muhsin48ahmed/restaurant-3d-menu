import { RESTAURANT_TIMEZONE } from "@/lib/config";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

export function formatVenueTime(instant: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: RESTAURANT_TIMEZONE,
  }).format(new Date(instant));
}

export function formatVenueDate(instant: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: RESTAURANT_TIMEZONE,
  }).format(new Date(instant));
}

/** Formats a yyyy-MM-dd calendar date without shifting it through local time. */
export function formatCalendarDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
