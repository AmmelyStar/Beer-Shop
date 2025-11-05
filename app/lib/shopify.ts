// app/lib/shopify.ts

// ─────────────────────────────────────────────
// Storefront API (чтение публичных данных для витрины)
// ─────────────────────────────────────────────

type ShopifyVariables = Record<string, unknown>;

type ShopifyGraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
  extensions?: Record<string, unknown>;
};

/**
 * Витринный запрос к Storefront API
 * Требует:
 *  - SHOPIFY_STORE_DOMAIN=pw1tca-x0.myshopify.com
 *  - SHOPIFY_STOREFRONT_ACCESS_TOKEN=...
 *  - SHOPIFY_STOREFRONT_API_VERSION=2024-10 (или твоя)
 */
export async function shopifyRequest<T>(
  query: string,
  variables: ShopifyVariables = {},
  opts?: { tags?: string[]; revalidate?: number | 0 | false }
): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN!;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
  const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION || "2024-10";

  if (!domain || !token) {
    throw new Error(
      "[Storefront] Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN"
    );
  }

  const res = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    // важно для RSC/Next 15–16
    next: {
      revalidate: opts?.revalidate ?? 0,
      ...(opts?.tags ? { tags: opts.tags } : {}),
    },
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error("[Shopify HTTP error]", res.status, text);
    throw new Error(`Shopify HTTP ${res.status}`);
  }

  const payload: ShopifyGraphQLResponse<T> = JSON.parse(text);
  if (payload.errors?.length) {
    // eslint-disable-next-line no-console
    console.error("[Shopify GQL errors]", JSON.stringify(payload.errors, null, 2));
    const msg = payload.errors.map((e) => e.message).join(" | ");
    throw new Error(`Shopify GraphQL error: ${msg}`);
  }

  if (!payload.data) {
    throw new Error("Shopify: empty response data");
  }

  return payload.data;
}

// ─────────────────────────────────────────────
// Admin API (запись/сервисные операции: метаполя и т.п.)
// ─────────────────────────────────────────────

/**
 * Админский запрос к Admin API (GraphQL)
 * Требует:
 *  - SHOPIFY_STORE_DOMAIN=pw1tca-x0.myshopify.com
 *  - SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_...
 *  - SHOPIFY_ADMIN_API_VERSION=2024-10 (или твоя)
 */
export async function shopifyAdminRequest<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN!;
  const token = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
  const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";

  if (!domain || !token) {
    throw new Error(
      "[Admin] Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_ACCESS_TOKEN"
    );
  }

  const endpoint = `https://${domain}/admin/api/${apiVersion}/graphql.json`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error("[Shopify Admin HTTP error]", res.status, text);
    throw new Error(`Shopify Admin HTTP ${res.status}`);
  }

  const payload: ShopifyGraphQLResponse<T> = JSON.parse(text);
  if (payload.errors?.length) {
    // eslint-disable-next-line no-console
    console.error("[Shopify Admin GQL errors]", JSON.stringify(payload.errors, null, 2));
    const msg = payload.errors.map((e) => e.message).join(" | ");
    throw new Error(`Shopify Admin GraphQL error: ${msg}`);
  }

  if (!payload.data) {
    throw new Error("Shopify Admin: empty response data");
  }

  return payload.data;
}
