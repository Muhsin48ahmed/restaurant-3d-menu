import Image from "next/image";

const PANELS = [
  {
    src: "/images/sourdough-sliced.jpg",
    alt: "Sliced country sourdough on a wooden board",
    title: "36 hours",
    body: "Every loaf is cold-fermented for a day and a half before it meets the fire.",
  },
  {
    src: "/images/bread-shelves.jpg",
    alt: "Shelves of freshly baked loaves in wicker baskets",
    title: "Stone-milled",
    body: "Heritage wheat and rye from two farms upstate, milled to order each week.",
  },
  {
    src: "/images/latte-pour.jpg",
    alt: "Milk being poured into a latte",
    title: "Seasonal espresso",
    body: "Roasted in Red Hook, rotated with the seasons, pulled short and sweet.",
  },
];

export function Craft() {
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-10 lg:py-32" aria-labelledby="craft-h">
      <div className="grid gap-6 lg:grid-cols-12">
        <p className="eyebrow lg:col-span-3">The craft</p>
        <h2 id="craft-h" className="display text-4xl sm:text-5xl lg:col-span-9 lg:max-w-3xl">
          Slow dough, a hot oven, and nothing we wouldn&apos;t eat ourselves.
        </h2>
      </div>
      <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
        {PANELS.map((panel, index) => (
          <article key={panel.title} className={index === 1 ? "md:mt-16" : ""}>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={panel.src}
                alt={panel.alt}
                fill
                sizes="(min-width: 768px) 30vw, 100vw"
                className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.03]"
              />
            </div>
            <h3 className="mt-6 font-display text-3xl">{panel.title}</h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">{panel.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
