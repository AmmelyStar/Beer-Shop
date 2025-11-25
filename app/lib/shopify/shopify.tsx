// app/lib/shopify/index.ts

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; [key: string]: unknown }>;
};

// Домен магазина, например: "pw1tca-x0.myshopify.com"
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

// Admin API access token (Private app / custom app)
// пример имени переменной — подставь своё, если другое
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

// версия API — можешь поменять при необходимости
const SHOPIFY_ADMIN_API_VERSION = "2024-04";

/**
 * Запрос к Shopify Admin GraphQL API
 */
export async function shopifyAdminRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN) {
    throw new Error("SHOPIFY_STORE_DOMAIN is not set in environment variables");
  }
  if (!SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
    throw new Error(
      "SHOPIFY_ADMIN_API_ACCESS_TOKEN is not set in environment variables"
    );
  }

  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    // важно: выключаем кэш
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Shopify Admin API error: ${res.status} ${res.statusText} – ${text}`
    );
  }

  const json = (await res.json()) as GraphQLResponse<T>;

  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `Shopify Admin API GraphQL errors: ${JSON.stringify(json.errors)}`
    );
  }

  if (!json.data) {
    throw new Error("Shopify Admin API: response has no data");
  }

  return json.data;
}
