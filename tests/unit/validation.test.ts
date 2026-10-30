import { describe, expect, test } from "vitest";
import { canTransitionOrder } from "@/lib/domain/status";
import { generateCode } from "@/lib/codes";
import {
  availabilityQuerySchema,
  firstIssue,
  orderInputSchema,
  reservationInputSchema,
} from "@/lib/validation";

const validOrder = {
  customer: { name: "Ada Lovelace", email: "ADA@Example.com ", phone: "+1 (718) 555-0100" },
  pickupAt: "2026-11-03T16:00:00.000Z",
  items: [{ menuItemId: "burger", quantity: 2 }],
};

describe("orderInputSchema", () => {
  test("normalises email and converts pickup time to a Date", () => {
    const parsed = orderInputSchema.parse(validOrder);
    expect(parsed.customer.email).toBe("ada@example.com");
    expect(parsed.pickupAt).toBeInstanceOf(Date);
    expect(parsed.notes).toBe("");
  });

  test("rejects an empty cart with a friendly message", () => {
    const result = orderInputSchema.safeParse({ ...validOrder, items: [] });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstIssue(result.error)).toBe("Your cart is empty.");
  });

  test("rejects absurd quantities", () => {
    const result = orderInputSchema.safeParse({
      ...validOrder,
      items: [{ menuItemId: "burger", quantity: 500 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("reservation schemas", () => {
  test("coerces party size from a query string", () => {
    expect(availabilityQuerySchema.parse({ date: "2026-11-03", partySize: "4" })).toEqual({
      date: "2026-11-03",
      partySize: 4,
    });
  });

  test("rejects parties larger than the biggest table", () => {
    const result = reservationInputSchema.safeParse({
      name: "Grace",
      email: "grace@example.com",
      phone: "7185550100",
      partySize: 12,
      startAt: "2026-11-03T18:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("order status transitions", () => {
  test("moves forward through the kitchen flow", () => {
    expect(canTransitionOrder("RECEIVED", "PREPARING")).toBe(true);
    expect(canTransitionOrder("READY", "COMPLETED")).toBe(true);
  });

  test("never reopens a finished order", () => {
    expect(canTransitionOrder("COMPLETED", "PREPARING")).toBe(false);
    expect(canTransitionOrder("CANCELLED", "RECEIVED")).toBe(false);
  });
});

describe("generateCode", () => {
  test("uses the prefix and an unambiguous alphabet", () => {
    expect(generateCode("EO")).toMatch(/^EO-[2-9A-HJKMNP-Z]{6}$/);
  });
});
