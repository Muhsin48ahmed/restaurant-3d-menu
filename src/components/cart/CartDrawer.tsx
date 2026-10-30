"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ORDER_LIMITS } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { cartTotals, useCart } from "@/stores/cart";
import { QuantityStepper } from "./QuantityStepper";

export function CartButton() {
  const items = useCart((state) => state.items);
  const setOpen = useCart((state) => state.setOpen);
  const { count } = cartTotals(items);

  return (
    <button
      type="button"
      className="flex min-h-11 items-center gap-2 border border-ink/25 px-4 text-[0.68rem] font-semibold tracking-[var(--tracking-label)] uppercase transition-colors hover:border-ink hover:bg-ink hover:text-paper"
      onClick={() => setOpen(true)}
      aria-label={`Your order, ${count} ${count === 1 ? "item" : "items"}`}
    >
      Order
      <span className="tabular-nums">({count})</span>
    </button>
  );
}

export function CartDrawer() {
  const { items, isOpen, setOpen, setQuantity } = useCart();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const totals = cartTotals(items);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={() => setOpen(false)}
      onClick={(event) => event.target === dialogRef.current && setOpen(false)}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-paper text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
      aria-labelledby="cart-title"
    >
      <div className="flex h-full flex-col px-8 py-8">
        <div className="flex items-center justify-between border-b border-ink pb-5">
          <h2 id="cart-title" className="display text-4xl">Your order</h2>
          <button type="button" className="link-underline" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-10 leading-relaxed text-muted">Nothing here yet. Choose something warm from the menu.</p>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {items.map((line) => (
              <li key={line.menuItemId} className="flex items-center justify-between gap-4 border-b border-line py-5">
                <div className="min-w-0">
                  <p className="font-display text-xl leading-tight">{line.name}</p>
                  <p className="mt-1 text-sm text-muted tabular-nums">{formatPrice(line.priceCents * line.quantity)}</p>
                </div>
                <QuantityStepper
                  value={line.quantity}
                  max={ORDER_LIMITS.maxQuantityPerLine}
                  onChange={(value) => setQuantity(line.menuItemId, value)}
                  label={`quantity of ${line.name}`}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto space-y-2 pt-6 text-sm">
          <Row label="Subtotal" value={formatPrice(totals.subtotalCents)} />
          <Row label="Tax (est.)" value={formatPrice(totals.taxCents)} />
          <Row label="Total" value={formatPrice(totals.totalCents)} strong />
          <Link
            href="/checkout"
            className={`btn-primary mt-6 w-full ${items.length === 0 ? "pointer-events-none opacity-40" : ""}`}
            aria-disabled={items.length === 0}
            onClick={() => setOpen(false)}
          >
            Checkout: pay at pickup
          </Link>
        </div>
      </div>
    </dialog>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "border-t border-line pt-3 text-base font-semibold" : "text-muted"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
