import { describe, expect, test } from "vitest";
import { clientIp } from "@/lib/client-ip";

const headers = (init: Record<string, string>) => new Headers(init);

describe("clientIp", () => {
  test("ignores the spoofable leftmost X-Forwarded-For entry", () => {
    expect(clientIp(headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }), undefined)).toBe("203.0.113.9");
  });

  test("prefers the configured trusted header", () => {
    const request = headers({ "x-forwarded-for": "6.6.6.6", "cf-connecting-ip": "198.51.100.4" });
    expect(clientIp(request, "cf-connecting-ip")).toBe("198.51.100.4");
  });

  test("caps absurdly long values so they can't bloat the limiter", () => {
    expect(clientIp(headers({ "x-forwarded-for": "a".repeat(5000) }), undefined)).toHaveLength(64);
  });

  test("falls back to a shared bucket when nothing is known", () => {
    expect(clientIp(headers({}), undefined)).toBe("unknown");
  });
});
