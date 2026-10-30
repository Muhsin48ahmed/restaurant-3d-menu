import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";
import { ADMIN_SESSION } from "@/lib/config";

// Reachable without a session. Logout is public so an expired cookie can still be cleared.
const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/login", "/api/admin/logout"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function unauthorized(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

/** Blocks cross-site writes to the admin API, on top of the SameSite cookie. */
function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return origin !== null && origin === request.nextUrl.origin;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isApi && !SAFE_METHODS.has(request.method) && !isSameOrigin(request)) {
    return unauthorized("Cross-site request blocked.", 403);
  }
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return NextResponse.next();

  const token = request.cookies.get(ADMIN_SESSION.cookieName)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  if (isApi) return unauthorized("Please sign in.", 401);
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
