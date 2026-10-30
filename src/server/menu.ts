import { prisma } from "@/lib/db";
import { UserFacingError } from "@/lib/errors";
import { resolveModelUrl } from "@/server/models";

export type MenuItemView = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  modelUrl: string | null;
  tags: string[];
  calories: number | null;
  isAvailable: boolean;
};

export type MenuCategoryView = {
  id: string;
  slug: string;
  name: string;
  items: MenuItemView[];
};

function splitTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export async function getMenu(): Promise<MenuCategoryView[]> {
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { items: { where: { isArchived: false }, orderBy: { sortOrder: "asc" } } },
  });

  return categories
    .filter((category) => category.items.length > 0)
    .map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    items: category.items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      priceCents: item.priceCents,
      imageUrl: item.imageUrl,
      modelUrl: resolveModelUrl(item.slug, item.modelUrl),
      tags: splitTags(item.tags),
      calories: item.calories,
      isAvailable: item.isAvailable,
    })),
  }));
}

export async function setItemAvailability(id: string, isAvailable: boolean) {
  const item = await prisma.menuItem.findUnique({ where: { id }, select: { isArchived: true } });
  if (!item || item.isArchived) throw new UserFacingError("Menu item not found.", 404);
  return prisma.menuItem.update({ where: { id }, data: { isAvailable } });
}
