import { fail, handleError, ok, rateLimited, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/require-admin";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { firstIssue, reservationStatusUpdateSchema } from "@/lib/validation";
import { updateReservationStatus } from "@/server/reservations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const limited = rateLimited(request, RATE_LIMITS.adminWrite);
  if (limited) return limited;
  try {
    const { id } = await params;
    const parsed = reservationStatusUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(firstIssue(parsed.error), 422);
    const reservation = await updateReservationStatus(id, parsed.data.status);
    return ok({ id: reservation.id, status: reservation.status });
  } catch (error) {
    return handleError(error, "PATCH /api/admin/reservations/[id]");
  }
}
