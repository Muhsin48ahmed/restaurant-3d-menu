// Signed admin session tokens: "<expiresAtMs>.<hmac>". Uses Web Crypto so the
// same code runs in middleware (edge) and route handlers (node).

const encoder = new TextEncoder();
const MIN_SECRET_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 12;
// Values shipped in .env.example; a deployment still using them is unsafe.
const PLACEHOLDERS = new Set(["replace-with-a-long-random-string", "change-me"]);

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH || PLACEHOLDERS.has(secret)) {
    throw new Error(`SESSION_SECRET must be a random string of at least ${MIN_SECRET_LENGTH} characters.`);
  }
  return secret;
}

/** The admin password, or null when it is missing or too weak to accept logins. */
function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < MIN_PASSWORD_LENGTH || PLACEHOLDERS.has(password)) {
    console.error(`[auth] ADMIN_PASSWORD must be set to at least ${MIN_PASSWORD_LENGTH} characters; admin login is disabled.`);
    return null;
  }
  return password;
}

function toBase64Url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

/** Compares strings without short-circuiting on the first difference. */
export function constantTimeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < length; i += 1) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

export async function createSessionToken(ttlSeconds: number, now = Date.now()): Promise<string> {
  const expiresAt = String(now + ttlSeconds * 1000);
  return `${expiresAt}.${await sign(expiresAt)}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= now) return false;
  return constantTimeEqual(signature, await sign(expiresAt));
}

export function isCorrectAdminPassword(candidate: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  return constantTimeEqual(candidate, expected);
}
