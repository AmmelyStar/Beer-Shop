// app/lib/shopify/getBrands.ts

export type BrandItem = {
  id: string;
  name: string;
  logo: string; // URL
  url?: string;
  order?: number;
  active?: boolean;
};

type ShopifyImageRef = {
  image: {
    url: string;
    altText?: string | null;
  };
};

type MetaobjectField = {
  key: string;
  value?: string | null;
  reference?: ShopifyImageRef | null;
};

type MetaobjectNode = {
  id: string;
  handle?: string | null;
  fields: MetaobjectField[];
};

type MetaobjectsResponse = {
  data?: {
    metaobjects?: {
      nodes?: MetaobjectNode[];
    };
  };
  errors?: Array<{ message: string }>;
};

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN; // yourstore.myshopify.com
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

function pickField(fields: MetaobjectField[], key: string): MetaobjectField | undefined {
  return fields.find((f) => f.key === key);
}

export async function getBrandsFromShopify(): Promise<BrandItem[]> {
  if (!SHOPIFY_DOMAIN || !STOREFRONT_TOKEN) return [];

  const query = `
    query Brands($first: Int!) {
      metaobjects(type: "brand", first: $first) {
        nodes {
          id
          handle
          fields {
            key
            value
            reference {
              ... on MediaImage {
                image {
                  url
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-07/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables: { first: 50 } }),
    next: { revalidate: 600 }, // 10 минут
  });

  if (!res.ok) return [];

  const json: MetaobjectsResponse = await res.json();
  const nodes = json.data?.metaobjects?.nodes ?? [];

  const brands: BrandItem[] = nodes
    .map((node) => {
      const name = pickField(node.fields, "name")?.value ?? "";
      const url = pickField(node.fields, "url")?.value ?? undefined;
      const logo =
  pickField(node.fields, "logo")?.reference?.image.url ??
  pickField(node.fields, "logo1")?.reference?.image.url ??
  "";

      const orderValue = pickField(node.fields, "order")?.value;
      const activeValue = pickField(node.fields, "active")?.value;

      return {
        id: node.handle ?? node.id,
        name,
        logo,
        url,
        order: orderValue ? Number(orderValue) : undefined,
        active: activeValue ? activeValue === "true" : undefined,
      };
    })
    .filter((b) => Boolean(b.name) && Boolean(b.logo))
    .filter((b) => (b.active === undefined ? true : b.active))
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

  return brands;
}
