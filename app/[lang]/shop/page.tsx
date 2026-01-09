// app/[lang]/shop/page.tsx
import { fetchAllProductsFlattened } from "../../data/repo";
import ShopContent from "@/app/components/ShopContent";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";
import type { Locale } from "../../lib/locale";
import { getMessages } from "../messages";
import {
  getReviewSummaryByHandle,
  type ReviewSummary,
} from "@/app/lib/reviews/getReviewSummaryByHandle";
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

// ---------- helpers ----------

function isThenable<T = unknown>(x: unknown): x is Promise<T> {
  if (!x) return false;
  const t = typeof x;
  if (t !== "object" && t !== "function") return false;
  return typeof (x as { then?: unknown }).then === "function";
}

function firstString(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function parseMoney(x: unknown): number | null {
  if (typeof x === "number") return Number.isFinite(x) ? x : null;

  if (typeof x === "string") {
    // поддержка "1298.00", "1,298.00 EUR", "€12.50"
    const cleaned = x.replace(/[^0-9.,-]/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isNaN(n) ? null : n;
  }

  return null;
}

// максимально безопасно достаём цену из FlattenedProduct (под разные мапперы / Shopify структуры)
function getPriceNumber(p: unknown): number {
  if (!p || typeof p !== "object") return Number.POSITIVE_INFINITY;
  const obj = p as Record<string, unknown>;

  // 1) прямое поле (твой маппер)
  const direct = parseMoney(obj.priceAmount);
  if (direct !== null) return direct;

  // 2) price.amount
  const price = obj.price;
  if (price && typeof price === "object") {
    const amount = parseMoney((price as Record<string, unknown>).amount);
    if (amount !== null) return amount;
  }

  // 3) Shopify: priceRange.minVariantPrice.amount
  const priceRange = obj.priceRange;
  if (priceRange && typeof priceRange === "object") {
    const minVariantPrice = (priceRange as Record<string, unknown>).minVariantPrice;
    if (minVariantPrice && typeof minVariantPrice === "object") {
      const amount = parseMoney((minVariantPrice as Record<string, unknown>).amount);
      if (amount !== null) return amount;
    }
  }

  // 4) Shopify: variants[0].price.amount / variants[0].price
  const variants = obj.variants;
  if (Array.isArray(variants) && variants.length > 0) {
    const v0 = variants[0];
    if (v0 && typeof v0 === "object") {
      const v0obj = v0 as Record<string, unknown>;

      const vPriceAmount = parseMoney(v0obj.priceAmount);
      if (vPriceAmount !== null) return vPriceAmount;

      const vPrice = v0obj.price;
      if (vPrice && typeof vPrice === "object") {
        const amount = parseMoney((vPrice as Record<string, unknown>).amount);
        if (amount !== null) return amount;
      }

      const vPriceDirect = parseMoney(v0obj.price);
      if (vPriceDirect !== null) return vPriceDirect;
    }
  }

  return Number.POSITIVE_INFINITY;
}

function getCreatedAtMs(p: unknown): number {
  if (!p || typeof p !== "object") return 0;
  const obj = p as Record<string, unknown>;

  const raw =
    obj.createdAt ??
    obj.created_at ??
    obj.publishedAt ??
    obj.published_at ??
    obj.updatedAt ??
    obj.updated_at;

  if (!raw) return 0;

  const t = Date.parse(String(raw));
  return Number.isNaN(t) ? 0 : t;
}

function getCollectionsLower(p: unknown): string[] {
  if (!p || typeof p !== "object") return [];
  const obj = p as Record<string, unknown>;

  const c = obj.collections ?? obj.collectionHandles;
  if (!Array.isArray(c)) return [];

  return c
    .map((item) => {
      if (typeof item === "string") return item.toLowerCase();
      if (item && typeof item === "object") {
        const it = item as Record<string, unknown>;
        const v = it.handle ?? it.title ?? it.name;
        return v ? String(v).toLowerCase() : "";
      }
      return "";
    })
    .filter(Boolean);
}

function getTagsLower(p: unknown): string[] {
  if (!p || typeof p !== "object") return [];
  const obj = p as Record<string, unknown>;
  const tags = obj.tags;
  if (!Array.isArray(tags)) return [];
  return tags.map((x) => String(x).toLowerCase());
}

function getProductTypeLower(p: unknown): string {
  if (!p || typeof p !== "object") return "";
  const obj = p as Record<string, unknown>;
  const pt = obj.productType ?? obj.product_type ?? obj.type;
  return pt ? String(pt).toLowerCase() : "";
}

function matchesCategory(p: unknown, category: CategoryKey): boolean {
  if (category === "all") return true;

  const col = getCollectionsLower(p);
  const tags = getTagsLower(p);
  const pt = getProductTypeLower(p);

  if (category === "beer") {
    return (
      col.some((x) => x.includes("beer") || x.includes("пиво")) ||
      tags.some((x) => x.includes("beer") || x.includes("пиво")) ||
      pt.includes("beer") ||
      pt.includes("пиво")
    );
  }

  if (category === "cider") {
    return (
      col.some((x) => x.includes("cider") || x.includes("сидр")) ||
      tags.some((x) => x.includes("cider") || x.includes("сидр")) ||
      pt.includes("cider") ||
      pt.includes("сидр")
    );
  }

  if (category === "snacks") {
    return (
      col.some((x) => x.includes("snack") || x.includes("снек") || x.includes("закуск")) ||
      tags.some((x) => x.includes("snack") || x.includes("снек") || x.includes("закуск")) ||
      pt.includes("snack") ||
      pt.includes("снек") ||
      pt.includes("закуск")
    );
  }

  if (category === "gifts-sets") {
    return (
      col.some(
        (x) =>
          x.includes("gift") ||
          x.includes("set") ||
          x.includes("bundle") ||
          x.includes("набор") ||
          x.includes("подар")
      ) ||
      tags.some(
        (x) =>
          x.includes("gift") ||
          x.includes("set") ||
          x.includes("bundle") ||
          x.includes("набор") ||
          x.includes("подар")
      ) ||
      pt.includes("gift") ||
      pt.includes("set") ||
      pt.includes("bundle") ||
      pt.includes("набор") ||
      pt.includes("подар")
    );
  }

  if (category === "alcohol-free") {
    if (p && typeof p === "object") {
      const obj = p as Record<string, unknown>;
      const specs = obj.specs;
      if (specs && typeof specs === "object") {
        const abv = (specs as Record<string, unknown>).abv;
        const s = abv ? String(abv).trim() : "";
        if (s === "0" || s === "0.0") return true;
      }
    }

    return (
      col.some((x) => x.includes("alcohol-free") || x.includes("non-alcoholic") || x.includes("безалког")) ||
      tags.some((x) => x.includes("alcohol-free") || x.includes("non-alcoholic") || x.includes("безалког")) ||
      pt.includes("alcohol-free") ||
      pt.includes("non-alcoholic") ||
      pt.includes("безалког")
    );
  }

  return false;
}

function getHandle(p: unknown): string | null {
  if (!p || typeof p !== "object") return null;
  const h = (p as Record<string, unknown>).handle;
  return typeof h === "string" && h.length > 0 ? h : null;
}

function sortProducts<T extends { title?: string }>(list: T[], sort: SortKey): T[] {
  const arr = [...list];

  switch (sort) {
    case "price_asc":
      arr.sort((a, b) => getPriceNumber(a) - getPriceNumber(b));
      return arr;

    case "price_desc":
      arr.sort((a, b) => getPriceNumber(b) - getPriceNumber(a));
      return arr;

    case "title_asc":
      arr.sort((a, b) => String(a.title ?? "").localeCompare(String(b.title ?? "")));
      return arr;

    case "title_desc":
      arr.sort((a, b) => String(b.title ?? "").localeCompare(String(a.title ?? "")));
      return arr;

    case "new":
      arr.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
      return arr;

    case "best":
    default:
      return arr; // "best" обработаем отдельно, потому что зависит от reviewSummaries
  }
}

function getReviewAverage(s: ReviewSummary | undefined): number {
  const v = s ? (s as unknown as Record<string, unknown>).average : undefined;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function getReviewCount(s: ReviewSummary | undefined): number {
  const v = s ? (s as unknown as Record<string, unknown>).count : undefined;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

// ---------- page ----------

type SearchParamsShape = { category?: string | string[]; sort?: string | string[] };
type Props = {
  params: { lang: Locale } | Promise<{ lang: Locale }>;
  searchParams?: SearchParamsShape | Promise<SearchParamsShape>;
};

export default async function Page({ params, searchParams }: Props) {
  const resolvedParams = isThenable<{ lang: Locale }>(params) ? await params : params;

  const resolvedSearchParams = searchParams
    ? isThenable<SearchParamsShape>(searchParams)
      ? await searchParams
      : searchParams
    : undefined;

  const { lang } = resolvedParams;

  const t = await getMessages(lang);
  const allProducts = await fetchAllProductsFlattened(lang);

  const rawCategory = firstString(resolvedSearchParams?.category);
  const rawSort = firstString(resolvedSearchParams?.sort);

  const category: CategoryKey =
    rawCategory && isCategoryKey(rawCategory) ? rawCategory : "all";

  const sort: SortKey = rawSort && isSortKey(rawSort) ? rawSort : "best";

  const filtered = allProducts.filter((p) => matchesCategory(p, category));

  // Сначала собираем handles и тянем summary (нужно для "best")
  const filteredHandles = filtered
    .map(getHandle)
    .filter((h): h is string => Boolean(h));

  const reviewSummaries = await getReviewSummaryByHandle(filteredHandles);

  let finalProducts = filtered;

  if (sort === "best") {
    // best: сортируем по рейтингу (average desc), потом по кол-ву отзывов (count desc),
    // потом по названию (чтобы было стабильно)
    finalProducts = [...filtered]
      .map((p, idx) => ({ p, idx }))
      .sort((a, b) => {
        const ha = getHandle(a.p);
        const hb = getHandle(b.p);

        const sa = ha ? reviewSummaries[ha] : undefined;
        const sb = hb ? reviewSummaries[hb] : undefined;

        const avgDiff = getReviewAverage(sb) - getReviewAverage(sa);
        if (avgDiff !== 0) return avgDiff;

        const cntDiff = getReviewCount(sb) - getReviewCount(sa);
        if (cntDiff !== 0) return cntDiff;

        const titleA = String((a.p as unknown as { title?: unknown }).title ?? "");
        const titleB = String((b.p as unknown as { title?: unknown }).title ?? "");
        const nameDiff = titleA.localeCompare(titleB);
        if (nameDiff !== 0) return nameDiff;

        return a.idx - b.idx;
      })
      .map((x) => x.p);
  } else {
    finalProducts = sortProducts(filtered, sort);
  }

  // Отдаём summaries для текущего списка (уже есть), но можно сузить до final handles
  const finalHandles = finalProducts
    .map(getHandle)
    .filter((h): h is string => Boolean(h));

  const finalReviewSummaries: Record<string, ReviewSummary> = {};
  for (const h of finalHandles) {
    const s = reviewSummaries[h];
    if (s) finalReviewSummaries[h] = s;
  }

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
        reviewSummaries={finalReviewSummaries}
        activeCategory={category}
      />
    </main>
  );
}
