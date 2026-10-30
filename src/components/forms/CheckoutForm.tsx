"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/client-api";
import { formatCalendarDate, formatVenueTime } from "@/lib/format";
import { useCart, useCartHydrated } from "@/stores/cart";
import { ContactFields, FormError } from "./ContactFields";
import { OrderSummary } from "./OrderSummary";
import { usePickupWindow, type PickupWindow } from "./usePickupWindow";

type Contact = { name: string; email: string; phone: string };

export function CheckoutForm() {
  const router = useRouter();
  const items = useCart((state) => state.items);
  const clear = useCart((state) => state.clear);
  const isHydrated = useCartHydrated();
  const pickup = usePickupWindow();

  const [contact, setContact] = useState<Contact>({ name: "", email: "", phone: "" });
  const [pickupAt, setPickupAt] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A time that dropped out of the refreshed list is no longer valid.
  const chosenPickup = pickup.window?.slots.includes(pickupAt) ? pickupAt : "";

  if (!isHydrated) return <div className="h-96 animate-pulse bg-paper-2" aria-busy="true" />;
  if (items.length === 0 && !isSubmitting) return <EmptyOrder />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const result = await apiRequest<{ code: string }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ customer: contact, pickupAt: chosenPickup, notes, items: items.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })) }),
    });
    if (result.success) {
      clear();
      router.push(`/order/${result.data.code}`);
      return;
    }
    setError(result.error);
    setIsSubmitting(false);
    // The chosen time may have expired while the form was open; offer fresh ones.
    pickup.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-16 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-7">
        <ContactFields values={contact} onChange={(field, value) => setContact((c) => ({ ...c, [field]: value }))} />
        <PickupSelect window={pickup.window} value={chosenPickup} onChange={setPickupAt} error={pickup.error} />
        <div>
          <label htmlFor="notes" className="label">Notes for the kitchen (optional)</label>
          <textarea id="notes" className="field min-h-20 resize-y" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <FormError message={error} />
      </div>
      <aside className="h-fit space-y-4 bg-paper-2 p-8 lg:col-span-5" aria-label="Order summary">
        <OrderSummary items={items} />
        <button type="submit" className="btn-primary mt-4 w-full" disabled={isSubmitting || !pickup.window}>
          {isSubmitting ? "Sending to the kitchen…" : "Place order"}
        </button>
        <p className="text-center text-xs text-muted">No card needed. Pay when you collect.</p>
      </aside>
    </form>
  );
}

type PickupSelectProps = { window: PickupWindow | undefined; value: string; onChange: (value: string) => void; error: string | null };

function PickupSelect({ window, value, onChange, error }: PickupSelectProps) {
  return (
    <div>
      <label htmlFor="pickup" className="label">
        Pickup time{window ? `: ${formatCalendarDate(window.date)}` : ""}
      </label>
      <select id="pickup" className="field" required value={value} onChange={(e) => onChange(e.target.value)} disabled={!window}>
        <option value="">{window === undefined ? "Loading times…" : "Choose a time"}</option>
        {window?.slots.map((slot) => (
          <option key={slot} value={slot}>{formatVenueTime(slot)}</option>
        ))}
      </select>
      {window === null && <p className="mt-2 text-sm text-danger">We&apos;re not taking pickup orders this week.</p>}
      <FormError message={error} />
    </div>
  );
}

function EmptyOrder() {
  return (
    <div className="border-y border-line py-20 text-center">
      <p className="text-muted">Your order is empty.</p>
      <Link href="/menu" className="btn-primary mt-8">Browse the menu</Link>
    </div>
  );
}
