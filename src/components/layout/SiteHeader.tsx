import Link from "next/link";
import { CartButton } from "@/components/cart/CartDrawer";
import { RESTAURANT } from "@/lib/config";

const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/reserve", label: "Reserve" },
  { href: "/#visit", label: "Visit" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:h-20 sm:px-10">
        <Link href="/" className="group flex items-baseline gap-3 whitespace-nowrap">
          <span className="font-display text-2xl leading-none sm:text-[1.7rem]">{RESTAURANT.name}</span>
          <span className="hidden text-[0.62rem] tracking-[var(--tracking-label)] text-muted uppercase md:inline">
            {RESTAURANT.tagline}
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden px-1 py-2 text-[0.68rem] font-semibold tracking-[var(--tracking-label)] text-ink-soft uppercase transition-colors hover:text-accent sm:inline"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/menu"
            className="px-2 py-2 text-[0.68rem] font-semibold tracking-[var(--tracking-label)] text-ink-soft uppercase sm:hidden"
          >
            Menu
          </Link>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
