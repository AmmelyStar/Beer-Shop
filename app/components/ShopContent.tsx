"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import type { FlattenedProduct } from "@/app/data/mappers";
import type { Locale } from "@/app/[lang]/messages";
import AllProducts from "@/app/components/AllProducts";
import type { ReviewSummary } from "@/app/lib/reviews/getReviewSummaryByHandle";

import TabsQuery from "@/app/components/ui/TabsQuery";
import { SortSelect } from "@/app/components/ui/SortSelect";

import { CATEGORY_KEYS, type CategoryKey } from "@/app/lib/shop/categories";

type SortLabels = {
  label: string;
  best: string;
  new: string;
  priceAsc: string;
  priceDesc: string;
  titleAsc: string;
  titleDesc: string;
};

type ShopTranslations = {
  title: string; // заголовок для "all"
  stars: string;
  reviews: string;
  add: string;
  alcohol: string;
  noProducts: string;
  noProductsDescription: string;
  categories: Record<CategoryKey, string>;
  sort: SortLabels;
};

export type ShopContentProps = {
  products: FlattenedProduct[];
  translations: ShopTranslations;
  lang: Locale;
  reviewSummaries: Record<string, ReviewSummary>;
  activeCategory: CategoryKey; // приходит с сервера/ShopClient
};

type SortKey =
  | "best"
  | "new"
  | "price_asc"
  | "price_desc"
  | "title_asc"
  | "title_desc";

/** sort может прилетать как snake_case (наш стандарт) или camelCase (старый вариант) */
function normalizeSort(raw: string | null): SortKey {
  if (!raw) return "best";

  const mapped =
    raw === "priceAsc"
      ? "price_asc"
      : raw === "priceDesc"
      ? "price_desc"
      : raw === "titleAsc"
      ? "title_asc"
      : raw === "titleDesc"
      ? "title_desc"
      : raw;

  return mapped === "best" ||
    mapped === "new" ||
    mapped === "price_asc" ||
    mapped === "price_desc" ||
    mapped === "title_asc" ||
    mapped === "title_desc"
    ? (mapped as SortKey)
    : "best";
}

/* =========================
   no-any helpers
========================= */

type UnknownRecord = Record<string, unknown>;

function isRecord(x: unknown): x is UnknownRecord {
  return typeof x === "object" && x !== null;
}

function toNumber(x: unknown): number | null {
  if (typeof x === "number") return Number.isFinite(x) ? x : null;
  if (typeof x === "string") {
    const n = Number(x.replace(",", "."));
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function getNested(obj: UnknownRecord, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (!isRecord(cur)) return undefined;
    cur = cur[key];
  }
  return cur;
}

function getArray0(obj: UnknownRecord, key: string): unknown {
  const v = obj[key];
  return Array.isArray(v) ? v[0] : undefined;
}

function getPriceNumber(p: unknown): number {
  if (!isRecord(p)) return Number.POSITIVE_INFINITY;

  const candidates: unknown[] = [
    p["priceAmount"],
    getNested(p, ["price", "amount"]),
    getNested(p, ["price", "value"]),
    p["price"],

    // variants[0].price.*
    (() => {
      const v0 = getArray0(p, "variants");
      return isRecord(v0) ? getNested(v0, ["price", "amount"]) : undefined;
    })(),
    (() => {
      const v0 = getArray0(p, "variants");
      return isRecord(v0) ? getNested(v0, ["price", "value"]) : undefined;
    })(),
    (() => {
      const v0 = getArray0(p, "variants");
      return isRecord(v0) ? v0["price"] : undefined;
    })(),

    // priceRange.minVariantPrice.*
    getNested(p, ["priceRange", "minVariantPrice", "amount"]),
    getNested(p, ["priceRange", "minVariantPrice", "value"]),
    getNested(p, ["priceRange", "minVariantPrice"]),

    p["minPrice"],
    p["min_price"],
  ];

  for (const c of candidates) {
    if (isRecord(c)) {
      const n = toNumber(c["amount"] ?? c["value"]);
      if (n !== null) return n;
    } else {
      const n = toNumber(c);
      if (n !== null) return n;
    }
  }

  return Number.POSITIVE_INFINITY;
}

function getCreatedAtMs(p: unknown): number {
  if (!isRecord(p)) return 0;

  const raw =
    p["createdAt"] ??
    p["created_at"] ??
    p["publishedAt"] ??
    p["published_at"] ??
    p["updatedAt"] ??
    p["updated_at"];

  if (raw == null) return 0;
  const t = Date.parse(String(raw));
  return Number.isNaN(t) ? 0 : t;
}

function getTitle(p: unknown): string {
  if (!isRecord(p)) return "";
  const t = p["title"];
  return t == null ? "" : String(t);
}

function sortProducts<T>(list: T[], sort: SortKey): T[] {
  const arr = [...list];

  switch (sort) {
    case "price_asc":
      arr.sort((a, b) => getPriceNumber(a) - getPriceNumber(b));
      return arr;

    case "price_desc":
      arr.sort((a, b) => getPriceNumber(b) - getPriceNumber(a));
      return arr;

    case "title_asc":
      arr.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
      return arr;

    case "title_desc":
      arr.sort((a, b) => getTitle(b).localeCompare(getTitle(a)));
      return arr;

    case "new":
      arr.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
      return arr;

    case "best":
    default:
      return arr;
  }
}

/* =========================
   Component
========================= */

export default function ShopContent({
  products,
  translations,
  lang,
  reviewSummaries,
  activeCategory,
}: ShopContentProps) {
  const sp = useSearchParams();
  const sortKey = normalizeSort(sp.get("sort"));

  // сортируем на клиенте (чтобы реально менялось при выборе в select)
  const finalProducts = React.useMemo(
    () => sortProducts(products, sortKey),
    [products, sortKey]
  );

  const hasProducts = finalProducts.length > 0;

  const pageTitle =
    activeCategory === "all"
      ? translations.title
      : translations.categories[activeCategory] ?? translations.title;

  return (
    <section className="mt-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsQuery<CategoryKey>
          keys={CATEGORY_KEYS}
          labels={translations.categories}
          paramKey="category"
          isKey={(x): x is CategoryKey =>
            (CATEGORY_KEYS as readonly string[]).includes(x)
          }
        />

        <SortSelect labels={translations.sort} />
      </div>

      {!hasProducts ? (
        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">
            {translations.noProducts}
          </h3>
          <p className="mt-2 text-sm text-gray-300">
            {translations.noProductsDescription}
          </p>
        </div>
      ) : (
        <AllProducts
          title={pageTitle}
          stars={translations.stars}
          reviews={translations.reviews}
          add={translations.add}
          alcohol={translations.alcohol}
          lang={lang}
          products={finalProducts}
          reviewSummaries={reviewSummaries}
        />
      )}
    </section>
  );
}
