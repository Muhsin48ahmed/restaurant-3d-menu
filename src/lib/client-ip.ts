const MAX_IP_LENGTH = 64;
const UNKNOWN = "unknown";

/**
 * Best-effort client address for rate limiting.
 *
 * Clients can put anything at the start of X-Forwarded-For, so we never trust
 * the leftmost entry. Set TRUSTED_IP_HEADER to the header your host overwrites
 * (Vercel: "x-real-ip", Cloudflare: "cf-connecting-ip"). Without it we use the
 * rightmost X-Forwarded-For entry, which is the one our own proxy appended.
 */
export function clientIp(headers: Headers, trustedHeader = process.env.TRUSTED_IP_HEADER): string {
  const trusted = trustedHeader ? headers.get(trustedHeader)?.trim() : undefined;
  const forwarded = headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = trusted || forwarded || headers.get("x-real-ip")?.trim() || UNKNOWN;
  return ip.slice(0, MAX_IP_LENGTH);
}
