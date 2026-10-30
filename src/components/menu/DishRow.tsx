import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { MenuItemView } from "@/server/menu";

type Props = { dish: MenuItemView; isSelected: boolean; onSelect: (dish: MenuItemView) => void };

export function DishRow({ dish, isSelected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(dish)}
      aria-pressed={isSelected}
      className="group flex w-full items-center gap-5 py-5 text-left"
    >
      <span className={`relative h-20 w-20 shrink-0 overflow-hidden bg-paper-2 transition-opacity sm:h-24 sm:w-24 ${isSelected ? "" : "opacity-85 group-hover:opacity-100"}`}>
        {dish.imageUrl && <Image src={dish.imageUrl} alt="" fill sizes="96px" className="object-cover" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-4">
          <span
            className={`font-display text-2xl leading-tight transition-colors ${
              isSelected ? "text-accent" : "group-hover:text-accent"
            } ${dish.isAvailable ? "" : "text-muted line-through"}`}
          >
            {dish.name}
          </span>
          <span className="shrink-0 text-sm tabular-nums">{formatPrice(dish.priceCents)}</span>
        </span>
        <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-muted">{dish.description}</span>
        {(dish.modelUrl || !dish.isAvailable) && (
          <span className="mt-2 block text-[0.6rem] font-semibold tracking-[var(--tracking-label)] uppercase">
            {!dish.isAvailable ? (
              <span className="text-danger">Sold out today</span>
            ) : (
              <span className="text-ink-soft">◎ View in 3D</span>
            )}
          </span>
        )}
      </span>
    </button>
  );
}
