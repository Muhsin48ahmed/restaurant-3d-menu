import { Craft } from "@/components/home/Craft";
import { Hero } from "@/components/home/Hero";
import { InTheRound, type ShowcaseItem } from "@/components/home/InTheRound";
import { Visit } from "@/components/home/Visit";
import { getMenu } from "@/server/menu";
import { resolveModelUrl } from "@/server/models";

export const dynamic = "force-dynamic";

const NOTES: Record<string, string> = {
  "butter-croissant": "27 layers of butter and dough, folded by hand over three days.",
  "brioche-buns": "Enriched with yolks and wildflower honey; the base of our breakfast sandwich.",
  "carrot-cake": "Brown sugar, walnuts and warm spice under a whipped cream-cheese frosting.",
  "strawberry-chocolate-cake": "Flourless chocolate sponge, ganache and the season's strawberries.",
};

// Scans of ingredients we cook with. They aren't sold on their own, so they live here, not in the menu.
const INGREDIENTS: ShowcaseItem[] = [
  { slug: "avocado", name: "Hass avocado", kind: "Ingredient", imageUrl: null, modelUrl: null, note: "Ripened in-house and crushed to order for our avocado toast." },
  { slug: "pomegranate", name: "Pomegranate", kind: "Ingredient", imageUrl: null, modelUrl: null, note: "Scattered over the winter granola and the labneh plate." },
];

export default async function HomePage() {
  const menu = await getMenu();
  const scanned = menu
    .flatMap((category) => category.items)
    .filter((dish) => dish.modelUrl)
    .map((dish): ShowcaseItem => ({ ...dish, kind: "On the menu", note: NOTES[dish.slug] ?? dish.description }));
  const ingredients = INGREDIENTS.map((item) => ({ ...item, modelUrl: resolveModelUrl(item.slug, null) })).filter(
    (item) => item.modelUrl,
  );

  return (
    <>
      <Hero />
      <InTheRound items={[...scanned, ...ingredients]} />
      <Craft />
      <Visit />
    </>
  );
}
