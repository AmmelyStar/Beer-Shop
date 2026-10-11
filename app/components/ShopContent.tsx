"use client";

import * as React from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import type { FlattenedProduct } from "@/app/data/mappers";
import type { Locale } from "@/app/[lang]/messages";
import AllProducts from "@/app/components/AllProducts";
import type { ReviewSummary } from "@/app/lib/reviews/getReviewSummaryByHandle";

import TabsQuery from "@/app/components/ui/TabsQuery";
import { SortSelect } from "@/app/components/ui/SortSelect";

import {
  CATEGORY_KEYS,
  type CategoryKey,
} from "@/app/lib/shop/categories";

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
  title: string;
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
  reviewSummaries: Record<
    string,
    ReviewSummary
  >;
  activeCategory: CategoryKey;

  /*
   * Список категорий, в которых есть товары.
   * Формируется в родительском серверном компоненте.
   */
  availableCategories: CategoryKey[];
};

type SortKey =
  | "best"
  | "new"
  | "price_asc"
  | "price_desc"
  | "title_asc"
  | "title_desc";

function normalizeSort(
  raw: string | null,
): SortKey {
  if (!raw) {
    return "best";
  }

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

type UnknownRecord = Record<
  string,
  unknown
>;

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function toNumber(
  value: unknown,
): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (typeof value === "string") {
    const number = Number(
      value.replace(",", "."),
    );

    return Number.isNaN(number)
      ? null
      : number;
  }

  return null;
}

function getNested(
  object: UnknownRecord,
  path: string[],
): unknown {
  let current: unknown = object;

  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[key];
  }

  return current;
}

function getArrayFirst(
  object: UnknownRecord,
  key: string,
): unknown {
  const value = object[key];

  return Array.isArray(value)
    ? value[0]
    : undefined;
}

function getPriceNumber(
  product: unknown,
): number {
  if (!isRecord(product)) {
    return Number.POSITIVE_INFINITY;
  }

  const candidates: unknown[] = [
    product["priceAmount"],
    getNested(product, [
      "price",
      "amount",
    ]),
    getNested(product, [
      "price",
      "value",
    ]),
    product["price"],

    (() => {
      const variant =
        getArrayFirst(
          product,
          "variants",
        );

      return isRecord(variant)
        ? getNested(variant, [
            "price",
            "amount",
          ])
        : undefined;
    })(),

    (() => {
      const variant =
        getArrayFirst(
          product,
          "variants",
        );

      return isRecord(variant)
        ? getNested(variant, [
            "price",
            "value",
          ])
        : undefined;
    })(),

    (() => {
      const variant =
        getArrayFirst(
          product,
          "variants",
        );

      return isRecord(variant)
        ? variant["price"]
        : undefined;
    })(),

    getNested(product, [
      "priceRange",
      "minVariantPrice",
      "amount",
    ]),

    getNested(product, [
      "priceRange",
      "minVariantPrice",
      "value",
    ]),

    getNested(product, [
      "priceRange",
      "minVariantPrice",
    ]),

    product["minPrice"],
    product["min_price"],
  ];

  for (const candidate of candidates) {
    if (isRecord(candidate)) {
      const number = toNumber(
        candidate["amount"] ??
          candidate["value"],
      );

      if (number !== null) {
        return number;
      }
    } else {
      const number =
        toNumber(candidate);

      if (number !== null) {
        return number;
      }
    }
  }

  return Number.POSITIVE_INFINITY;
}

function getCreatedAtMs(
  product: unknown,
): number {
  if (!isRecord(product)) {
    return 0;
  }

  const raw =
    product["createdAt"] ??
    product["created_at"] ??
    product["publishedAt"] ??
    product["published_at"] ??
    product["updatedAt"] ??
    product["updated_at"];

  if (raw == null) {
    return 0;
  }

  const time = Date.parse(
    String(raw),
  );

  return Number.isNaN(time)
    ? 0
    : time;
}

