import { cookies } from "next/headers";
import { fail } from "@/lib/api";
import { ADMIN_SESSION } from "@/lib/config";
import { verifySessionToken } from "./session";

/**
 * Second line of defence behind middleware: returns a 401 response when the
 * caller has no valid admin session, else null.
 */
export async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION.cookieName)?.value;
  return (await verifySessionToken(token)) ? null : fail("Please sign in.", 401);
}
