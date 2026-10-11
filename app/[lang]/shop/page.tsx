// app/[lang]/shop/page.tsx

import {
  fetchAllProductsFlattened,
} from "../../data/repo";

import ShopContent from "@/app/components/ShopContent";
import Breadcrumbs from "@/app/components/ui/Breadcrumbs";

import type { Locale } from "../../lib/locale";
import { getMessages } from "../messages";

import {
  getReviewSummaryByHandle,
} from "@/app/lib/reviews/getReviewSummaryByHandle";

import {
  CATEGORY_KEYS,
  CATEGORY_TO_COLLECTION_HANDLE,
  isCategoryKey,
  type CategoryKey,
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

function isSortKey(
  value: unknown,
): value is SortKey {
  return (
    typeof value === "string" &&
    (
      SORT_KEYS as readonly string[]
    ).includes(value)
  );
}

function getPriceNumber(
  product: unknown,
): number {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const object =
    product as Record<string, unknown>;

  const priceAmount =
    object.priceAmount;

  if (
    typeof priceAmount === "number"
  ) {
    return priceAmount;
  }

  if (
    typeof priceAmount === "string"
  ) {
    const number =
      Number(priceAmount);

    return Number.isNaN(number)
      ? Number.POSITIVE_INFINITY
      : number;
  }

  const price = object.price;

  if (
    price &&
    typeof price === "object"
  ) {
    const amount = (
      price as Record<string, unknown>
    ).amount;

    if (
      typeof amount === "number"
    ) {
      return amount;
    }

    if (
      typeof amount === "string"
    ) {
      const number = Number(amount);

      return Number.isNaN(number)
        ? Number.POSITIVE_INFINITY
        : number;
    }
  }

  return Number.POSITIVE_INFINITY;
}

function getCreatedAtMs(
  product: unknown,
): number {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return 0;
  }

  const object =
    product as Record<string, unknown>;

  const raw =
    object.createdAt ??
    object.created_at ??
    object.publishedAt ??
    object.published_at ??
    object.updatedAt ??
    object.updated_at;

  if (!raw) {
    return 0;
  }

  const time = Date.parse(
    String(raw),
  );

  return Number.isNaN(time)
    ? 0
    : time;
}

function getCollectionHandlesLower(
  product: unknown,
): string[] {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return [];
  }

  const object =
    product as Record<string, unknown>;

  const collectionHandles =
    object.collectionHandles;

  if (
    Array.isArray(collectionHandles)
  ) {
    return collectionHandles
      .map((value) =>
        String(value)
          .toLowerCase()
          .trim(),
      )
      .filter(Boolean);
  }

  const collections =
    object.collections;

  if (Array.isArray(collections)) {
    return collections
      .map((collection) => {
        if (
          typeof collection === "string"
        ) {
          return collection;
        }

        if (
          collection &&
          typeof collection === "object"
        ) {
          const collectionObject =
            collection as Record<
              string,
              unknown
            >;

          return String(
            collectionObject.handle ??
              collectionObject.title ??
              collectionObject.name ??
              "",
          );
        }

        return "";
      })
      .map((value) =>
        value
          .toLowerCase()
          .trim(),
      )
      .filter(Boolean);
  }

  return [];
}

function getTagsLower(
  product: unknown,
): string[] {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return [];
  }

  const object =
    product as Record<string, unknown>;

  const tags = object.tags;

  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .map((value) =>
      String(value)
        .toLowerCase()
        .trim(),
    )
    .filter(Boolean);
}

function getProductTypeLower(
  product: unknown,
): string {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return "";
  }

  const object =
    product as Record<string, unknown>;

  const productType =
    object.productType ??
    object.product_type ??
    object.type;

  return productType
    ? String(productType)
        .toLowerCase()
        .trim()
    : "";
}

