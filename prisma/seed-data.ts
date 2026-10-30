// Menu and floor plan for the demo bakery-café. Dishes with a scan in
// public/models/<slug>.glb are shown in 3D; the rest show their photo.

export const CATEGORIES = [
  { slug: "viennoiserie", name: "Viennoiserie" },
  { slug: "cakes", name: "Cakes" },
  { slug: "breakfast", name: "Breakfast" },
  { slug: "bread", name: "Bread" },
  { slug: "coffee", name: "Coffee" },
] as const;

type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export type SeedMenuItem = {
  slug: string;
  category: CategorySlug;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  tags: string;
  calories?: number;
  modelUrl?: string;
};

export const MENU_ITEMS: SeedMenuItem[] = [
  {
    slug: "butter-croissant",
    category: "viennoiserie",
    name: "Butter Croissant",
    description: "Laminated over three days with cultured Normandy butter. Shatters, then melts.",
    priceCents: 475,
    imageUrl: "/images/butter-croissant.jpg",
    tags: "vegetarian",
    calories: 310,
  },
  {
    slug: "brioche-buns",
    category: "viennoiserie",
    name: "Milk Brioche, Four",
    description: "Soft, golden and enriched with egg yolk and honey. Baked fresh every morning.",
    priceCents: 900,
    imageUrl: "/images/brioche-buns.jpg",
    tags: "vegetarian",
    calories: 920,
  },
  {
    slug: "carrot-cake",
    category: "cakes",
    name: "Spiced Carrot Cake",
    description: "Brown sugar sponge with toasted walnuts, cinnamon and a whipped cream-cheese frosting.",
    priceCents: 650,
    imageUrl: "/images/carrot-cake.jpg",
    tags: "vegetarian",
    calories: 480,
  },
  {
    slug: "strawberry-chocolate-cake",
    category: "cakes",
    name: "Strawberry & Dark Chocolate Torte",
    description: "70% chocolate ganache over a flourless sponge, crowned with macerated strawberries.",
    priceCents: 725,
    imageUrl: "/images/strawberry-chocolate-cake.jpg",
    tags: "vegetarian,gluten-free",
    calories: 520,
  },
  {
    slug: "avocado-sourdough",
    category: "breakfast",
    name: "Avocado on Sourdough",
    description: "Crushed Hass avocado, lemon, chilli flakes and sea salt on toasted country loaf.",
    priceCents: 1350,
    imageUrl: "/images/avocado-sourdough.jpg",
    tags: "vegan",
    calories: 540,
  },
  {
    slug: "eggs-sourdough",
    category: "breakfast",
    name: "Poached Eggs & Greens",
    description: "Two free-range eggs, wilted spinach, avocado and brown-butter hollandaise on sourdough.",
    priceCents: 1600,
    imageUrl: "/images/eggs-sourdough.jpg",
    tags: "vegetarian",
    calories: 690,
  },
  {
    slug: "country-sourdough",
    category: "bread",
    name: "Country Sourdough Loaf",
    description: "Stone-milled wheat and rye, 36-hour cold ferment, baked dark in our wood-fired deck oven.",
    priceCents: 1100,
    imageUrl: "/images/country-sourdough.jpg",
    tags: "vegan",
  },
  {
    slug: "flat-white",
    category: "coffee",
    name: "Flat White",
    description: "Double ristretto of our seasonal espresso with silky whole milk.",
    priceCents: 475,
    imageUrl: "/images/flat-white.jpg",
    tags: "",
    calories: 120,
  },
  {
    slug: "oat-latte",
    category: "coffee",
    name: "Oat Latte",
    description: "Espresso with steamed oat milk, poured to order.",
    priceCents: 525,
    imageUrl: "/images/latte-pour.jpg",
    tags: "vegan",
    calories: 150,
  },
];

export const TABLES = [
  { label: "Window 1", seats: 2 },
  { label: "Window 2", seats: 2 },
  { label: "Window 3", seats: 2 },
  { label: "Hearth 1", seats: 4 },
  { label: "Hearth 2", seats: 4 },
  { label: "Hearth 3", seats: 4 },
  { label: "Booth 1", seats: 6 },
  { label: "Chef's Table", seats: 8 },
];
