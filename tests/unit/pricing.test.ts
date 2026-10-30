import { describe, expect, test } from "vitest";
import { mergeLines, priceOrder, PricingError } from "@/lib/domain/pricing";

const menu = [
  { id: "burger", name: "Smash Burger", priceCents: 1600, isAvailable: true },
  { id: "latte", name: "Latte", priceCents: 550, isAvailable: true },
  { id: "cake", name: "Cheesecake", priceCents: 900, isAvailable: false },
];

describe("mergeLines", () => {
  test("combines repeated items and keeps first-seen order", () => {
    const merged = mergeLines([
      { menuItemId: "latte", quantity: 1 },
      { menuItemId: "burger", quantity: 2 },
      { menuItemId: "latte", quantity: 3 },
    ]);
    expect(merged).toEqual([
      { menuItemId: "latte", quantity: 4 },
      { menuItemId: "burger", quantity: 2 },
    ]);
  });
});

describe("priceOrder", () => {
  test("totals subtotal and rounded tax from server prices", () => {
    const totals = priceOrder(
      [
        { menuItemId: "burger", quantity: 2 },
        { menuItemId: "latte", quantity: 1 },
      ],
      menu,
      0.08875,
    );
    expect(totals.subtotalCents).toBe(3750);
    expect(totals.taxCents).toBe(333); // 332.8 rounds up
    expect(totals.totalCents).toBe(4083);
    expect(totals.lines[0]).toEqual({
      menuItemId: "burger",
      name: "Smash Burger",
      unitPriceCents: 1600,
      quantity: 2,
    });
  });

  test("rejects items that are not on the menu", () => {
    expect(() => priceOrder([{ menuItemId: "ghost", quantity: 1 }], menu)).toThrow(PricingError);
  });

  test("rejects sold-out items with their name in the message", () => {
    expect(() => priceOrder([{ menuItemId: "cake", quantity: 1 }], menu)).toThrow(
      /Cheesecake is sold out/,
    );
  });
});
