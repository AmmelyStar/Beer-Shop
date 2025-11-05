// app/[lang]/shop/page.tsx
import Image from "next/image";
import { unstable_noStore as noStore } from "next/cache";
import { shopifyRequest } from "../../lib/shopify";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// ───────────────── Types ─────────────────
type Variant = {
  id: string;
  title: string;
  sku: string | null;
  barcode: string | null;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
  selectedOptions: { name: string; value: string }[];
  weight: number | null;
  weightUnit: "GRAMS" | "KILOGRAMS" | "OUNCES" | "POUNDS" | null;
};

type ImageNode = { url: string; altText: string | null };
type MetaField = { value: string } | null;

type ProductNode = {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  tags: string[];
  description: string;
  descriptionHtml: string;
  featuredImage: ImageNode | null;
  images: { edges: { node: ImageNode }[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: { edges: { node: Variant }[] };
  updatedAt: string;

  // Метаполя (namespace/key см. Settings → Custom data → Products)
  tastedBestWith?: MetaField;
  packType?: MetaField;
  shelfLifeDays?: MetaField;
  country?: MetaField;
  ingredients?: MetaField;
  allergens?: MetaField;
  bottleInBoxes?: MetaField;
};

type ShopifyProductsResponse = {
  products: { edges: { node: ProductNode }[] };
};

// ─────────────── Helpers ───────────────
function truncate2(n: number) {
  return Math.floor(n * 100) / 100;
}

function calcDisplayPrice(amountStr: string) {
  const amount = Number(amountStr);
  if (Number.isNaN(amount)) return 0;
  const normalized = amount >= 1000 ? amount / 1000 : amount;
  return truncate2(normalized);
}

function htmlToPlain(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function toLiters(w: number, unit: Variant["weightUnit"]) {
  let liters = w;
  switch (unit) {
    case "GRAMS":
      liters = w / 1000;
      break;
    case "KILOGRAMS":
      liters = w;
      break;
    case "OUNCES":
      liters = w * 0.02835;
      break;
    case "POUNDS":
      liters = w * 0.4536;
      break;
    default:
      liters = w;
  }
  return liters.toFixed(1).replace(".", ",") + " L";
}

// ─────────────── Page ───────────────
export default async function ShopPage(props: { params: Promise<{ lang: string }> }) {
  // В Next 16 params — Promise → ждём
  const { lang } = await props.params;

  // Жёстко выключаем кэш рендера на эту страницу
  noStore();

  const query = `
    query GetProducts {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            vendor
            tags
            description
            descriptionHtml
            updatedAt

            # Метаполя
            tastedBestWith: metafield(namespace: "custom", key: "tasted_best_with") { value }
            packType:       metafield(namespace: "custom", key: "pack_type") { value }
            shelfLifeDays:  metafield(namespace: "custom", key: "shelf_life_days") { value }
            country:        metafield(namespace: "custom", key: "country") { value }
            ingredients:    metafield(namespace: "custom", key: "ingredients") { value }
            allergens:      metafield(namespace: "custom", key: "allergens") { value }
            bottleInBoxes:  metafield(namespace: "custom", key: "bottle_in_boxes") { value }

            featuredImage { url altText }
            images(first: 1) { edges { node { url altText } } }
            priceRange { minVariantPrice { amount currencyCode } }
            variants(first: 5) {
              edges {
                node {
                  id
                  title
                  sku
                  barcode
                  availableForSale
                  price { amount currencyCode }
                  compareAtPrice { amount currencyCode }
                  selectedOptions { name value }
                  weight
                  weightUnit
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyRequest<ShopifyProductsResponse>(query, {}, { revalidate: 0 });
  const products = (data.products?.edges ?? []).map((e) => e.node);

  return (
    <main className="mx-auto max-w-6xl p-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
      {products.map((p) => {
        const newestImg = p.images.edges[0]?.node ?? null;
        const img = p.featuredImage ?? newestImg;

        // Cache-buster по updatedAt
        const cb = p.updatedAt ? `cb=${encodeURIComponent(p.updatedAt)}` : "";
        const imgUrl =
          img?.url &&
          (cb ? (img.url.includes("?") ? `${img.url}&${cb}` : `${img.url}?${cb}`) : img.url);

        const min = p.priceRange.minVariantPrice;
        const displayPrice = calcDisplayPrice(min.amount);
        const priceFmt = new Intl.NumberFormat(lang, {
          style: "currency",
          currency: min.currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(displayPrice);

        const firstVariant = p.variants.edges[0]?.node;

        return (
          <a
            key={p.id}
            href={`/${lang}/shop/${p.handle}`}
            className="rounded-2xl border border-neutral-200 p-4 shadow-sm hover:shadow-md transition"
          >
            {imgUrl && (
              <Image
                src={imgUrl}
                alt={img?.altText ?? p.title}
                width={500}
                height={500}
                className="rounded-xl w-full aspect-square object-cover"
              />
            )}

            <h2 className="mt-4 text-lg font-medium">{p.title}</h2>
            <p className="text-xs text-neutral-500">{p.vendor}</p>

            <p className="mt-1 text-sm text-neutral-800 font-semibold">{priceFmt}</p>

            {firstVariant?.weight != null && firstVariant?.weightUnit && (
              <p className="text-xs text-neutral-400">
                {toLiters(firstVariant.weight, firstVariant.weightUnit)}
              </p>
            )}

            {p.descriptionHtml && (
              <p className="mt-2 text-xs text-neutral-500 line-clamp-2">
                {htmlToPlain(p.descriptionHtml)}
              </p>
            )}

            {/* Метаполя */}
            {p.tastedBestWith?.value && (
              <p className="text-[11px] text-neutral-500 mt-1">
                🍽️ Tastes best with: {p.tastedBestWith.value}
              </p>
            )}
            {p.packType?.value && (
              <p className="text-[11px] text-neutral-500">Pack type: {p.packType.value}</p>
            )}
            {p.shelfLifeDays?.value && (
              <p className="text-[11px] text-neutral-500">Shelf life: {p.shelfLifeDays.value} days</p>
            )}
            {p.country?.value && (
              <p className="text-[11px] text-neutral-500">Country: {p.country.value}</p>
            )}
            {p.ingredients?.value && (
              <p className="text-[11px] text-neutral-500">Ingredients: {p.ingredients.value}</p>
            )}
            {p.allergens?.value && (
              <p className="text-[11px] text-neutral-500">⚠️ Allergens: {p.allergens.value}</p>
            )}
            {p.bottleInBoxes?.value && (
              <p className="text-[11px] text-neutral-500">Bottle in boxes: {p.bottleInBoxes.value}</p>
            )}
          </a>
        );
      })}
    </main>
  );
}
