"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/client-api";

export type Slot = { startAt: string; available: boolean };
type State = { slots: Slot[]; isLoading: boolean; error: string | null };

/** Loads bookable times whenever the date or party size changes. */
export function useAvailability(date: string, partySize: number, refreshKey: number) {
  const [state, setState] = useState<State>({ slots: [], isLoading: true, error: null });

  useEffect(() => {
    let isCurrent = true;
    setState((previous) => ({ ...previous, isLoading: true, error: null }));
    const query = new URLSearchParams({ date, partySize: String(partySize) });
    apiRequest<Slot[]>(`/api/availability?${query}`).then((result) => {
      if (!isCurrent) return;
      setState(
        result.success
          ? { slots: result.data, isLoading: false, error: null }
          : { slots: [], isLoading: false, error: result.error },
      );
    });
    return () => {
      isCurrent = false;
    };
  }, [date, partySize, refreshKey]);

  return state;
}
