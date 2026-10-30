import { ORDER_LIMITS } from "@/lib/config";
import { prisma } from "@/lib/db";
import { UserFacingError } from "@/lib/errors";
import { priceOrder, PricingError } from "@/lib/domain/pricing";
import { isValidPickupTime } from "@/lib/domain/schedule";
import { canTransitionOrder, isOrderStatus, type OrderStatus } from "@/lib/domain/status";
import type { OrderInput } from "@/lib/validation";
import { withUniqueCode } from "@/server/codes";

const ORDER_CODE_PREFIX = "EO";
const OPEN_ORDER_STATUSES = ["RECEIVED", "PREPARING", "READY"];
const ADMIN_ORDER_LIMIT = 100;

async function assertUnderOpenOrderLimit(customer: OrderInput["customer"]) {
  const openOrders = await prisma.order.count({
    where: {
      status: { in: OPEN_ORDER_STATUSES },
      OR: [{ email: customer.email }, { phone: customer.phone }],
    },
  });
  if (openOrders >= ORDER_LIMITS.maxOpenOrdersPerContact) {
    throw new UserFacingError("You have several orders in progress. Call us if you need another.", 429);
  }
}

/** Prices the cart from current menu data; archived dishes count as sold out. */
async function priceFromMenu(items: OrderInput["items"]) {
  const rows = await prisma.menuItem.findMany({
    where: { id: { in: items.map((item) => item.menuItemId) } },
    select: { id: true, name: true, priceCents: true, isAvailable: true, isArchived: true },
  });
  const menu = rows.map(({ isArchived, ...row }) => ({ ...row, isAvailable: row.isAvailable && !isArchived }));
  try {
    return priceOrder(items, menu);
  } catch (error) {
    if (error instanceof PricingError) throw new UserFacingError(error.message, 409);
    throw error;
  }
}

export async function placeOrder(input: OrderInput, now = new Date()) {
  if (!isValidPickupTime(input.pickupAt, now)) {
    throw new UserFacingError("That pickup time is no longer available. Please pick another.");
  }
  await assertUnderOpenOrderLimit(input.customer);
  const totals = await priceFromMenu(input.items);

  return withUniqueCode(ORDER_CODE_PREFIX, (code) =>
    prisma.order.create({
      data: {
        code,
        customerName: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        pickupAt: input.pickupAt,
        notes: input.notes,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        items: { create: totals.lines },
      },
      include: { items: true },
    }),
  );
}

/** Public order lookup. Only returns what the confirmation page shows. */
export async function getOrderByCode(code: string) {
  const order = await prisma.order.findUnique({
    where: { code },
    select: {
      code: true,
      customerName: true,
      pickupAt: true,
      status: true,
      subtotalCents: true,
      taxCents: true,
      totalCents: true,
      items: { select: { name: true, quantity: true, unitPriceCents: true } },
    },
  });
  if (!order) return null;
  // Anyone with the code can see this, so share only the first name.
  const { customerName, ...rest } = order;
  return { ...rest, firstName: customerName.trim().split(/\s+/)[0] ?? "" };
}

export async function listOrdersForAdmin() {
  return prisma.order.findMany({
    orderBy: { pickupAt: "asc" },
    where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
    include: { items: true },
    take: ADMIN_ORDER_LIMIT,
  });
}

export async function updateOrderStatus(id: string, next: OrderStatus) {
  const order = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!order) throw new UserFacingError("Order not found.", 404);
  if (!isOrderStatus(order.status) || !canTransitionOrder(order.status, next)) {
    throw new UserFacingError(`Can't move an order from ${order.status} to ${next}.`, 409);
  }
  return prisma.order.update({ where: { id }, data: { status: next } });
}
