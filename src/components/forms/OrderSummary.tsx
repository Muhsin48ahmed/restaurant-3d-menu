import { formatPrice } from "@/lib/format";
import { cartTotals, type CartItem } from "@/stores/cart";

export function OrderSummary({ items }: { items: CartItem[] }) {
  const totals = cartTotals(items);
  return (
    <>
      <h2 className="display border-b border-ink pb-4 text-3xl">Summary</h2>
      <ul className="divide-y divide-line text-sm">
        {items.map((line) => (
          <li key={line.menuItemId} className="flex justify-between gap-3 py-3">
            <span>
              <span className="text-muted tabular-nums">{line.quantity} ×</span> {line.name}
            </span>
            <span className="tabular-nums">{formatPrice(line.priceCents * line.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="space-y-1.5 border-t border-line pt-4 text-sm text-muted">
        <p className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{formatPrice(totals.subtotalCents)}</span></p>
        <p className="flex justify-between"><span>Tax</span><span className="tabular-nums">{formatPrice(totals.taxCents)}</span></p>
        <p className="flex justify-between pt-2 text-base font-semibold text-ink">
          <span>Due at pickup</span><span className="tabular-nums">{formatPrice(totals.totalCents)}</span>
        </p>
      </div>
    </>
  );
}
