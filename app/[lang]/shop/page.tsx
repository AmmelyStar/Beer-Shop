// app/[lang]/shop/page.tsx
import { fetchAllProductsFlattened } from "../../data/repo";
import ShopContent from "@/app/components/ShopContent";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import type { Locale } from "../../lib/locale";
import { getMessages } from "../messages";
import { getReviewSummaryByHandle } from "@/app/lib/reviews/getReviewSummaryByHandle";
import {
  isCategoryKey,
  type CategoryKey,
  CATEGORY_TO_COLLECTION_HANDLE,
} from "@/app/lib/shop/categories";

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
  return tags.map((x) => String(x).toLowerCase().trim()).filter(Boolean);
}

function getProductTypeLower(p: unknown): string {
  if (!p || typeof p !== "object") return "";
  const obj = p as Record<string, unknown>;
  const pt = obj.productType ?? obj.product_type ?? obj.type;
  return pt ? String(pt).toLowerCase().trim() : "";
}

function matchesCategory(p: unknown, category: CategoryKey): boolean {
  if (category === "all") return true;

  const handles = getCollectionHandlesLower(p);
  const tags = getTagsLower(p);
  const pt = getProductTypeLower(p);

  const targetHandle = CATEGORY_TO_COLLECTION_HANDLE[category].toLowerCase();

  // Для bottle-beer и draft-beer только строгое совпадение.
  // Это убирает ситуацию, когда draft-beer попадает в bottle-beer.
  if (category === "bottle-beer") {
    return tags.includes("bottle-beer") || handles.includes("bottle-beer");
  }

  if (category === "draft-beer") {
    return tags.includes("draft-beer") || handles.includes("draft-beer");
  }

  // Сначала пробуем строгое совпадение для остальных категорий
  if (tags.includes(targetHandle) || handles.includes(targetHandle)) {
    return true;
  }

  const aliases: Record<CategoryKey, string[]> = {
    all: ["all"],

    "bottle-beer": ["bottle-beer"],
    "draft-beer": ["draft-beer"],

    cider: ["cider", "siider", "sidr", "сидр"],

    "energy-drinks": [
      "energy-drinks",
      "energy-drink",
      "energy drink",
      "energy drinks",
      "red bull",
      "monster",
      "энерг",
    ],

    "non-alcoholic-beer": [
      "non-alcoholic-beer",
      "non alcoholic beer",
      "non-alcoholic beer",
      "alcohol free beer",
      "alcohol-free",
      "alcohol free",
      "0.0",
      "0%",
      "alkoholfrei",
      "безалког",
    ],

    snacks: ["snacks", "snack", "chips", "crisps", "nuts", "закус", "снеки"],

    "sparkling-wine": [
      "sparkling-wine",
      "sparkling wine",
      "sparkling",
      "prosecco",
      "sekt",
      "bubbles",
      "игрист",
    ],

    "soft-drinks": [
      "soft-drinks",
      "soft drink",
      "soft drinks",
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

  const hay = [...tags, ...handles, pt].filter(Boolean);
  const needles = [targetHandle, ...aliases[category]].map((s) =>
    s.toLowerCase()
  );

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

  const handles = finalProducts
    .map((p) => p.handle)
    .filter((handle): handle is string => Boolean(handle));

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