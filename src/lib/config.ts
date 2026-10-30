// Business rules for the restaurant. Change these to fit a real venue.

export const RESTAURANT = {
  name: "Ember & Oak",
  tagline: "Bakery & Café",
  neighbourhood: "Carroll Gardens, Brooklyn",
  established: 2014,
  address: "214 Hearth Street, Brooklyn, NY 11231",
  phone: "(718) 555-0142",
  email: "hello@emberandoak.example",
  instagram: "@emberandoak",
} as const;

export const RESTAURANT_TIMEZONE = process.env.NEXT_PUBLIC_RESTAURANT_TIMEZONE ?? "America/New_York";

export type DayHours = { open: string; close: string } | null;

// Keyed by weekday: 0 = Sunday … 6 = Saturday. null = closed.
export const OPENING_HOURS: Readonly<Record<number, DayHours>> = {
  0: { open: "09:00", close: "21:00" },
  1: null,
  2: { open: "08:00", close: "22:00" },
  3: { open: "08:00", close: "22:00" },
  4: { open: "08:00", close: "22:00" },
  5: { open: "08:00", close: "23:00" },
  6: { open: "09:00", close: "23:00" },
};

export const TAX_RATE = 0.08875;

export const ORDER_LIMITS = {
  maxLines: 30,
  maxQuantityPerLine: 20,
  // Kitchen needs this long before the first pickup slot.
  pickupLeadMinutes: 20,
  pickupSlotMinutes: 15,
  // How many days ahead to search for the next open pickup day.
  pickupSearchDays: 7,
  // Open (not yet picked up) orders allowed per email or phone.
  maxOpenOrdersPerContact: 3,
} as const;

export const RESERVATION_RULES = {
  slotMinutes: 30,
  durationMinutes: 90,
  maxPartySize: 8,
  minLeadMinutes: 60,
  maxDaysAhead: 60,
  // Upcoming bookings allowed per email or phone, so one person can't hoard tables.
  maxActivePerContact: 2,
} as const;

export const ADMIN_SESSION = {
  cookieName: "eo_admin",
  ttlSeconds: 60 * 60 * 8,
} as const;
