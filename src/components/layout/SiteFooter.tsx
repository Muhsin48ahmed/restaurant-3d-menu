import Link from "next/link";
import { RESTAURANT } from "@/lib/config";
import { OpeningHours } from "./OpeningHours";

export function SiteFooter() {
  return (
    <footer className="mt-32 bg-ink text-paper">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-20 sm:px-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="display text-5xl">{RESTAURANT.name}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/60">
            A neighbourhood bakery and café in {RESTAURANT.neighbourhood}, baking with fire since{" "}
            {RESTAURANT.established}.
          </p>
        </div>
        <div className="text-sm leading-relaxed md:col-span-3">
          <p className="mb-4 text-[0.65rem] font-semibold tracking-[var(--tracking-label)] text-paper/50 uppercase">Visit</p>
          <p>{RESTAURANT.address}</p>
          <p className="mt-3">
            <a href={`tel:${RESTAURANT.phone.replace(/\D/g, "")}`} className="hover:text-paper/70">{RESTAURANT.phone}</a>
          </p>
          <p>
            <a href={`mailto:${RESTAURANT.email}`} className="hover:text-paper/70">{RESTAURANT.email}</a>
          </p>
        </div>
        <div className="text-sm md:col-span-4">
          <p className="mb-4 text-[0.65rem] font-semibold tracking-[var(--tracking-label)] text-paper/50 uppercase">Hours</p>
          <OpeningHours tone="dark" />
        </div>
      </div>
      <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-4 border-t border-paper/10 px-5 py-6 text-xs text-paper/40 sm:px-10">
        <p>© {new Date().getFullYear()} {RESTAURANT.name}</p>
        <p>
          3D scans: Poly Haven (CC0) · Photography: Unsplash ·{" "}
          <Link href="/admin" className="hover:text-paper/70">Staff</Link>
        </p>
      </div>
    </footer>
  );
}
