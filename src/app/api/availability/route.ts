import { fail, handleError, ok, rateLimited } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { availabilityQuerySchema, firstIssue } from "@/lib/validation";
import { getAvailability } from "@/server/reservations";

export async function GET(request: Request) {
  const limited = rateLimited(request, RATE_LIMITS.read);
  if (limited) return limited;
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = availabilityQuerySchema.safeParse(params);
  if (!parsed.success) return fail(firstIssue(parsed.error), 422);
  try {
    return ok(await getAvailability(parsed.data.date, parsed.data.partySize));
  } catch (error) {
    return handleError(error, "GET /api/availability");
  }
}
