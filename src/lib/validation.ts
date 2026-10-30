import { z } from "zod";
import { ORDER_LIMITS, RESERVATION_RULES } from "@/lib/config";
import { ORDER_STATUSES, RESERVATION_STATUSES } from "@/lib/domain/status";
import { isDateString } from "@/lib/domain/schedule";

const name = z.string().trim().min(2, "Please enter your name.").max(80);
const email = z.string().trim().toLowerCase().email("Please enter a valid email.").max(120);
const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s().-]{7,20}$/, "Please enter a valid phone number.")
  .transform((value) => value.replace(/(?!^\+)\D/g, ""));
const notes = z.string().trim().max(300, "Notes can be at most 300 characters.").default("");
const isoInstant = z.string().datetime({ offset: true }).transform((value) => new Date(value));
const dateString = z.string().refine(isDateString, "Use the format YYYY-MM-DD.");

export const orderInputSchema = z.object({
  customer: z.object({ name, email, phone }),
  pickupAt: isoInstant,
  notes,
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(ORDER_LIMITS.maxQuantityPerLine),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(ORDER_LIMITS.maxLines),
});
export type OrderInput = z.infer<typeof orderInputSchema>;

const partySize = z.coerce.number().int().min(1).max(RESERVATION_RULES.maxPartySize);

export const availabilityQuerySchema = z.object({ date: dateString, partySize });

export const reservationInputSchema = z.object({
  name,
  email,
  phone,
  partySize,
  startAt: isoInstant,
  notes,
});
export type ReservationInput = z.infer<typeof reservationInputSchema>;

export const orderStatusUpdateSchema = z.object({ status: z.enum(ORDER_STATUSES) });
export const reservationStatusUpdateSchema = z.object({ status: z.enum(RESERVATION_STATUSES) });
export const adminLoginSchema = z.object({ password: z.string().min(1).max(200) });

/** First human-readable message from a zod error. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request.";
}
