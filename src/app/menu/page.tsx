import type { Metadata } from "next";
import { MenuExplorer } from "@/components/menu/MenuExplorer";
import { getMenu } from "@/server/menu";

export const metadata: Metadata = { title: "Menu" };
// Sold-out toggles from the kitchen should show up immediately.
export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const categories = await getMenu();
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-12 sm:px-10 lg:pt-16">
      <header className="mb-14 grid gap-8 border-b border-line pb-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow">Today&apos;s counter</p>
          <h1 className="display mt-5 text-6xl sm:text-7xl">The menu</h1>
        </div>
        <div className="flex flex-col justify-end gap-6 lg:col-span-5">
          <p className="leading-relaxed text-ink-soft">
            Order ahead and collect from the counter, or eat in. Pieces marked “View in 3D” are photogrammetry scans
            you can turn in your hands.
          </p>
          <nav aria-label="Menu sections" className="flex flex-wrap gap-x-6 gap-y-2">
            {categories.map((category) => (
              <a key={category.id} href={`#${category.slug}`} className="link-underline">
                {category.name}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <MenuExplorer categories={categories} />
    </div>
  );
}
