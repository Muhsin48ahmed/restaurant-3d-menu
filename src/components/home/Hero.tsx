import Image from "next/image";
import Link from "next/link";
import { RESTAURANT } from "@/lib/config";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1400px] gap-10 px-5 pt-10 pb-20 sm:px-10 lg:grid-cols-12 lg:items-end lg:gap-16 lg:pt-16">
      <div className="lg:col-span-5 lg:pb-6">
        <p className="eyebrow">
          {RESTAURANT.neighbourhood} · Since {RESTAURANT.established}
        </p>
        <h1 className="display mt-6 text-[3.4rem] sm:text-7xl xl:text-[5.6rem]">
          Bread, pastry <span className="italic text-accent">&amp;</span> coffee, baked by fire.
        </h1>
        <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-soft">
          Naturally leavened loaves and laminated pastry from a wood-fired deck oven. Turn every pastry over in 3D
          before you order, then collect it warm.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link href="/menu" className="btn-primary">
            Order for pickup
          </Link>
          <Link href="/reserve" className="link-underline">
            Book a table
          </Link>
        </div>
      </div>
      <figure className="relative lg:col-span-7">
        <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-[6/5]">
          <Image
            src="/images/hero-baker.jpg"
            alt="A baker's hands kneading dough on a floured wooden bench"
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
          />
        </div>
        <figcaption className="mt-3 text-xs text-muted">Morning shift, 5:30am. The first loaves go in at six.</figcaption>
      </figure>
    </section>
  );
}
