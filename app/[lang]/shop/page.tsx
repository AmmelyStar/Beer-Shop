import Image from "next/image";
import { shopifyRequest } from "../../lib/shopify";

// Тип одного товара
type ProductNode = {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {
    url: string;
    altText: string | null;
  } | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
};

// Тип ответа Shopify GraphQL
type ShopifyProductsResponse = {
  products: {
    edges: {
      node: ProductNode;
    }[];
  };
};

// ✅ ВАЖНО: params теперь Promise<{ lang: string }>
export default async function ShopPage(props: {
  params: Promise<{ lang: string }>;
}) {
  // Распаковываем промис с params
  const { lang } = await props.params;

  // GraphQL-запрос к Shopify Storefront API
  const query = `
    query GetProducts {
      products(first: 30) {
        edges {
          node {
            id
            title
            handle
            featuredImage {
              url
              altText
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  // Запрос за данными
  const data = await shopifyRequest<ShopifyProductsResponse>(query);

  // Превращаем edges → массив товаров
  const products: ProductNode[] = data.products.edges.map((e) => e.node);

  return (
    <main className="mx-auto max-w-6xl p-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {products.map((p) => (
        <a
          key={p.id}
          href={`/${lang}/shop/${p.handle}`}
          className="rounded-2xl border border-neutral-200 p-4 shadow-sm hover:shadow-md transition"
        >
          {p.featuredImage && (
            <Image
              src={p.featuredImage.url}
              alt={p.featuredImage.altText ?? p.title}
              width={500}
              height={500}
              className="rounded-xl w-full aspect-square object-cover"
            />
          )}

          <h2 className="mt-4 text-lg font-medium">{p.title}</h2>

          <p className="text-sm text-neutral-600">
            {p.priceRange.minVariantPrice.amount}{" "}
            {p.priceRange.minVariantPrice.currencyCode}
          </p>
        </a>
      ))}
    </main>
  );
}
