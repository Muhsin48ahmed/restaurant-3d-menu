import { handleError, ok, rateLimited } from "@/lib/api";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { getMenu } from "@/server/menu";

export async function GET(request: Request) {
  const limited = rateLimited(request, RATE_LIMITS.read);
  if (limited) return limited;
  try {
    return ok(await getMenu());
  } catch (error) {
    return handleError(error, "GET /api/menu");
  }
}