function matchesCategory(
  product: unknown,
  category: CategoryKey,
): boolean {
  if (category === "all") {
    return true;
  }

  const handles =
    getCollectionHandlesLower(product);

  const tags =
    getTagsLower(product);

  const productType =
    getProductTypeLower(product);

  const targetHandle =
    CATEGORY_TO_COLLECTION_HANDLE[
      category
    ].toLowerCase();

  /*
   * Для бутылочного и разливного
   * пива используем строгое
   * совпадение.
   */
  if (category === "bottle-beer") {
    return (
      tags.includes("bottle-beer") ||
      handles.includes("bottle-beer")
    );
  }

  if (category === "draft-beer") {
    return (
      tags.includes("draft-beer") ||
      handles.includes("draft-beer")
    );
  }

  if (
    tags.includes(targetHandle) ||
    handles.includes(targetHandle)
  ) {
    return true;
  }

  const aliases: Record<
    CategoryKey,
    string[]
  > = {
    all: ["all"],

    "bottle-beer": [
      "bottle-beer",
    ],

    "draft-beer": [
      "draft-beer",
    ],

    cider: [
      "cider",
      "siider",
      "sidr",
      "сидр",
    ],

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

    snacks: [
      "snacks",
      "snack",
      "chips",
      "crisps",
      "nuts",
      "закус",
      "снеки",
    ],

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

  const values = [
    ...tags,
    ...handles,
    productType,
  ].filter(Boolean);

  const searchValues = [
    targetHandle,
    ...aliases[category],
  ].map((value) =>
    value.toLowerCase(),
  );

  return values.some((value) =>
    searchValues.some(
      (searchValue) =>
        value.includes(searchValue),
    ),
  );
}

function sortProducts<
  T extends {
    title?: string;
  },
>(
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
          String(
            first.title ?? "",
          ).localeCompare(
            String(
              second.title ?? "",
            ),
          ),
      );
      return products;

    case "title_desc":
      products.sort(
        (first, second) =>
          String(
            second.title ?? "",
          ).localeCompare(
            String(
              first.title ?? "",
            ),
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

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{
    lang: Locale;
  }>;

  searchParams?: Promise<{
    category?: string;
    sort?: string;
  }>;
}) {
  const { lang } = await params;

  const search = searchParams
    ? await searchParams
    : {};

  const translations =
    await getMessages(lang);

  /*
   * Получаем все товары один раз.
   * На их основании определяем,
   * какие вкладки должны отображаться.
   */
  const allProducts =
    await fetchAllProductsFlattened(
      lang,
    );

  const availableCategories =
    CATEGORY_KEYS.filter(
      (category) =>
        category === "all" ||
        allProducts.some((product) =>
          matchesCategory(
            product,
            category,
          ),
        ),
    );

  const requestedCategory:
    CategoryKey =
    search.category &&
    isCategoryKey(search.category)
      ? search.category
      : "all";

  /*
   * Если категория стала пустой,
   * показываем "Все товары".
   */
  const category: CategoryKey =
    availableCategories.includes(
      requestedCategory,
    )
      ? requestedCategory
      : "all";

  const sort: SortKey =
    search.sort &&
    isSortKey(search.sort)
      ? search.sort
      : "best";

  const filteredProducts =
    allProducts.filter((product) =>
      matchesCategory(
        product,
        category,
      ),
    );

  const finalProducts =
    sortProducts(
      filteredProducts,
      sort,
    );

  const handles = finalProducts
    .map((product) =>
      product.handle,
    )
    .filter(
      (
        handle,
      ): handle is string =>
        Boolean(handle),
    );

  const reviewSummaries =
    await getReviewSummaryByHandle(
      handles,
    );

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <Breadcrumbs
        lang={lang}
        labels={{
          home:
            translations.common.home,
          shop:
            translations.common.shop,
          categories:
            translations.AllProducts
              .categories,
        }}
      />

      <ShopContent
        products={finalProducts}
        translations={
          translations.AllProducts
        }
        lang={lang}
        reviewSummaries={
          reviewSummaries
        }
        activeCategory={category}
        availableCategories={
          availableCategories
        }
      />
    </main>
  );
}