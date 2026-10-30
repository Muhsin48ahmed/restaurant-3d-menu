import { isOrderStatus } from "@/lib/domain/status";
import { formatPrice, formatVenueDate, formatVenueTime } from "@/lib/format";
import type { listOrdersForAdmin } from "@/server/orders";
import type { listReservationsForAdmin } from "@/server/reservations";
import { OrderActions, ReservationActions } from "./AdminActions";

type AdminOrder = Awaited<ReturnType<typeof listOrdersForAdmin>>[number];
type AdminReservation = Awaited<ReturnType<typeof listReservationsForAdmin>>[number];

const META = "text-[0.62rem] font-semibold tracking-[var(--tracking-label)] text-muted uppercase";

export function OrderCard({ order }: { order: AdminOrder }) {
  return (
    <li className="border border-line bg-paper p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-2xl">
          {formatVenueTime(order.pickupAt)} · {order.customerName}
        </p>
        <p className={META}>
          {order.code} · {order.status} · {formatPrice(order.totalCents)}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted">
        {formatVenueDate(order.pickupAt)} · {order.phone}
      </p>
      <ul className="mt-4 space-y-1 text-sm">
        {order.items.map((item) => (
          <li key={item.id}>
            <span className="text-muted tabular-nums">{item.quantity} ×</span> {item.name}
          </li>
        ))}
      </ul>
      {order.notes && <p className="mt-3 border-l-2 border-accent pl-3 text-sm text-ink-soft">{order.notes}</p>}
      <div className="mt-5">{isOrderStatus(order.status) && <OrderActions id={order.id} status={order.status} />}</div>
    </li>
  );
}

export function ReservationCard({ booking }: { booking: AdminReservation }) {
  return (
    <li className="border border-line bg-paper p-6">
      <p className="font-display text-xl">
        {formatVenueTime(booking.startAt)} · {booking.name} · {booking.partySize} guests
      </p>
      <p className={`mt-1 ${META}`}>
        {formatVenueDate(booking.startAt)} · {booking.table.label} · {booking.code} · {booking.status}
      </p>
      {booking.notes && <p className="mt-3 border-l-2 border-accent pl-3 text-sm text-ink-soft">{booking.notes}</p>}
      <div className="mt-4">
        <ReservationActions id={booking.id} status={booking.status} />
      </div>
    </li>
  );
}
