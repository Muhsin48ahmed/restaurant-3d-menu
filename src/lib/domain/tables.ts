export type TableLike = { id: string; seats: number };
export type BookingLike = { tableId: string; startAt: Date; endAt: Date };

export function overlaps(a: { startAt: Date; endAt: Date }, b: { startAt: Date; endAt: Date }) {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

/**
 * Chooses the smallest free table that fits the party, so large tables stay
 * open for large groups. Returns null when nothing fits.
 */
export function pickTable<T extends TableLike>(
  tables: readonly T[],
  bookings: readonly BookingLike[],
  window: { startAt: Date; endAt: Date },
  partySize: number,
): T | null {
  const busyTableIds = new Set(
    bookings.filter((booking) => overlaps(booking, window)).map((booking) => booking.tableId),
  );

  const candidates = tables
    .filter((table) => table.seats >= partySize && !busyTableIds.has(table.id))
    .toSorted((a, b) => a.seats - b.seats);

  return candidates[0] ?? null;
}
