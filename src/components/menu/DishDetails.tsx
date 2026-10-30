"use client";

import { useState } from "react";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { ORDER_LIMITS } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import type { MenuItemView } from "@/server/menu";
import { useCart } from "@/stores/cart";

export function DishDetails({ dish }: { dish: MenuItemView }) {
  const [quantity, setQuantity] = useState(1);
  const add = useCart((state) => state.add);
  const setOpen = useCart((state) => state.setOpen);

  const handleAdd = () => {
    add({ menuItemId: dish.id, name: dish.name, priceCents: dish.priceCents }, quantity);
    setQuantity(1);
    setOpen(true);
  };

  return (
    <div className="pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="display text-4xl sm:text-5xl">{dish.name}</h2>
        <p className="font-display text-3xl tabular-nums">{formatPrice(dish.priceCents)}</p>
      </div>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-soft">{dish.description}</p>
      <p className="mt-4 text-[0.62rem] tracking-[var(--tracking-label)] text-muted uppercase">
        {[...dish.tags, dish.calories ? `${dish.calories} kcal` : null].filter(Boolean).join("  ·  ")}
      </p>

      {dish.isAvailable ? (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <QuantityStepper
            value={quantity}
            min={1}
            max={ORDER_LIMITS.maxQuantityPerLine}
            onChange={setQuantity}
            label={`quantity of ${dish.name}`}
          />
          <button type="button" className="btn-primary" onClick={handleAdd}>
            Add to order: {formatPrice(dish.priceCents * quantity)}
          </button>
        </div>
      ) : (
        <p className="mt-8 text-sm font-medium text-danger">Sold out today. Back tomorrow morning.</p>
      )}
    </div>
  );
}
