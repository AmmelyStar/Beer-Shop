// app/[lang]/shop/page.tsx
import { fetchAllProductsFlattened } from "../../data/repo";
import ShopContent from "@/app/components/ShopContent";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import type { Locale } from "../../lib/locale";
import { getMessages } from "../messages";
import { getReviewSummaryByHandle } from "@/app/lib/reviews/getReviewSummaryByHandle";
import { isCategoryKey, type CategoryKey } from "@/app/lib/shop/categories";

type SortKey =
  | "best"
  | "new"
  | "price_asc"
  | "price_desc"
  | "title_asc"
  | "title_desc";

const SORT_KEYS: readonly SortKey[] = [
  "best",
  "new",
  "price_asc",
  "price_desc",
  "title_asc",
  "title_desc",
] as const;

function isSortKey(x: unknown): x is SortKey {
  return typeof x === "string" && (SORT_KEYS as readonly string[]).includes(x);
}

// максимально безопасно достаём цену из FlattenedProduct (под разные мапперы)
function getPriceNumber(p: unknown): number {
  if (!p || typeof p !== "object") return Number.POSITIVE_INFINITY;

  const obj = p as Record<string, unknown>;

  const v1 = obj.priceAmount;
  if (typeof v1 === "number") return v1;
  if (typeof v1 === "string") {
    const n = Number(v1);
    return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
  }

  const price = obj.price;
  if (price && typeof price === "object") {
    const amount = (price as Record<string, unknown>).amount;
    if (typeof amount === "number") return amount;
    if (typeof amount === "string") {
      const n = Number(amount);
      return Number.isNaN(n) ? Number.POSITIVE_INFINITY : n;
    }
  }

  return Number.POSITIVE_INFINITY;
}

function getCreatedAtMs(p: unknown): number {
  if (!p || typeof p !== "object") return 0;
  const obj = p as Record<string, unknown>;
  const raw =
    obj.createdAt ?? obj.created_at ?? obj.publishedAt ?? obj.published_at;
  if (!raw) return 0;
  const t = Date.parse(String(raw));
  return Number.isNaN(t) ? 0 : t;
}

function getCollectionHandlesLower(p: unknown): string[] {
  if (!p || typeof p !== "object") return [];
  const obj = p as Record<string, unknown>;

  const fromHandles = obj.collectionHandles;
  if (Array.isArray(fromHandles)) {
    return fromHandles.map((x) => String(x).toLowerCase()).filter(Boolean);
  }

  // collections может быть ["snacks","beer"] или [{handle,title}]
  const fromCollections = obj.collections;
  if (Array.isArray(fromCollections)) {
    return fromCollections
      .map((c) => {
        if (typeof c === "string") return c;
        if (c && typeof c === "object") {
          const co = c as Record<string, unknown>;
          return String(co.handle ?? co.title ?? co.name ?? "");
        }
        return "";
      })
      .map((s) => s.toLowerCase())
      .filter(Boolean);
  }

  return [];
}

function getTagsLower(p: unknown): string[] {
  if (!p || typeof p !== "object") return [];
  const obj = p as Record<string, unknown>;
  const tags = obj.tags;
  if (!Array.isArray(tags)) return [];
  return tags.map((x) => String(x).toLowerCase()).filter(Boolean);
}

function getProductTypeLower(p: unknown): string {
  if (!p || typeof p !== "object") return "";
  const obj = p as Record<string, unknown>;
  const pt = obj.productType ?? obj.product_type ?? obj.type;
  return pt ? String(pt).toLowerCase() : "";
}

function matchesCategory(p: unknown, category: CategoryKey): boolean {
  if (category === "all") return true;

  const handles = getCollectionHandlesLower(p);
  const tags = getTagsLower(p);
  const pt = getProductTypeLower(p);

  // алиасы под твои НОВЫЕ категории (и под возможные старые данные)
  const aliases: Record<CategoryKey, string[]> = {
    all: ["all"],

    "beer in bottles": [
      "beer in bottles",
      "bottled beer",
      "bottle",
      "bottles",
      "beer",
      "bier",
      "пиво",
      "bottled",
    ],
      "Draft Beer": [
    "draft beer",
    "draft",
    "tap",
    "on tap",
    "draught",
    "fassbier",
    "vom fass",
    "fass",
    "пиво разливное",
    "разливное",
  ],

    Cider: ["cider", "siider", "sidr", "сидр"],

    "energy drink": ["energy drink", "energy", "энерг", "red bull", "monster"],

    "non-alcoholic beer": [
      "non-alcoholic beer",
      "non alcoholic beer",
      "alcohol free beer",
      "0.0",
      "0%",
      "безалког",
      "alkoholfrei",
      "alcohol-free",
      "alcohol free",
    ],

    snacks: ["snacks", "snack", "chips", "crisps", "nuts", "закус", "снеки"],

    "sparkling wine": [
      "sparkling wine",
      "sparkling",
      "prosecco",
      "sekt",
      "bubbles",
      "игрист",
    ],

    "Soft Drinks": [
      "soft drinks",
      "soft drink",
      "soda",
      "mineral",
      "mineral water",
      "water",
      "kvass",
      "kvas",
      "квас",
      "минерал",
      "лимонад",
      "lemonade",
    ],
  };

  const needles = [String(category), ...(aliases[category] ?? [])].map((s) =>
    s.toLowerCase()
  );

  // 1) лучший вариант — точное совпадение handle (в lower)
  if (handles.includes(String(category).toLowerCase())) return true;

  // 2) запасной — частичное совпадение по алиасам
  const hay = [...handles, ...tags, pt].filter(Boolean);
  return hay.some((h) => needles.some((n) => h.includes(n)));
}

function sortProducts<T extends { title?: string }>(
  list: T[],
  sort: SortKey
): T[] {
  const arr = [...list];

  switch (sort) {
    case "price_asc":
      arr.sort((a, b) => getPriceNumber(a) - getPriceNumber(b));
      return arr;
    case "price_desc":
      arr.sort((a, b) => getPriceNumber(b) - getPriceNumber(a));
      return arr;
    case "title_asc":
      arr.sort((a, b) =>
        String(a.title ?? "").localeCompare(String(b.title ?? ""))
      );
      return arr;
    case "title_desc":
      arr.sort((a, b) =>
        String(b.title ?? "").localeCompare(String(a.title ?? ""))
      );
      return arr;
    case "new":
      arr.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
      return arr;
    case "best":
    default:
      return arr;
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ lang: Locale }>;
  searchParams?: Promise<{ category?: string; sort?: string }>;
}) {
  const { lang } = await params;
  const sp = searchParams ? await searchParams : {};

  const t = await getMessages(lang);
  const allProducts = await fetchAllProductsFlattened(lang);

  const category: CategoryKey =
    sp.category && isCategoryKey(sp.category) ? sp.category : "all";

  const sort: SortKey = sp.sort && isSortKey(sp.sort) ? sp.sort : "best";

  const filtered = allProducts.filter((p) => matchesCategory(p, category));
  const finalProducts = sortProducts(filtered, sort);

  const handles = finalProducts.map((p) => p.handle).filter(Boolean);
  const reviewSummaries = await getReviewSummaryByHandle(handles);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        lang={lang}
        labels={{
          home: t.common.home,
          shop: t.common.shop,
          categories: t.AllProducts.categories,
        }}
      />

      <ShopContent
        products={finalProducts}
        translations={t.AllProducts}
        lang={lang}
        reviewSummaries={reviewSummaries}
        activeCategory={category}
      />
    </main>
  );
}
