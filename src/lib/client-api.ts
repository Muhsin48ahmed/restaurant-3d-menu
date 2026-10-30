import type { ApiResponse } from "@/lib/api";

const NETWORK_ERROR = "We couldn't reach the bakery. Check your connection and try again.";
const NETWORK_FAILURE_STATUS = 0;

export type ClientResult<T> = ApiResponse<T> & { status: number };

/** Calls one of our JSON endpoints and never throws: failures come back as { success: false }. */
export async function apiRequest<T>(url: string, init?: RequestInit): Promise<ClientResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;
    if (body && typeof body.success === "boolean") return { ...body, status: response.status };
    return { success: false, error: `Unexpected response (${response.status}).`, status: response.status };
  } catch {
    return { success: false, error: NETWORK_ERROR, status: NETWORK_FAILURE_STATUS };
  }
}
