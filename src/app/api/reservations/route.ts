import { fail, handleError, ok, rateLimited, readJson } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { firstIssue, reservationInputSchema } from "@/lib/validation";
import { createReservation } from "@/server/reservations";

export async function POST(request: Request) {
  const limited = rateLimited(request, RATE_LIMITS.reserve);
  if (limited) return limited;
  try {
    const parsed = reservationInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(firstIssue(parsed.error), 422);
    const reservation = await createReservation(parsed.data);
    return ok(
      {
        code: reservation.code,
        startAt: reservation.startAt.toISOString(),
        partySize: reservation.partySize,
        name: reservation.name,
      },
      201,
    );
  } catch (error) {
    return handleError(error, "POST /api/reservations");
  }
}
