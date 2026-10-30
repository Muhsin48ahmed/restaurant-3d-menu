"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ORDER_LIMITS, TAX_RATE } from "@/lib/config";

export type CartItem = {
  menuItemId: string;
  name: string;
  priceCents: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  remove: (menuItemId: string) => void;
  clear: () => void;
  setOpen: (isOpen: boolean) => void;
};

const clampQuantity = (quantity: number) =>
  Math.min(Math.max(Math.round(quantity), 0), ORDER_LIMITS.maxQuantityPerLine);

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((line) => line.menuItemId === item.menuItemId);
          const items = existing
            ? state.items.map((line) =>
                line.menuItemId === item.menuItemId
                  ? { ...line, quantity: clampQuantity(line.quantity + quantity) }
                  : line,
              )
            : [...state.items, { ...item, quantity: clampQuantity(quantity) }];
          return { items: items.slice(0, ORDER_LIMITS.maxLines) };
        }),
      setQuantity: (menuItemId, quantity) =>
        set((state) => ({
          items: state.items
            .map((line) =>
              line.menuItemId === menuItemId ? { ...line, quantity: clampQuantity(quantity) } : line,
            )
            .filter((line) => line.quantity > 0),
        })),
      remove: (menuItemId) =>
        set((state) => ({ items: state.items.filter((line) => line.menuItemId !== menuItemId) })),
      clear: () => set({ items: [] }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "ember-oak-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      // Rehydrated in CartHydrator to avoid server/client markup mismatches.
      skipHydration: true,
    },
  ),
);

/** Estimated totals for display; the server recalculates on checkout. */
export function cartTotals(items: readonly CartItem[]) {
  const subtotalCents = items.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const count = items.reduce((sum, line) => sum + line.quantity, 0);
  return { subtotalCents, taxCents, totalCents: subtotalCents + taxCents, count };
}

function subscribeHydration(callback: () => void) {
  return useCart.persist.onFinishHydration(callback);
}

/** True once the saved cart has been loaded from localStorage. */
export function useCartHydrated() {
  return useSyncExternalStore(subscribeHydration, () => useCart.persist.hasHydrated(), () => false);
}
