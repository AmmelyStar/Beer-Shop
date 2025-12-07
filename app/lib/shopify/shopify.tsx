// app/lib/shopify/index.ts

// ===== Общий тип ответа GraphQL =====
type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; [key: string]: unknown }>;
};

// ===== Общие переменные =====
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;

// ===== ADMIN API ===================================================

const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

const SHOPIFY_ADMIN_API_VERSION =
  process.env.SHOPIFY_ADMIN_API_VERSION ?? "2024-07";

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

// ===== STOREFRONT API ==============================================

type StorefrontResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; [key: string]: unknown }>;
};

const SHOPIFY_STOREFRONT_API_VERSION =
  process.env.SHOPIFY_STOREFRONT_API_VERSION ?? "2024-07";

const SHOPIFY_STOREFRONT_ACCESS_TOKEN =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

// URL собираем из домена + версии
const SHOPIFY_STOREFRONT_API_URL = SHOPIFY_STORE_DOMAIN
  ? `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_STOREFRONT_API_VERSION}/graphql.json`
  : undefined;

/**
 * Запрос к Shopify Storefront GraphQL API
 */
export async function shopifyStorefrontRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN) {
    throw new Error("SHOPIFY_STORE_DOMAIN is not set in environment variables");
  }
  if (!SHOPIFY_STOREFRONT_API_URL) {
    throw new Error(
      "SHOPIFY_STOREFRONT_API_URL cannot be built – check SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_API_VERSION"
    );
  }
  if (!SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    throw new Error(
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set in environment variables"
    );
  }

  const res = await fetch(SHOPIFY_STOREFRONT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Shopify Storefront API error: ${res.status} ${res.statusText} – ${text}`
    );
  }

  const json = (await res.json()) as StorefrontResponse<T>;

  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `Shopify Storefront API GraphQL errors: ${JSON.stringify(json.errors)}`
    );
  }

  if (!json.data) {
    throw new Error("Shopify Storefront API: response has no data");
  }

  return json.data;
}
