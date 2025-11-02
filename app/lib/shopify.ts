const domain = process.env.SHOPIFY_STORE_DOMAIN!;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!;
const apiVersion = process.env.SHOPIFY_STOREFRONT_API_VERSION!;

type ShopifyVariables = Record<string, unknown>;

export async function shopifyRequest<T>(
  query: string,
  variables: ShopifyVariables = {}
): Promise<T> {
  const res = await fetch(
    `https://${domain}/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.error("[Shopify HTTP error]", res.status, await res.text());
    throw new Error("Shopify request failed");
  }

  const data = await res.json();

  if (data.errors) {
    console.error("[Shopify GQL errors]", data.errors);
    throw new Error("Shopify GraphQL error");
  }

  return data.data as T;
}
