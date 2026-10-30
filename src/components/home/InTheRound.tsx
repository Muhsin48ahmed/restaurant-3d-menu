"use client";

import Link from "next/link";
import { useState } from "react";
import { DishViewer, type ViewerDish } from "@/components/menu/DishViewer";

export type ShowcaseItem = ViewerDish & { kind: "On the menu" | "Ingredient"; note: string };

export function InTheRound({ items }: { items: ShowcaseItem[] }) {
  const [index, setIndex] = useState(0);
  const selected = items[index];
  if (!selected) return null;

  return (
    <section className="bg-paper-2" aria-labelledby="round-h">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-24 sm:px-10 lg:grid-cols-12 lg:gap-16 lg:py-32">
        <div className="lg:col-span-7">
          <DishViewer key={selected.slug} dish={selected} sizes="(min-width: 1024px) 58vw, 100vw" className="aspect-square sm:aspect-[5/4]" />
        </div>
        <div className="flex flex-col lg:col-span-5">
          <p className="eyebrow">In the round</p>
          <h2 id="round-h" className="display mt-5 text-5xl sm:text-6xl">
            Scanned, not styled.
          </h2>
          <p className="mt-6 max-w-md leading-relaxed text-ink-soft">
            Each piece is captured from a few hundred photographs and rebuilt as a true-to-life 3D model, so you can
            check the lamination on a croissant or the crumb of a cake before you order. Drag to turn it.
          </p>
          <ul className="mt-10 border-t border-line">
            {items.map((item, itemIndex) => (
              <li key={item.slug} className="border-b border-line">
                <button
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  aria-pressed={itemIndex === index}
                  className="group flex w-full items-baseline justify-between gap-4 py-4 text-left"
                >
                  <span className={`font-display text-2xl transition-colors ${itemIndex === index ? "text-ink" : "text-muted group-hover:text-ink"}`}>
                    {item.name}
                  </span>
                  <span className="text-[0.62rem] tracking-[var(--tracking-label)] text-muted uppercase">{item.kind}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-muted">{selected.note}</p>
          <Link href="/menu" className="link-underline mt-10 self-start">
            See the full menu
          </Link>
        </div>
      </div>
    </section>
  );
}
