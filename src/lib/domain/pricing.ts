import { ORDER_LIMITS, TAX_RATE } from "@/lib/config";

export type PricedMenuItem = {
  id: string;
  name: string;
  priceCents: number;
  isAvailable: boolean;
};

export type CartLine = { menuItemId: string; quantity: number };

export type PricedLine = {
  menuItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export type OrderTotals = {
  lines: PricedLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

export class PricingError extends Error {}

/** Folds repeated menu items into one line each, keeping first-seen order. */
export function mergeLines(lines: readonly CartLine[]): CartLine[] {
  const totals = lines.reduce(
    (acc, line) => acc.set(line.menuItemId, (acc.get(line.menuItemId) ?? 0) + line.quantity),
    new Map<string, number>(),
  );
  return [...totals].map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
}

/**
 * Prices a cart from server-side menu data. Client-sent prices are never
 * trusted; only item ids and quantities come from the request.
 */
export function priceOrder(
  lines: readonly CartLine[],
  menu: readonly PricedMenuItem[],
  taxRate = TAX_RATE,
): OrderTotals {
  const byId = new Map(menu.map((item) => [item.id, item]));

  const priced = mergeLines(lines).map((line): PricedLine => {
    const item = byId.get(line.menuItemId);
    if (!item) throw new PricingError("One of the items is no longer on the menu.");
    if (!item.isAvailable) throw new PricingError(`${item.name} is sold out right now.`);
    if (line.quantity > ORDER_LIMITS.maxQuantityPerLine) {
      throw new PricingError(`You can order at most ${ORDER_LIMITS.maxQuantityPerLine} of ${item.name}.`);
    }
    return {
      menuItemId: item.id,
      name: item.name,
      unitPriceCents: item.priceCents,
      quantity: line.quantity,
    };
  });

  const subtotalCents = priced.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const taxCents = Math.round(subtotalCents * taxRate);
  return { lines: priced, subtotalCents, taxCents, totalCents: subtotalCents + taxCents };
}
