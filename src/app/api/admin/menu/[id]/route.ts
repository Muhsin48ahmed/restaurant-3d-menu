import { z } from "zod";
import { fail, handleError, ok, rateLimited, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/require-admin";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { firstIssue } from "@/lib/validation";
import { setItemAvailability } from "@/server/menu";

const availabilitySchema = z.object({ isAvailable: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const limited = rateLimited(request, RATE_LIMITS.adminWrite);
  if (limited) return limited;
  try {
    const { id } = await params;
    const parsed = availabilitySchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(firstIssue(parsed.error), 422);
    const item = await setItemAvailability(id, parsed.data.isAvailable);
    return ok({ id: item.id, isAvailable: item.isAvailable });
  } catch (error) {
    return handleError(error, "PATCH /api/admin/menu/[id]");
  }
}
