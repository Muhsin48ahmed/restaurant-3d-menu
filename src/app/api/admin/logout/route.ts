import { ok } from "@/lib/api";
import { ADMIN_SESSION } from "@/lib/config";

export function POST() {
  const response = ok({ signedIn: false });
  response.cookies.delete(ADMIN_SESSION.cookieName);
  return response;
}
