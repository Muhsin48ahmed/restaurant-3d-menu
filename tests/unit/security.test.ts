import { beforeEach, describe, expect, test } from "vitest";
import {
  constantTimeEqual,
  createSessionToken,
  isCorrectAdminPassword,
  verifySessionToken,
} from "@/lib/auth/session";
import { checkRateLimit, globalKey, resetRateLimits, trackedKeyCount } from "@/lib/rate-limit";

describe("admin session tokens", () => {
  const now = 1_800_000_000_000;

  test("verifies a fresh token", async () => {
    const token = await createSessionToken(60, now);
    expect(await verifySessionToken(token, now + 1000)).toBe(true);
  });

  test("rejects expired tokens", async () => {
    const token = await createSessionToken(60, now);
    expect(await verifySessionToken(token, now + 61_000)).toBe(false);
  });

  test("rejects a token whose expiry was tampered with", async () => {
    const [, signature] = (await createSessionToken(60, now)).split(".");
    expect(await verifySessionToken(`${now + 999_999_999}.${signature}`, now)).toBe(false);
  });

  test("rejects missing and malformed tokens", async () => {
    expect(await verifySessionToken(undefined, now)).toBe(false);
    expect(await verifySessionToken("garbage", now)).toBe(false);
  });
});

describe("constantTimeEqual", () => {
  test("matches equal strings only", () => {
    expect(constantTimeEqual("ember", "ember")).toBe(true);
    expect(constantTimeEqual("ember", "embers")).toBe(false);
    expect(constantTimeEqual("ember", "amber")).toBe(false);
  });
});

describe("isCorrectAdminPassword", () => {
  test("is false when no admin password is configured", () => {
    const previous = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;
    expect(isCorrectAdminPassword("")).toBe(false);
    if (previous === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previous;
  });
});

describe("checkRateLimit", () => {
  const rule = { name: "test", limit: 2, windowMs: 1000 };
  beforeEach(resetRateLimits);

  test("blocks after the limit and reports when to retry", () => {
    expect(checkRateLimit("ip", rule, 0).allowed).toBe(true);
    expect(checkRateLimit("ip", rule, 10).allowed).toBe(true);
    const blocked = checkRateLimit("ip", rule, 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  test("starts a new window once the old one ends", () => {
    checkRateLimit("ip", rule, 0);
    checkRateLimit("ip", rule, 0);
    expect(checkRateLimit("ip", rule, 1000).allowed).toBe(true);
  });
});

describe("rate limiter under a key flood", () => {
  const rule = { name: "flood", limit: 1, windowMs: 60_000 };
  const loginRule = { name: "login-all", limit: 1, windowMs: 60_000 };
  beforeEach(resetRateLimits);

  test("stays bounded and keeps global counters", () => {
    checkRateLimit(globalKey(loginRule), loginRule, 0);
    for (let i = 0; i < 12_000; i += 1) checkRateLimit(`flood:${i}`, rule, 0);

    expect(trackedKeyCount()).toBeLessThanOrEqual(10_000);
    // The global login counter survived eviction, so the second attempt is still blocked.
    expect(checkRateLimit(globalKey(loginRule), loginRule, 0).allowed).toBe(false);
  });
});

describe("weak secrets", () => {
  test("refuses the placeholder admin password from .env.example", () => {
    const previous = process.env.ADMIN_PASSWORD;
    process.env.ADMIN_PASSWORD = "change-me";
    expect(isCorrectAdminPassword("change-me")).toBe(false);
    if (previous === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = previous;
  });
});
