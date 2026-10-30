import { fail, globallyRateLimited, handleError, ok, rateLimited, readJson } from "@/lib/api";
import { createSessionToken, isCorrectAdminPassword } from "@/lib/auth/session";
import { ADMIN_SESSION } from "@/lib/config";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { adminLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const limited = rateLimited(request, RATE_LIMITS.adminLogin) ?? globallyRateLimited(RATE_LIMITS.adminLoginGlobal);
  if (limited) return limited;
  try {
    const parsed = adminLoginSchema.safeParse(await readJson(request));
    if (!parsed.success || !isCorrectAdminPassword(parsed.data.password)) {
      return fail("Incorrect password.", 401);
    }
    const response = ok({ signedIn: true });
    response.cookies.set(ADMIN_SESSION.cookieName, await createSessionToken(ADMIN_SESSION.ttlSeconds), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ADMIN_SESSION.ttlSeconds,
    });
    return response;
  } catch (error) {
    return handleError(error, "POST /api/admin/login");
  }
}
