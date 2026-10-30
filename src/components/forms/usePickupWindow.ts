"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/client-api";

export type PickupWindow = { date: string; slots: string[] } | null;

/** Loads pickup times; `refresh` re-fetches when the list may have gone stale. */
export function usePickupWindow() {
  const [window, setWindow] = useState<PickupWindow | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let isCurrent = true;
    apiRequest<PickupWindow>("/api/pickup-slots").then((result) => {
      if (!isCurrent) return;
      if (result.success) {
        setWindow(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [version]);

  // Slots expire as time passes, so re-check whenever the customer comes back to the tab.
  useEffect(() => {
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return { window, error, refresh };
}
