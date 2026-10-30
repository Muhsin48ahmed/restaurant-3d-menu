import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/forms/AutoRefresh";
import { RESTAURANT } from "@/lib/config";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/domain/status";
import { formatPrice, formatVenueDate, formatVenueTime } from "@/lib/format";
import { getOrderByCode } from "@/server/orders";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS_REFRESH_MS = 20_000;
const CODE_PATTERN = /^EO-[A-Z0-9]{6}$/;
const PROGRESS: OrderStatus[] = ["RECEIVED", "PREPARING", "READY", "COMPLETED"];
const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "Received",
  PREPARING: "In the oven",
  READY: "Ready to collect",
  COMPLETED: "Collected",
  CANCELLED: "Cancelled",
};

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!CODE_PATTERN.test(code)) notFound();
  const order = await getOrderByCode(code);
  if (!order) notFound();

  const status = ORDER_STATUSES.find((s) => s === order.status) ?? "RECEIVED";
  const reached = PROGRESS.indexOf(status);
  const isLive = status !== "COMPLETED" && status !== "CANCELLED";

  return (
    <div className="mx-auto max-w-3xl px-5 pt-12 sm:px-10 lg:pt-16">
      {isLive && <AutoRefresh intervalMs={STATUS_REFRESH_MS} />}
      <p className="eyebrow">Order {order.code}</p>
      <h1 className="display mt-5 text-6xl sm:text-7xl">Thank you, {order.firstName}.</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
        Collect it {formatVenueDate(order.pickupAt)} at{" "}
        <strong className="font-semibold text-ink">{formatVenueTime(order.pickupAt)}</strong> from the counter at{" "}
        {RESTAURANT.address}. Pay when you arrive.
      </p>

      {status === "CANCELLED" ? (
        <p className="mt-12 border-l-2 border-danger py-2 pl-4 text-danger">
          This order was cancelled. Call us on {RESTAURANT.phone} if that&apos;s a surprise.
        </p>
      ) : (
        <ol className="mt-14 grid grid-cols-4 gap-3" aria-label="Order progress">
          {PROGRESS.map((step, index) => (
            <li key={step} aria-current={index === reached ? "step" : undefined}>
              <div className={`h-px ${index <= reached ? "bg-ink" : "bg-line"}`} />
              <p className={`mt-3 text-[0.62rem] font-semibold tracking-[var(--tracking-label)] uppercase ${index <= reached ? "text-ink" : "text-muted"}`}>
                {STATUS_LABEL[step]}
              </p>
            </li>
          ))}
        </ol>
      )}

      <section className="mt-14 bg-paper-2 p-8" aria-label="Order details">
        <ul className="divide-y divide-line text-sm">
          {order.items.map((item) => (
            <li key={item.name} className="flex justify-between py-3">
              <span><span className="text-muted tabular-nums">{item.quantity} ×</span> {item.name}</span>
              <span className="tabular-nums">{formatPrice(item.unitPriceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-1.5 border-t border-line pt-4 text-sm text-muted">
          <p className="flex justify-between"><span>Tax</span><span className="tabular-nums">{formatPrice(order.taxCents)}</span></p>
          <p className="flex justify-between pt-2 text-base font-semibold text-ink">
            <span>Due at pickup</span><span className="tabular-nums">{formatPrice(order.totalCents)}</span>
          </p>
        </div>
      </section>
    </div>
  );
}
