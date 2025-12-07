// app/lib/shopify/admin.ts

const adminDomain = process.env.SHOPIFY_STORE_DOMAIN!;
const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const adminVersion =
  process.env.SHOPIFY_ADMIN_API_VERSION || "2024-07";

if (!adminDomain || !adminToken) {
  console.warn("⚠️ Shopify Admin env vars are missing");
}

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
    // если вдруг не JSON
  }

  if (!res.ok) {
    throw new Error(
      `Shopify Admin REST error ${res.status}: ${JSON.stringify(json)}`
    );
  }

  return json as T;
}
