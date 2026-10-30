"use client";

import { useState, type FormEvent } from "react";
import { RESERVATION_RULES } from "@/lib/config";
import { apiRequest } from "@/lib/client-api";
import { formatCalendarDate, formatVenueDate, formatVenueTime } from "@/lib/format";
import { ContactFields, FormError } from "./ContactFields";
import { SlotGrid } from "./SlotGrid";
import { useAvailability } from "./useAvailability";

type Confirmation = { code: string; startAt: string; partySize: number; name: string };
type Props = { today: string; lastDay: string };

const PARTY_SIZES = Array.from({ length: RESERVATION_RULES.maxPartySize }, (_, i) => i + 1);
const HTTP_CONFLICT = 409;

export function ReservationForm({ today, lastDay }: Props) {
  const [date, setDate] = useState(today);
  const [partySize, setPartySize] = useState(2);
  const [startAt, setStartAt] = useState<string | null>(null);
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const availability = useAvailability(date, partySize, refreshKey);

  if (confirmation) return <ReservationConfirmed confirmation={confirmation} />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!startAt) return setError("Please pick a time.");
    setError(null);
    setIsSubmitting(true);
    const result = await apiRequest<Confirmation>("/api/reservations", {
      method: "POST",
      body: JSON.stringify({ ...contact, partySize, startAt, notes }),
    });
    setIsSubmitting(false);
    if (result.success) return setConfirmation(result.data);
    setError(result.error);
    // Only a conflict means the table went; other errors keep the chosen time.
    if (result.status === HTTP_CONFLICT) {
      setStartAt(null);
      setRefreshKey((key) => key + 1);
    }
  };

  const resetSlot = () => setStartAt(null);

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <div>
          <label htmlFor="party" className="label">Guests</label>
          <select id="party" className="field" value={partySize} onChange={(e) => { setPartySize(Number(e.target.value)); resetSlot(); }}>
            {PARTY_SIZES.map((size) => (
              <option key={size} value={size}>{size} {size === 1 ? "guest" : "guests"}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="label">Date</label>
          <input id="date" type="date" className="field" min={today} max={lastDay} required value={date}
            onChange={(e) => { setDate(e.target.value || today); resetSlot(); }} />
        </div>
      </div>

      <fieldset>
        <legend className="label mb-4">Time on {formatCalendarDate(date)}</legend>
        <SlotGrid {...availability} selected={startAt} onSelect={setStartAt} />
      </fieldset>

      {startAt && (
        <div className="space-y-6">
          <ContactFields values={contact} onChange={(field, value) => setContact((c) => ({ ...c, [field]: value }))} />
          <div>
            <label htmlFor="res-notes" className="label">Occasion or dietary needs (optional)</label>
            <textarea id="res-notes" className="field min-h-16 resize-y" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      )}

      <FormError message={error} />
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!startAt || isSubmitting}>
        {isSubmitting ? "Booking…" : startAt ? `Book ${formatVenueTime(startAt)} for ${partySize}` : "Choose a time"}
      </button>
    </form>
  );
}

function ReservationConfirmed({ confirmation }: { confirmation: Confirmation }) {
  return (
    <div className="border-y border-ink py-16 text-center" role="status">
      <p className="eyebrow">Confirmed · {confirmation.code}</p>
      <h2 className="display mt-6 text-5xl">See you soon, {confirmation.name.split(" ")[0]}.</h2>
      <p className="mx-auto mt-6 max-w-md leading-relaxed text-ink-soft">
        A table for {confirmation.partySize} on {formatVenueDate(confirmation.startAt)} at{" "}
        <strong className="font-semibold text-ink">{formatVenueTime(confirmation.startAt)}</strong>. Quote your code if
        you need to change anything.
      </p>
    </div>
  );
}
