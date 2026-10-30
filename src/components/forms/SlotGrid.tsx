"use client";

import { formatVenueTime } from "@/lib/format";
import { FormError } from "./ContactFields";
import type { useAvailability } from "./useAvailability";

type Props = ReturnType<typeof useAvailability> & {
  selected: string | null;
  onSelect: (startAt: string) => void;
};

export function SlotGrid({ slots, isLoading, error, selected, onSelect }: Props) {
  if (isLoading) return <p className="py-6 text-sm text-muted" aria-live="polite">Checking tables…</p>;
  if (error) return <FormError message={error} />;
  if (slots.length === 0) {
    return <p className="py-6 text-sm text-muted">We&apos;re closed or fully booked that day. Try another date.</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {slots.map((slot) => {
        const isSelected = selected === slot.startAt;
        return (
          <button
            key={slot.startAt}
            type="button"
            disabled={!slot.available}
            aria-pressed={isSelected}
            onClick={() => onSelect(slot.startAt)}
            className={`min-h-12 border text-sm tabular-nums transition-colors disabled:cursor-not-allowed disabled:border-line/60 disabled:text-muted/40 disabled:line-through ${
              isSelected ? "border-ink bg-ink text-paper" : "border-line hover:border-ink"
            }`}
          >
            {formatVenueTime(slot.startAt)}
          </button>
        );
      })}
    </div>
  );
}
