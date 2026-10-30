import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AvailabilityToggle, LogoutButton } from "@/components/admin/AdminActions";
import { OrderCard, ReservationCard } from "@/components/admin/AdminCards";
import { AutoRefresh } from "@/components/forms/AutoRefresh";
import { verifySessionToken } from "@/lib/auth/session";
import { ADMIN_SESSION } from "@/lib/config";
import { getMenu } from "@/server/menu";
import { listOrdersForAdmin } from "@/server/orders";
import { listReservationsForAdmin } from "@/server/reservations";

export const metadata: Metadata = { title: "Kitchen dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

const DASHBOARD_REFRESH_MS = 15_000;

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="display mb-5 border-b border-ink pb-3 text-3xl">{children}</h2>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-line p-6 text-sm text-muted">{children}</p>;
}

export default async function AdminPage() {
  // Middleware already guards this route; check again in case it's misconfigured.
  const token = (await cookies()).get(ADMIN_SESSION.cookieName)?.value;
  if (!(await verifySessionToken(token))) redirect("/admin/login");

  const [orders, reservations, menu] = await Promise.all([listOrdersForAdmin(), listReservationsForAdmin(), getMenu()]);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-12 sm:px-10">
      <AutoRefresh intervalMs={DASHBOARD_REFRESH_MS} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Staff only</p>
          <h1 className="display mt-3 text-6xl">Kitchen</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-14 grid gap-14 xl:grid-cols-12">
        <section aria-labelledby="orders-h" className="xl:col-span-7">
          <Heading id="orders-h">Open orders ({orders.length})</Heading>
          {orders.length === 0 && <Empty>No open orders.</Empty>}
          <ul className="space-y-4">
            {orders.map((order) => <OrderCard key={order.id} order={order} />)}
          </ul>
        </section>

        <div className="space-y-14 xl:col-span-5">
          <section aria-labelledby="res-h">
            <Heading id="res-h">Upcoming bookings ({reservations.length})</Heading>
            {reservations.length === 0 && <Empty>No upcoming bookings.</Empty>}
            <ul className="space-y-4">
              {reservations.map((booking) => <ReservationCard key={booking.id} booking={booking} />)}
            </ul>
          </section>

          <section aria-labelledby="menu-h">
            <Heading id="menu-h">On the counter today</Heading>
            <div className="divide-y divide-line">
              {menu.flatMap((category) => category.items).map((item) => (
                <AvailabilityToggle key={item.id} id={item.id} name={item.name} isAvailable={item.isAvailable} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
