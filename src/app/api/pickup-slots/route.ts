import { ok, rateLimited } from "@/lib/api";
import { nextPickupWindow } from "@/lib/domain/schedule";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const limited = rateLimited(request, RATE_LIMITS.read);
  if (limited) return limited;
  const window = nextPickupWindow({ now: new Date() });
  return ok(
    window ? { date: window.date, slots: window.slots.map((slot) => slot.toISOString()) } : null,
  );
}
