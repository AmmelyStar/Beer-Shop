// app/api/search/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

type ShopifyImage = {
  url: string;
  altText: string | null;
};

type ShopifyProductNode = {
  id: string;
  title: string;
  handle: string;
  featuredImage: ShopifyImage | null;
};

type ShopifyProductsResponse = {
  data?: {
    products?: {
      edges?: Array<{
        node: ShopifyProductNode;
      }>;
    };
  };
  errors?: unknown;
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export async function GET(req: Request) {
  try {
    if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) {
      return json({ error: "Missing Shopify env vars" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return json({ products: [] });
    }

    const query = `title:*${q}* OR handle:*${q}*`;

    const gql = `#graphql
      query SearchProducts($query: String!, $first: Int!) {
        products(first: $first, query: $query) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
                altText
              }
            }
          }
        }
      }
    `;

    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/2025-07/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: gql,
          variables: { query, first: 8 },
        }),
        cache: "no-store",
      }
    );

    const data = (await res.json()) as ShopifyProductsResponse;

    if (!res.ok || data.errors) {
      return json(
        { error: "Shopify search failed", details: data.errors },
        { status: 500 }
      );
    }

    const products =
      data.data?.products?.edges?.map(({ node }) => ({
        id: node.id,
        title: node.title,
        handle: node.handle,
        imageUrl: node.featuredImage?.url ?? null,
        imageAlt: node.featuredImage?.altText ?? null,
      })) ?? [];

    return json({ products });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, { status: 500 });
  }
}
