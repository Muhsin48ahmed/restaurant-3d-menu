// Fixed-window limiter held in memory. Good for a single instance; use
// Redis or your platform's limiter when running more than one.

export type RateLimitRule = { name: string; limit: number; windowMs: number };
type Window = { count: number; resetAt: number };

const MAX_TRACKED_KEYS = 10_000;
// Evict down to this size so a flood doesn't trigger a full scan per request.
const EVICT_TO = Math.floor(MAX_TRACKED_KEYS * 0.9);
// Global counters must survive eviction, or a flood of keys would reset them.
const PINNED_PREFIX = "global:";
const windows = new Map<string, Window>();

export const RATE_LIMITS = {
  placeOrder: { name: "order", limit: 5, windowMs: 60_000 },
  reserve: { name: "reserve", limit: 5, windowMs: 60_000 },
  read: { name: "read", limit: 60, windowMs: 60_000 },
  adminLogin: { name: "admin-login", limit: 5, windowMs: 15 * 60_000 },
  // Caps total guesses even if an attacker rotates IP addresses.
  adminLoginGlobal: { name: "admin-login-all", limit: 30, windowMs: 15 * 60_000 },
  adminWrite: { name: "admin-write", limit: 120, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitRule>;

/** Keeps the map bounded: drop expired windows, then the oldest if still full. */
function makeRoom(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  for (const key of windows.keys()) {
    if (windows.size <= EVICT_TO) break;
    if (!key.startsWith(PINNED_PREFIX)) windows.delete(key);
  }
}

export function checkRateLimit(key: string, rule: RateLimitRule, now = Date.now()) {
  const current = windows.get(key);
  if (!current && windows.size >= MAX_TRACKED_KEYS) makeRoom(now);

  const window: Window =
    !current || current.resetAt <= now
      ? { count: 1, resetAt: now + rule.windowMs }
      : { count: current.count + 1, resetAt: current.resetAt };
  windows.set(key, window);

  return {
    allowed: window.count <= rule.limit,
    retryAfterSeconds: Math.ceil((window.resetAt - now) / 1000),
  };
}

export function globalKey(rule: RateLimitRule) {
  return `${PINNED_PREFIX}${rule.name}`;
}

export function resetRateLimits() {
  windows.clear();
}

export function trackedKeyCount() {
  return windows.size;
}
