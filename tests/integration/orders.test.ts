import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { prisma } from "@/lib/db";
import { UserFacingError } from "@/lib/errors";
import { getMenu } from "@/server/menu";
import { getOrderByCode, placeOrder, updateOrderStatus } from "@/server/orders";
import { menuItemId, resetAndSeed } from "./helpers";

// Tuesday 10:07 in New York; first pickup slot is 10:30 (15:30 UTC).
const NOW = new Date("2026-11-03T15:07:00Z");
const PICKUP = new Date("2026-11-03T16:00:00Z");
const customer = { name: "Ada Lovelace", email: "ada@example.com", phone: "7185550100" };

beforeEach(resetAndSeed);
afterAll(() => prisma.$disconnect());

describe("getMenu", () => {
  test("groups dishes by category in menu order", async () => {
    const menu = await getMenu();
    expect(menu.map((category) => category.slug)).toEqual([
      "viennoiserie",
      "cakes",
      "breakfast",
      "bread",
      "coffee",
    ]);
    expect(menu[1].items[1].tags).toEqual(["vegetarian", "gluten-free"]);
    expect(menu[0].items[0].imageUrl).toBe("/images/butter-croissant.jpg");
  });

  test("hides archived dishes and drops categories left empty", async () => {
    await prisma.menuItem.updateMany({ where: { slug: { in: ["flat-white", "oat-latte"] } }, data: { isArchived: true } });
    const menu = await getMenu();
    expect(menu.map((category) => category.slug)).not.toContain("coffee");
  });
});

describe("placeOrder", () => {
  test("stores server-side prices, tax and a public code", async () => {
    const croissant = await menuItemId("butter-croissant");
    const latte = await menuItemId("oat-latte");

    const order = await placeOrder(
      {
        customer,
        pickupAt: PICKUP,
        notes: "",
        items: [
          { menuItemId: croissant, quantity: 2 },
          { menuItemId: latte, quantity: 1 },
        ],
      },
      NOW,
    );

    expect(order.code).toMatch(/^EO-/);
    expect(order.subtotalCents).toBe(1475);
    expect(order.taxCents).toBe(131);
    expect(order.totalCents).toBe(1606);
    expect(order.items).toHaveLength(2);
    expect(order.status).toBe("RECEIVED");
  });

  test("refuses a pickup time that is not an offered slot", async () => {
    const croissant = await menuItemId("butter-croissant");
    const attempt = placeOrder(
      {
        customer,
        pickupAt: new Date("2026-11-03T15:15:00Z"),
        notes: "",
        items: [{ menuItemId: croissant, quantity: 1 }],
      },
      NOW,
    );
    await expect(attempt).rejects.toThrow(UserFacingError);
  });

  test("refuses sold-out dishes", async () => {
    const cake = await menuItemId("carrot-cake");
    await prisma.menuItem.update({ where: { id: cake }, data: { isAvailable: false } });

    const attempt = placeOrder(
      { customer, pickupAt: PICKUP, notes: "", items: [{ menuItemId: cake, quantity: 1 }] },
      NOW,
    );
    await expect(attempt).rejects.toThrow(/sold out/);
  });
});

describe("order guards", () => {
  test("treats archived dishes as sold out", async () => {
    const cake = await menuItemId("carrot-cake");
    await prisma.menuItem.update({ where: { id: cake }, data: { isArchived: true } });
    const attempt = placeOrder(
      { customer, pickupAt: PICKUP, notes: "", items: [{ menuItemId: cake, quantity: 1 }] },
      NOW,
    );
    await expect(attempt).rejects.toThrow(/sold out/);
  });

  test("caps open orders per contact", async () => {
    const croissant = await menuItemId("butter-croissant");
    const order = { customer, pickupAt: PICKUP, notes: "", items: [{ menuItemId: croissant, quantity: 1 }] };
    for (let i = 0; i < 3; i += 1) await placeOrder(order, NOW);
    await expect(placeOrder(order, NOW)).rejects.toThrow(/several orders in progress/);
  });

  test("rejects a merged quantity above the per-item cap", async () => {
    const croissant = await menuItemId("butter-croissant");
    const lines = Array.from({ length: 2 }, () => ({ menuItemId: croissant, quantity: 15 }));
    const attempt = placeOrder({ customer, pickupAt: PICKUP, notes: "", items: lines }, NOW);
    await expect(attempt).rejects.toThrow(/at most 20/);
  });
});

describe("order lifecycle", () => {
  test("follows the kitchen flow and exposes only safe fields publicly", async () => {
    const croissant = await menuItemId("butter-croissant");
    const order = await placeOrder(
      { customer, pickupAt: PICKUP, notes: "", items: [{ menuItemId: croissant, quantity: 1 }] },
      NOW,
    );

    await updateOrderStatus(order.id, "PREPARING");
    await expect(updateOrderStatus(order.id, "RECEIVED")).rejects.toThrow(/Can't move/);

    const publicView = await getOrderByCode(order.code);
    expect(publicView?.status).toBe("PREPARING");
    expect(publicView?.firstName).toBe("Ada");
    expect(publicView).not.toHaveProperty("customerName");
    expect(publicView).not.toHaveProperty("email");
    expect(publicView).not.toHaveProperty("phone");
  });
});
