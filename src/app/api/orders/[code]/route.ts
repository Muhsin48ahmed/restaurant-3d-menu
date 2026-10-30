import { fail, handleError, ok, rateLimited } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { getOrderByCode } from "@/server/orders";

const CODE_PATTERN = /^EO-[A-Z0-9]{6}$/;

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const limited = rateLimited(request, RATE_LIMITS.read);
  if (limited) return limited;
  const { code } = await params;
  if (!CODE_PATTERN.test(code)) return fail("Order not found.", 404);
  try {
    const order = await getOrderByCode(code);
    return order ? ok(order) : fail("Order not found.", 404);
  } catch (error) {
    return handleError(error, "GET /api/orders/[code]");
  }
}
