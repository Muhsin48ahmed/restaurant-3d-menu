import Image from "next/image";
import Link from "next/link";
import { OpeningHours } from "@/components/layout/OpeningHours";
import { RESTAURANT } from "@/lib/config";

export function Visit() {
  return (
    <section id="visit" className="scroll-mt-24" aria-labelledby="visit-h">
      <div className="relative h-[60vh] min-h-[420px] w-full overflow-hidden">
        <Image
          src="/images/interior.jpg"
          alt="The bright café floor with a pastry counter, pendant lights and bentwood chairs"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-5 pb-12 sm:px-10">
          <h2 id="visit-h" className="display max-w-2xl text-5xl text-paper sm:text-7xl">
            Stay a while.
          </h2>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="max-w-md text-lg leading-relaxed text-ink-soft">
            Forty seats under a skylight, a long table for friends, and the oven in full view. Walk-ins are always
            welcome; for weekends and groups, book ahead.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/reserve" className="btn-primary">Reserve a table</Link>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(RESTAURANT.address)}`}
              className="link-underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions
            </a>
          </div>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:col-span-7">
          <div className="text-sm">
            <p className="label">Address</p>
            <p className="mt-2 leading-relaxed">{RESTAURANT.address}</p>
            <p className="label mt-8">Contact</p>
            <p className="mt-2 leading-relaxed">
              {RESTAURANT.phone}
              <br />
              {RESTAURANT.email}
            </p>
          </div>
          <div className="text-sm">
            <p className="label">Hours</p>
            <OpeningHours />
          </div>
        </div>
      </div>
    </section>
  );
}
