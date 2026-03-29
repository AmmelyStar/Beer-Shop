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

  const selectedVariant = rec.selectedVariant as
    | Record<string, unknown>
    | undefined;

  if (selectedVariant?.id && typeof selectedVariant.id === "string") {
    return selectedVariant.id;
  }

  return null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = Number(value.replace(",", ".").trim());
    return Number.isNaN(normalized) ? null : normalized;
  }

  return null;
}

function formatPrice(
  amount?: string | number | null,
  currencyCode?: string | null
) {
  if (amount == null || amount === "") return "—";

  const n = normalizeNumber(amount);

  if (n === null) {
    return `${amount} ${currencyCode ?? "EUR"}`;
  }

  return `${n.toFixed(2)} ${currencyCode ?? "EUR"}`;
}

function trimTrailingZero(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function formatWeight(weight: unknown): string | null {
  const n = normalizeNumber(weight);
  if (n !== null) {
    return `${trimTrailingZero(n)} g`;
  }

  if (typeof weight === "string") {
    const trimmed = weight.trim();
    if (!trimmed) return null;

    const normalized = trimmed.toLowerCase();

    if (normalized.endsWith("g")) {
      const numberPart = trimmed.slice(0, -1).trim();
      const parsed = normalizeNumber(numberPart);
      if (parsed !== null) {
        return `${trimTrailingZero(parsed)} g`;
      }
      return trimmed.replace(/g$/i, " g");
    }

    if (normalized.endsWith("kg")) {
      return trimmed;
    }

    const parsed = normalizeNumber(trimmed);
    if (parsed !== null) {
      return `${trimTrailingZero(parsed)} g`;
    }
  }

  return null;
}

function formatVolume(volume: unknown): string | null {
  const n = normalizeNumber(volume);
  if (n !== null) {
    return `${trimTrailingZero(n)} L`;
  }

  if (typeof volume === "string") {
    const trimmed = volume.trim();
    if (!trimmed) return null;

    const normalized = trimmed.toLowerCase();

    if (normalized.endsWith("l")) {
      const numberPart = trimmed.slice(0, -1).trim();
      const parsed = normalizeNumber(numberPart);
      if (parsed !== null) {
        return `${trimTrailingZero(parsed)} L`;
      }
      return trimmed.replace(/l$/i, " L");
    }

    const parsed = normalizeNumber(trimmed);
    if (parsed !== null) {
      return `${trimTrailingZero(parsed)} L`;
    }
  }

  return null;
}

function formatAlcohol(abv: unknown): string | null {
  const value = normalizeNumber(abv);
  if (value === null) return null;

  return `${trimTrailingZero(value)} %`;
}

function getMetaLabel(p: FlattenedProduct): string {
  const parts: string[] = [];

  const weight = formatWeight(p.specs?.weight_g);
  const volume = formatVolume(p.specs?.pack_size_l);
  const alcohol = formatAlcohol(p.specs?.abv);

  if (weight) {
    parts.push(weight);
    return parts.join(" • ");
  }

  if (volume) {
    parts.push(volume);
  }

  if (alcohol) {
    parts.push(alcohol);
  }

  return parts.join(" • ");
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

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:gap-8">
        {products.map((p) => {
          const img = p.featuredImage;
          const price = p.priceRange?.minVariantPrice;

          const abvNum = normalizeNumber(p.specs?.abv);
          const isAlcoholFree = abvNum === 0;

          const meta = getMetaLabel(p);

          const href = `/${lang}/product/${p.handle}${
            category ? `?category=${category}` : ""
          }`;

          const summary = reviewSummaries?.[p.handle] ?? EMPTY_SUMMARY;
          const rating = summary.average;
          const count = summary.count;

          const variantId = getVariantId(p);
          const productForCart = variantId ? ({ ...p, variantId } as const) : null;

          return (
            <div key={p.id} className="group flex h-full flex-col">
              <Link href={href} className="block flex-1">
                <div className="flex h-full flex-col">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
                    {img?.url && (
                      <Image
                        src={img.url}
                        alt={img.altText ?? p.title}
                        fill
                        sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
                        className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
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

                  <div className="mt-4 flex flex-1 flex-col">
                    <div className="min-h-[96px]">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 min-h-[56px] text-base font-medium leading-7 text-yellow-400">
                          {p.title}
                        </h3>

                        <p className="shrink-0 whitespace-nowrap text-base font-semibold text-white">
                          {formatPrice(price?.amount, price?.currencyCode)}
                        </p>
                      </div>

                      <p className="mt-1 min-h-[20px] text-sm text-gray-300">
                        {meta || "\u00A0"}
                      </p>
                    </div>

                    <div className="mt-3 min-h-[38px]">
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
                </div>
              </Link>

              <div className="mt-4">
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