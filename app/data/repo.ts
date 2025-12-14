// app/data/repo.ts
import { shopifyFetchWithLocale } from "../lib/shopify/client";

import {
  PRODUCTS_ALL_WITH_METAFIELDS,
  PRODUCTS_BY_COLLECTION,
  PRODUCT_BY_HANDLE,
  PRODUCT_BY_ID,
} from "../lib/shopify/queries/products.gql";
import { PAGE_BY_HANDLE } from "../lib/shopify/queries/pages.gql";

import {
  ProductsAllResponse,
  ProductNode,
  ProductsByCollectionResponse,
  ProductByHandleResponse,
  ShopifyPage,
} from "./types";
import {
  flattenMetafields,
  flattenProducts,
  FlattenedProduct,
} from "./mappers";

// Локали фронта
import type { Locale } from "../lib/locale";
// вспомогательный тип для edges
type Edge<T> = { cursor?: string | null; node: T };

/** ---------- Все продукты ---------- */
export async function fetchAllProducts(
  locale: Locale = "en"
): Promise<ProductNode[]> {
  const pageSize = 250;
  let after: string | null = null;
  const acc: ProductNode[] = [];

  do {
    const response: ProductsAllResponse =
      await shopifyFetchWithLocale<ProductsAllResponse>(
        PRODUCTS_ALL_WITH_METAFIELDS,
        { first: pageSize, after },
        locale,
        60
      );

    const edges = response.products.edges as Array<Edge<ProductNode>>;
    acc.push(...edges.map((e) => e.node));

    after = response.products.pageInfo.hasNextPage
      ? response.products.pageInfo.endCursor
      : null;
  } while (after);

  return acc;
}

export async function fetchAllProductsFlattened(
  locale: Locale = "en"
): Promise<FlattenedProduct[]> {
  const nodes = await fetchAllProducts(locale);

  return flattenProducts(nodes);
}

/** ---------- Продукты по коллекции ---------- */
export async function fetchCollectionProducts(
  handle: string,
  locale: Locale = "en"
): Promise<ProductNode[]> {
  const pageSize = 250;
  let after: string | null = null;
  const acc: ProductNode[] = [];

  do {
    const response: ProductsByCollectionResponse =
      await shopifyFetchWithLocale<ProductsByCollectionResponse>(
        PRODUCTS_BY_COLLECTION,
        { handle, first: pageSize, after },
        locale,
        60
      );

    const block = response.collection?.products as
      | {
          edges: Array<Edge<ProductNode>>;
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        }
      | undefined;

    if (!block) break;

    acc.push(...block.edges.map((e) => e.node));
    after = block.pageInfo.hasNextPage ? block.pageInfo.endCursor : null;
  } while (after);

  return acc;
}

export async function fetchCollectionProductsFlattened(
  handle: string,
  locale: Locale = "en"
): Promise<FlattenedProduct[]> {
  const nodes = await fetchCollectionProducts(handle, locale);
  return flattenProducts(nodes);
}

/** ---------- Один продукт по handle ---------- */
export async function fetchProductByHandleFlattened(
  handle: string,
  locale: Locale = "en"
): Promise<FlattenedProduct | null> {
  if (!handle) return null;

  const response = await shopifyFetchWithLocale<ProductByHandleResponse>(
    PRODUCT_BY_HANDLE,
    { handle },
    locale,
    60
  );

  if (!response.product) return null;

  return flattenMetafields(response.product);
}

/** ---------- Страница по handle (Shopify Pages) ---------- */
export async function fetchPageByHandle(
  handle: string,
  locale: Locale = "en"
): Promise<ShopifyPage | null> {
  if (!handle) return null;

  const response = await shopifyFetchWithLocale<{ page: ShopifyPage | null }>(
    PAGE_BY_HANDLE,
    { handle },
    locale,
    60
  );

  return response.page;
}

/** ---------- Один продукт по Shopify numeric ID ---------- */
export async function fetchProductByShopifyNumericIdFlattened(
  numericId: string,
  locale: Locale = "en"
): Promise<FlattenedProduct | null> {
  if (!numericId) return null;

  // Shopify global ID вида gid://shopify/Product/10211423584603
  const globalId = `gid://shopify/Product/${numericId}`;

  const response = await shopifyFetchWithLocale<ProductByHandleResponse>(
    PRODUCT_BY_ID,
    { id: globalId },
    locale,
    60
  );

  if (!response.product) return null;

  return flattenMetafields(response.product);
}
