import { fail, handleError, ok, rateLimited, readJson } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { firstIssue, orderInputSchema } from "@/lib/validation";
import { placeOrder } from "@/server/orders";

export async function POST(request: Request) {
  const limited = rateLimited(request, RATE_LIMITS.placeOrder);
  if (limited) return limited;
  try {
    const parsed = orderInputSchema.safeParse(await readJson(request));
    if (!parsed.success) return fail(firstIssue(parsed.error), 422);
    const order = await placeOrder(parsed.data);
    return ok({ code: order.code, totalCents: order.totalCents }, 201);
  } catch (error) {
    return handleError(error, "POST /api/orders");
  }
}
