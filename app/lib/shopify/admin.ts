// app/lib/shopify/admin.ts

import "server-only";

const adminDomain = (
  process.env.SHOPIFY_STORE_DOMAIN ?? ""
)
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const adminToken =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN ?? "";
const adminVersion =
  process.env.SHOPIFY_ADMIN_API_VERSION || "2026-10";

if (!adminDomain || !adminToken) {
  console.warn("⚠️ Shopify Admin env vars are missing");
}

type ShopifyGraphqlError = {
  message: string;
  extensions?: Record<string, unknown>;
};

type ShopifyGraphqlResponse<T> = {
  data?: T;
  errors?: ShopifyGraphqlError[];
};

export async function shopifyAdminRestFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `https://${adminDomain}/admin/api/${adminVersion}/${path}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  let json: unknown = null;

  try {
    json = await res.json();
  } catch {
    // Ответ может оказаться не JSON
  }

  if (!res.ok) {
    throw new Error(
      `Shopify Admin REST error ${res.status}: ${JSON.stringify(json)}`
    );
  }

  return json as T;
}

export async function shopifyAdminGraphqlFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const url = `https://${adminDomain}/admin/api/${adminVersion}/graphql.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    cache: "no-store",
  });

  let json: ShopifyGraphqlResponse<T>;

  try {
    json = (await res.json()) as ShopifyGraphqlResponse<T>;
  } catch {
    throw new Error(
      `Shopify Admin GraphQL returned an invalid response (${res.status})`
    );
  }

  if (!res.ok) {
    throw new Error(
      `Shopify Admin GraphQL error ${res.status}: ${JSON.stringify(json)}`
    );
  }

  if (json.errors?.length) {
    throw new Error(
      `Shopify Admin GraphQL errors: ${JSON.stringify(json.errors)}`
    );
  }

  if (!json.data) {
    throw new Error(
      "Shopify Admin GraphQL response does not contain data"
    );
  }

  return json.data;
}