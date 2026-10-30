"use client";

import { useRef, useState } from "react";
import type { MenuCategoryView, MenuItemView } from "@/server/menu";
import { DishDetails } from "./DishDetails";
import { DishRow } from "./DishRow";
import { DishViewer } from "./DishViewer";

const DESKTOP_MIN_WIDTH = 1024;

export function MenuExplorer({ categories }: { categories: MenuCategoryView[] }) {
  const allDishes = categories.flatMap((category) => category.items);
  const [selectedId, setSelectedId] = useState(allDishes[0]?.id);
  const viewerRef = useRef<HTMLElement>(null);
  const selected = allDishes.find((dish) => dish.id === selectedId) ?? allDishes[0];

  if (!selected) {
    return <p className="py-24 text-center text-muted">The menu is being updated. Please check back soon.</p>;
  }

  const select = (dish: MenuItemView) => {
    setSelectedId(dish.id);
    // On smaller screens the viewer sits above the list, so bring it back into view.
    if (window.innerWidth < DESKTOP_MIN_WIDTH) {
      viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <section
        ref={viewerRef}
        aria-label="Selected item"
        className="scroll-mt-20 lg:sticky lg:top-28 lg:col-span-6 lg:self-start xl:col-span-7"
      >
        <DishViewer
          key={selected.slug}
          dish={selected}
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="aspect-square sm:aspect-[5/4]"
          priority
        />
        <DishDetails key={selected.id} dish={selected} />
      </section>

      <div className="lg:col-span-6 xl:col-span-5">
        {categories.map((category) => (
          <section key={category.id} id={category.slug} className="scroll-mt-28 pb-12" aria-labelledby={`${category.slug}-h`}>
            <h2 id={`${category.slug}-h`} className="display border-b border-ink pb-3 text-3xl">
              {category.name}
            </h2>
            <ul>
              {category.items.map((dish) => (
                <li key={dish.id} className="border-b border-line">
                  <DishRow dish={dish} isSelected={dish.id === selected.id} onSelect={select} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
