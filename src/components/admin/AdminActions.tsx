"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { apiRequest } from "@/lib/client-api";
import { nextOrderStatuses, type OrderStatus, type ReservationStatus } from "@/lib/domain/status";

const ORDER_ACTION_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "Received",
  PREPARING: "Start preparing",
  READY: "Mark ready",
  COMPLETED: "Picked up",
  CANCELLED: "Cancel",
};

/** Sends a PATCH, then re-renders the dashboard with fresh server data. */
function usePatch() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const patch = (url: string, body: unknown) =>
    startTransition(async () => {
      setError(null);
      const result = await apiRequest(url, { method: "PATCH", body: JSON.stringify(body) });
      if (!result.success) return setError(result.error);
      router.refresh();
    });

  return { patch, error, isPending };
}

function InlineError({ message }: { message: string | null }) {
  return message ? <p role="alert" className="mt-2 text-xs text-danger">{message}</p> : null;
}

export function OrderActions({ id, status }: { id: string; status: OrderStatus }) {
  const { patch, error, isPending } = usePatch();
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {nextOrderStatuses(status).map((next) => (
          <button
            key={next}
            type="button"
            disabled={isPending}
            onClick={() => patch(`/api/admin/orders/${id}`, { status: next })}
            className={next === "CANCELLED" ? "btn-ghost min-h-9 px-4 text-xs" : "btn-primary min-h-9 px-4 text-xs"}
          >
            {ORDER_ACTION_LABEL[next]}
          </button>
        ))}
      </div>
      <InlineError message={error} />
    </div>
  );
}

const RESERVATION_ACTIONS: { status: ReservationStatus; label: string }[] = [
  { status: "SEATED", label: "Seat" },
  { status: "NO_SHOW", label: "No-show" },
  { status: "CANCELLED", label: "Cancel" },
];

export function ReservationActions({ id, status }: { id: string; status: string }) {
  const { patch, error, isPending } = usePatch();
  if (status !== "CONFIRMED") return null;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {RESERVATION_ACTIONS.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={isPending}
            onClick={() => patch(`/api/admin/reservations/${id}`, { status: action.status })}
            className="btn-ghost min-h-9 px-4 text-xs"
          >
            {action.label}
          </button>
        ))}
      </div>
      <InlineError message={error} />
    </div>
  );
}

export function AvailabilityToggle({ id, name, isAvailable }: { id: string; name: string; isAvailable: boolean }) {
  const { patch, error, isPending } = usePatch();
  return (
    <div>
      <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4">
        <span className={isAvailable ? "" : "text-muted line-through"}>{name}</span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-ink"
          checked={isAvailable}
          disabled={isPending}
          onChange={(event) => patch(`/api/admin/menu/${id}`, { isAvailable: event.target.checked })}
        />
      </label>
      <InlineError message={error} />
    </div>
  );
}

export function LogoutButton() {
  const router = useRouter();
  const signOut = async () => {
    await apiRequest("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };
  return (
    <button type="button" className="btn-ghost min-h-9 px-4 text-xs" onClick={signOut}>
      Sign out
    </button>
  );
}
