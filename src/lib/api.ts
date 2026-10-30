import { NextResponse } from "next/server";
import { clientIp } from "@/lib/client-ip";
import { UserFacingError } from "@/lib/errors";
import { checkRateLimit, globalKey, type RateLimitRule } from "@/lib/rate-limit";

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json<ApiResponse<never>>({ success: false, error }, { status });
}

const MAX_BODY_BYTES = 16 * 1024;

function tooManyRequests(retryAfterSeconds: number) {
  const response = fail("Too many requests. Please wait a moment and try again.", 429);
  response.headers.set("Retry-After", String(retryAfterSeconds));
  return response;
}

/** Returns a 429 response when this caller is over the limit, else null. */
export function rateLimited(request: Request, rule: RateLimitRule) {
  const result = checkRateLimit(`${rule.name}:${clientIp(request.headers)}`, rule);
  return result.allowed ? null : tooManyRequests(result.retryAfterSeconds);
}

/** Like rateLimited, but shared by every caller (e.g. total login attempts). */
export function globallyRateLimited(rule: RateLimitRule) {
  const result = checkRateLimit(globalKey(rule), rule);
  return result.allowed ? null : tooManyRequests(result.retryAfterSeconds);
}

/** Maps thrown errors to safe responses and logs the unexpected ones. */
export function handleError(error: unknown, context: string) {
  if (error instanceof UserFacingError) return fail(error.message, error.status);
  console.error(`[api] ${context} failed`, error);
  return fail("Something went wrong on our side. Please try again.", 500);
}

/** Parses a small JSON body; oversized or non-JSON bodies are rejected before parsing. */
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new UserFacingError("Send the request as application/json.", 415);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    throw new UserFacingError("Request is too large.", 413);
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new UserFacingError("Request is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new UserFacingError("Request body must be valid JSON.");
  }
}