function getTitle(
  product: unknown,
): string {
  if (!isRecord(product)) {
    return "";
  }

  const title = product["title"];

  return title == null
    ? ""
    : String(title);
}

function sortProducts<T>(
  list: T[],
  sort: SortKey,
): T[] {
  const products = [...list];

  switch (sort) {
    case "price_asc":
      products.sort(
        (first, second) =>
          getPriceNumber(first) -
          getPriceNumber(second),
      );
      return products;

    case "price_desc":
      products.sort(
        (first, second) =>
          getPriceNumber(second) -
          getPriceNumber(first),
      );
      return products;

    case "title_asc":
      products.sort(
        (first, second) =>
          getTitle(first).localeCompare(
            getTitle(second),
          ),
      );
      return products;

    case "title_desc":
      products.sort(
        (first, second) =>
          getTitle(second).localeCompare(
            getTitle(first),
          ),
      );
      return products;

    case "new":
      products.sort(
        (first, second) =>
          getCreatedAtMs(second) -
          getCreatedAtMs(first),
      );
      return products;

    case "best":
    default:
      return products;
  }
}

export default function ShopContent({
  products,
  translations,
  lang,
  reviewSummaries,
  activeCategory,
  availableCategories,
}: ShopContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams =
    useSearchParams();

  const sortKey = normalizeSort(
    searchParams.get("sort"),
  );

  const finalProducts =
    React.useMemo(
      () =>
        sortProducts(
          products,
          sortKey,
        ),
      [products, sortKey],
    );

  const visibleCategoryKeys =
    React.useMemo(() => {
      const availableSet =
        new Set<CategoryKey>(
          availableCategories,
        );

      /*
       * "Все товары" оставляем всегда.
       * Остальные категории показываем,
       * только если они есть в
       * availableCategories.
       */
      return CATEGORY_KEYS.filter(
        (category) =>
          category === "all" ||
          availableSet.has(category),
      );
    }, [availableCategories]);

  const activeCategoryExists =
    visibleCategoryKeys.includes(
      activeCategory,
    );

  /*
   * Если пользователь открыл по старой
   * ссылке категорию, в которой товаров
   * больше нет, переводим его на
   * "Все товары".
   */
  React.useEffect(() => {
    if (
      activeCategory === "all" ||
      activeCategoryExists
    ) {
      return;
    }

    const nextParams =
      new URLSearchParams(
        searchParams.toString(),
      );

    nextParams.delete("category");

    const query =
      nextParams.toString();

    router.replace(
      query
        ? `${pathname}?${query}`
        : pathname,
      {
        scroll: false,
      },
    );
  }, [
    activeCategory,
    activeCategoryExists,
    pathname,
    router,
    searchParams,
  ]);

  const hasProducts =
    finalProducts.length > 0;

  const pageTitle =
    activeCategory === "all"
      ? translations.title
      : translations.categories[
          activeCategory
        ] ?? translations.title;

  return (
    <section className="mt-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <TabsQuery<CategoryKey>
          keys={visibleCategoryKeys}
          labels={
            translations.categories
          }
          paramKey="category"
          isKey={(
            value,
          ): value is CategoryKey =>
            (
              CATEGORY_KEYS as readonly string[]
            ).includes(value)
          }
        />

        <SortSelect
          labels={translations.sort}
        />
      </div>

      {!hasProducts ? (
        <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">
            {
              translations.noProducts
            }
          </h3>

          <p className="mt-2 text-sm text-gray-300">
            {
              translations.noProductsDescription
            }
          </p>
        </div>
      ) : (
        <AllProducts
          title={pageTitle}
          stars={translations.stars}
          reviews={
            translations.reviews
          }
          add={translations.add}
          alcohol={
            translations.alcohol
          }
          lang={lang}
          products={finalProducts}
          reviewSummaries={
            reviewSummaries
          }
        />
      )}
    </section>
  );
}