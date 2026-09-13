// app/lib/shopify/storefront.ts

const SHOPIFY_STORE_DOMAIN =
  process.env.SHOPIFY_STORE_DOMAIN;

const SHOPIFY_STOREFRONT_ACCESS_TOKEN =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

const SHOPIFY_STOREFRONT_API_VERSION =
  process.env.SHOPIFY_STOREFRONT_API_VERSION ??
  "2024-04";

type ShopifyStorefrontVariables =
  Record<string, unknown>;

type ShopifyGraphQLError = {
  message: string;
  extensions?: Record<string, unknown>;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
};

type ShopifyGraphQLResponse<T> = {
  data?: T;
  errors?: ShopifyGraphQLError[];
};

type ShopifyStorefrontRequest = {
  query: string;
  variables?: ShopifyStorefrontVariables;
};

export async function shopifyStorefrontFetch<T>({
  query,
  variables = {},
}: ShopifyStorefrontRequest): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN is missing"
    );
  }

  if (!SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    throw new Error(
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN is missing"
    );
  }

  const endpoint =
    `https://${SHOPIFY_STORE_DOMAIN}/api/` +
    `${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token":
        SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    cache: "no-store",
  });

  const result =
    (await response.json()) as
      ShopifyGraphQLResponse<T>;

  if (!response.ok) {
    throw new Error(
      `Shopify Storefront API error ${response.status}: ` +
        JSON.stringify(result)
    );
  }

  if (result.errors?.length) {
    console.error(
      "Shopify Storefront GraphQL errors:",
      JSON.stringify(result.errors, null, 2)
    );

    throw new Error(
      result.errors[0]?.message ??
        "Shopify Storefront GraphQL error"
    );
  }

  if (!result.data) {
    throw new Error(
      "Shopify Storefront API response has no data"
    );
  }

  return result.data;
}