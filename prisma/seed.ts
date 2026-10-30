import { PrismaClient } from "@prisma/client";
import { CATEGORIES, MENU_ITEMS, TABLES } from "./seed-data";

const prisma = new PrismaClient();

// Upserts by slug/label, so re-running the seed never wipes orders or bookings.
async function main() {
  const categoryIds = new Map<string, string>();

  for (const [sortOrder, category] of CATEGORIES.entries()) {
    const saved = await prisma.menuCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, sortOrder },
      create: { ...category, sortOrder },
    });
    categoryIds.set(category.slug, saved.id);
  }

  for (const [sortOrder, { category, ...item }] of MENU_ITEMS.entries()) {
    const data = { ...item, sortOrder, isArchived: false, categoryId: categoryIds.get(category)! };
    await prisma.menuItem.upsert({ where: { slug: item.slug }, update: data, create: data });
  }

  // Dishes dropped from the menu are archived, not deleted, so past orders keep their items.
  const { count: archived } = await prisma.menuItem.updateMany({
    where: { slug: { notIn: MENU_ITEMS.map((item) => item.slug) }, isArchived: false },
    data: { isArchived: true },
  });
  if (archived > 0) console.log(`Archived ${archived} dishes no longer on the menu.`);

  for (const table of TABLES) {
    await prisma.diningTable.upsert({ where: { label: table.label }, update: table, create: table });
  }

  console.log(`Seeded ${MENU_ITEMS.length} dishes and ${TABLES.length} tables.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
