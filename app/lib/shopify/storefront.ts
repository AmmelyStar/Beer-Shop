// app/lib/shopify/storefront.ts

const domain = process.env.SHOPIFY_STORE_DOMAIN!;
const token = process.env.SHOPIFY_STOREFRONT_API_TOKEN!;
const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2024-04";

if (!domain || !token) {
  console.warn("⚠️ Shopify Storefront env vars are missing");
}

type ShopifyStorefrontVariables = Record<string, unknown>;

type ShopifyStorefrontGraphQLError = {
  message: string;
  extensions?: Record<string, unknown>;
  locations?: Array<{ line: number; column: number }>;
  path?: (string | number)[];
};

type ShopifyStorefrontResponse<T> = {
  data?: T;
  errors?: ShopifyStorefrontGraphQLError[];
};

type ShopifyStorefrontRequest = {
  query: string;
  variables?: ShopifyStorefrontVariables;
};

export async function shopifyStorefrontFetch<T>({
  query,
  variables,
}: ShopifyStorefrontRequest): Promise<T> {
  const res = await fetch(
    `https://${domain}/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const json = (await res.json()) as ShopifyStorefrontResponse<T>;

  if (!res.ok || (json.errors && json.errors.length > 0)) {
    throw new Error(
      `Shopify Storefront API error: ${JSON.stringify(
        json.errors ?? json,
      )}`
    );
  }

  if (!json.data) {
    throw new Error("Shopify Storefront API response has no data");
  }

  return json.data;
}
