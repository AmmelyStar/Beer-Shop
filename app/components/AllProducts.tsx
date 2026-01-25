"use client";

import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@heroicons/react/20/solid";
import { WineOff } from "lucide-react";

import AddToCartButton from "@/app/components/ui/AddToCartButton";

import type { FlattenedProduct } from "../data/mappers";
import type { Locale } from "@/app/[lang]/messages";
import type { ReviewSummary } from "@/app/lib/reviews/getReviewSummaryByHandle";

const classNames = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

type CategoryKey = "beer" | "cider" | "snacks" | "gifts-sets" | "alcohol-free";

type AllProductsProps = {
  title: string;
  stars: string;
  reviews: string;
  add: string;
  alcohol: string;
  lang: Locale;
  products: FlattenedProduct[];
  category?: CategoryKey;
  reviewSummaries?: Record<string, ReviewSummary>;
};

const EMPTY_SUMMARY: ReviewSummary = { average: 0, count: 0 };

function getVariantId(p: FlattenedProduct): string | null {
  const rec = p as unknown as Record<string, unknown>;

  const direct = rec.variantId;
  if (typeof direct === "string" && direct.trim()) return direct;

  const candidates = [
    rec.merchandiseId,
    rec.selectedVariantId,
    rec.firstVariantId,
    rec.defaultVariantId,
    rec.shopifyVariantId,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }

  const variants = rec.variants;
  if (Array.isArray(variants) && variants[0]?.id) {
    return variants[0].id as string;
  }

  const selectedVariant = rec.selectedVariant as Record<string, unknown> | undefined;
  if (selectedVariant?.id && typeof selectedVariant.id === "string") {
    return selectedVariant.id;
  }

  return null;
}

export default function AllProducts({
  title,
  stars,
  reviews,
  add,
  alcohol,
  lang,
  products,
  category,
  reviewSummaries,
}: AllProductsProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 lg:max-w-7xl lg:px-8">
      <h2 className="text-2xl tracking-tight text-white">{title}</h2>

      <div className="mt-8 grid grid-cols-1 gap-y-16 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
        {products.map((p) => {
          const img = p.featuredImage;
          const price = p.priceRange?.minVariantPrice;

          const abvRaw = p.specs?.abv;
          const abvNum =
            abvRaw !== undefined && abvRaw !== "" ? Number(abvRaw) : null;
          const isAlcoholFree = abvNum === 0;

          const metaParts: string[] = [];
          if (abvNum !== null && !Number.isNaN(abvNum)) metaParts.push(`${abvNum} %`);
          if (p.specs?.pack_size_l) metaParts.push(`${p.specs.pack_size_l} L`);
          if (p.specs?.country) metaParts.push(p.specs.country);
          if (p.specs?.pack_type) metaParts.push(p.specs.pack_type);
          if (p.specs?.bottle_in_boxes)
            metaParts.push(`${p.specs.bottle_in_boxes} pcs/box`);

          const meta = metaParts.join(" • ");

          const href = `/${lang}/product/${p.handle}${
            category ? `?category=${category}` : ""
          }`;

          const summary = reviewSummaries?.[p.handle] ?? EMPTY_SUMMARY;
          const rating = summary.average;
          const count = summary.count;

          const variantId = getVariantId(p);
          const productForCart = variantId ? ({ ...p, variantId } as const) : null;

          return (
            <div key={p.id} className="group relative">
              <Link href={href} className="block">
                <div className="flex flex-col">
                  {/* IMAGE */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
                    {img?.url && (
                      <Image
                        src={img.url}
                        alt={img.altText ?? p.title}
                        fill
                        sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                        className="object-contain p-3 transform-gpu scale-105 transition-transform duration-300 group-hover:scale-110"
                      />
                    )}

                    {isAlcoholFree && (
                      <span
                        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-1 text-[10px] font-semibold uppercase text-white shadow-lg ring-1 ring-black/10"
                        aria-label={alcohol}
                      >
                        <WineOff className="h-3.5 w-3.5" />
                        {alcohol}
                      </span>
                    )}
                  </div>

                  {/* TITLE + PRICE */}
                  <div className="mt-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-yellow-400">
                        {p.title}
                      </h3>
                      {meta && <p className="text-sm text-gray-300">{meta}</p>}
                    </div>

                    <p className="text-lg font-semibold text-white">
                      {price ? `${price.amount} ${price.currencyCode}` : "—"}
                    </p>
                  </div>

                  {/* RATING */}
                  <div className="mt-3">
                    <span className="sr-only">
                      {rating} {stars}
                    </span>

                    <div className="flex">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <StarIcon
                          key={i}
                          className={classNames(
                            rating >= i + 1 ? "text-yellow-400" : "text-gray-500",
                            "size-3"
                          )}
                        />
                      ))}
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {count} {reviews}
                    </p>
                  </div>
                </div>
              </Link>

              {/* ADD TO CART */}
              <div className="mt-6">
                {productForCart ? (
                  <AddToCartButton product={productForCart} label={add} />
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center rounded-md border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-gray-500 cursor-not-allowed"
                  >
                    {add}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
