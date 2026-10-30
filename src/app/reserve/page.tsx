import type { Metadata } from "next";
import Image from "next/image";
import { ReservationForm } from "@/components/forms/ReservationForm";
import { RESERVATION_RULES, RESTAURANT } from "@/lib/config";
import { bookingWindow } from "@/lib/domain/schedule";

export const metadata: Metadata = { title: "Reserve a table" };
// Today's date must come from the request, not the build.
export const dynamic = "force-dynamic";

export default function ReservePage() {
  const { today, lastDay } = bookingWindow(new Date());
  return (
    <div className="mx-auto grid max-w-[1400px] gap-14 px-5 pt-12 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:pt-16">
      <div className="lg:col-span-7">
        <p className="eyebrow">Reservations</p>
        <h1 className="display mt-5 text-6xl sm:text-7xl">Pull up a chair.</h1>
        <p className="mt-6 mb-14 max-w-lg leading-relaxed text-ink-soft">
          Tables are held for {RESERVATION_RULES.durationMinutes} minutes. For groups larger than{" "}
          {RESERVATION_RULES.maxPartySize}, call us on {RESTAURANT.phone}.
        </p>
        <ReservationForm today={today} lastDay={lastDay} />
      </div>
      <figure className="relative hidden lg:col-span-5 lg:block">
        <div className="sticky top-28 aspect-[3/4] overflow-hidden">
          <Image
            src="/images/bakers.jpg"
            alt="Bakers shaping dough at the long bench"
            fill
            sizes="40vw"
            priority
            className="object-cover"
          />
        </div>
      </figure>
    </div>
  );
}
