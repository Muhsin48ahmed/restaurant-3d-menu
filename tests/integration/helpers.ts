import { prisma } from "@/lib/db";
import { CATEGORIES, MENU_ITEMS, TABLES } from "../../prisma/seed-data";

/** Empties the test database and loads the demo menu and floor plan. */
export async function resetAndSeed() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.diningTable.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();

  const categories = await Promise.all(
    CATEGORIES.map((category, sortOrder) =>
      prisma.menuCategory.create({ data: { ...category, sortOrder } }),
    ),
  );
  const idBySlug = new Map(categories.map((category) => [category.slug, category.id]));

  await prisma.menuItem.createMany({
    data: MENU_ITEMS.map(({ category, ...item }, sortOrder) => ({
      ...item,
      sortOrder,
      categoryId: idBySlug.get(category)!,
    })),
  });
  await prisma.diningTable.createMany({ data: TABLES });
}

export async function menuItemId(slug: string) {
  const item = await prisma.menuItem.findUniqueOrThrow({ where: { slug } });
  return item.id;
}
