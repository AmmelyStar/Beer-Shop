"use client";

import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "@heroicons/react/20/solid";
import { WineOff } from "lucide-react";

import AddToCartButton from "@/app/components/ui/AddToCartButton";

import type { FlattenedProduct } from "../data/mappers";
import type { Locale } from "@/app/[lang]/messages";
import type { ReviewSummary } from "@/app/lib/reviews/getReviewSummaryByHandle";

const classNames = (
  ...xs: Array<string | false | null | undefined>
) => xs.filter(Boolean).join(" ");

type CategoryKey =
  | "beer"
  | "cider"
  | "snacks"
  | "gifts-sets"
  | "alcohol-free";

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

type CardVariant =
  NonNullable<FlattenedProduct["variants"]>[number];

const EMPTY_SUMMARY: ReviewSummary = {
  average: 0,
  count: 0,
};

function getCardVariant(
  product: FlattenedProduct,
): CardVariant | undefined {
  const selected =
    product.selectedOrFirstAvailableVariant;

  if (
    selected &&
    selected.availableForSale !== false
  ) {
    return selected;
  }

  return (
    product.variants?.find(
      (variant) => variant.availableForSale,
    ) ??
    selected ??
    product.variants?.[0]
  );
}

function getVariantId(
  product: FlattenedProduct,
  cardVariant?: CardVariant,
): string | null {
  if (cardVariant?.id?.trim()) {
    return cardVariant.id;
  }

  if (product.variantId?.trim()) {
    return product.variantId;
  }

  const record =
    product as unknown as Record<string, unknown>;

  const candidates = [
    record.merchandiseId,
    record.selectedVariantId,
    record.firstVariantId,
    record.defaultVariantId,
    record.shopifyVariantId,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate;
    }
  }

  return null;
}

function normalizeNumber(
  value: unknown,
): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    const normalized = Number(
      value.replace(",", ".").trim(),
    );

    return Number.isNaN(normalized)
      ? null
      : normalized;
  }

  return null;
}

function trimTrailingZero(
  value: number,
): string {
  return Number.isInteger(value)
    ? String(value)
    : String(value);
}

function formatPrice(
  amount?: string | number | null,
  currencyCode?: string | null,
): string {
  if (
    amount === null ||
    amount === undefined ||
    amount === ""
  ) {
    return "—";
  }

  const number = normalizeNumber(amount);

  if (number === null) {
    return `${amount} ${currencyCode ?? "EUR"}`;
  }

  return `${number.toFixed(2)} ${
    currencyCode ?? "EUR"
  }`;
}

function formatWeight(
  weight: unknown,
): string | null {
  const number = normalizeNumber(weight);

  if (number !== null) {
    return `${trimTrailingZero(number)} g`;
  }

  if (typeof weight !== "string") {
    return null;
  }

  const trimmed = weight.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();

  if (normalized.endsWith("kg")) {
    return trimmed;
  }

  if (normalized.endsWith("g")) {
    const numberPart = trimmed
      .slice(0, -1)
      .trim();

    const parsed =
      normalizeNumber(numberPart);

    if (parsed !== null) {
      return `${trimTrailingZero(parsed)} g`;
    }

    return trimmed.replace(/g$/i, " g");
  }

  const parsed = normalizeNumber(trimmed);

  if (parsed !== null) {
    return `${trimTrailingZero(parsed)} g`;
  }

  return trimmed;
}

function formatVolume(
  volume: unknown,
): string | null {
  const number = normalizeNumber(volume);

  if (number !== null) {
    return `${trimTrailingZero(number)} L`;
  }

  if (typeof volume !== "string") {
    return null;
  }

  const trimmed = volume.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();

  if (normalized.endsWith("ml")) {
    const numberPart = trimmed
      .slice(0, -2)
      .trim();

    const parsed =
      normalizeNumber(numberPart);

    if (parsed !== null) {
      return `${trimTrailingZero(parsed)} ml`;
    }

    return trimmed;
  }

  if (normalized.endsWith("l")) {
    const numberPart = trimmed
      .slice(0, -1)
      .trim();

    const parsed =
      normalizeNumber(numberPart);

    if (parsed !== null) {
      return `${trimTrailingZero(parsed)} L`;
    }

    return trimmed.replace(/l$/i, " L");
  }

  const parsed = normalizeNumber(trimmed);

  if (parsed !== null) {
    return `${trimTrailingZero(parsed)} L`;
  }

  return trimmed;
}

function formatAlcohol(
  alcohol: unknown,
): string | null {
  const value = normalizeNumber(alcohol);

  if (value === null) {
    return null;
  }

  return `${trimTrailingZero(value)} %`;
}

function normalizeOptionName(
  name: string,
): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function getVariantOption(
  variant: CardVariant | undefined,
  aliases: string[],
): string | null {
  if (!variant?.selectedOptions?.length) {
    return null;
  }

  const normalizedAliases = aliases.map(
    normalizeOptionName,
  );

  const option = variant.selectedOptions.find(
    ({ name }) =>
      normalizedAliases.includes(
        normalizeOptionName(name),
      ),
  );

  return option?.value?.trim() || null;
}

function getVolumeFromVariantTitle(
  variant: CardVariant | undefined,
): string | null {
  if (!variant?.title) {
    return null;
  }

  const match = variant.title.match(
    /(\d+(?:[.,]\d+)?)\s*(ml|l)\b/i,
  );

  if (!match) {
    return null;
  }

  return `${match[1]} ${match[2]}`;
}

function getWeightFromVariantTitle(
  variant: CardVariant | undefined,
): string | null {
  if (!variant?.title) {
    return null;
  }

  const match = variant.title.match(
    /(\d+(?:[.,]\d+)?)\s*(g|kg)\b/i,
  );

  if (!match) {
    return null;
  }

  return `${match[1]} ${match[2]}`;
}

function getMetaLabel(
  product: FlattenedProduct,
  variant: CardVariant | undefined,
): string {
  const variantWeight =
    getVariantOption(variant, [
      "weight",
      "weight g",
      "weight (g)",
      "package weight",
    ]) ??
    getWeightFromVariantTitle(variant);

  const variantVolume =
    getVariantOption(variant, [
      "volume",
      "size",
      "pack size",
      "pack size l",
      "pack size (l)",
      "package size",
    ]) ??
    getVolumeFromVariantTitle(variant);

  const weight = formatWeight(
    variantWeight ??
      product.specs?.weight_g,
  );

  const volume = formatVolume(
    variantVolume ??
      product.specs?.pack_size_l,
  );

  const alcohol = formatAlcohol(
    product.specs?.abv,
  );

  if (weight) {
    return weight;
  }

  const parts: string[] = [];

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
      <h2 className="text-2xl tracking-tight text-white">
        {title}
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 xl:gap-8">
        {products.map((product) => {
          const image =
            product.featuredImage;

          const cardVariant =
            getCardVariant(product);

          const price =
            cardVariant?.price ??
            product.priceRange?.minVariantPrice;

          const alcoholNumber =
            normalizeNumber(
              product.specs?.abv,
            );

          const isAlcoholFree =
            alcoholNumber === 0;

          const meta = getMetaLabel(
            product,
            cardVariant,
          );

          const href =
            `/${lang}/product/${product.handle}` +
            (category
              ? `?category=${category}`
              : "");

          const summary =
            reviewSummaries?.[
              product.handle
            ] ?? EMPTY_SUMMARY;

          const rating = summary.average;
          const count = summary.count;

          const variantId = getVariantId(
            product,
            cardVariant,
          );

          const productForCart = variantId
            ? {
                ...product,
                variantId,
                selectedOrFirstAvailableVariant:
                  cardVariant ??
                  product.selectedOrFirstAvailableVariant,
              }
            : null;

          return (
            <div
              key={product.id}
              className="group flex h-full flex-col"
            >
              <Link
                href={href}
                className="block flex-1"
              >
                <div className="flex h-full flex-col">
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
                    {image?.url && (
                      <Image
                        src={image.url}
                        alt={
                          image.altText ??
                          product.title
                        }
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
                          {product.title}
                        </h3>

                        <p className="shrink-0 whitespace-nowrap text-base font-semibold text-white">
                          {formatPrice(
                            price?.amount,
                            price?.currencyCode,
                          )}
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
                        {[0, 1, 2, 3, 4].map(
                          (index) => (
                            <StarIcon
                              key={index}
                              className={classNames(
                                rating >=
                                  index + 1
                                  ? "text-yellow-400"
                                  : "text-gray-500",
                                "size-3",
                              )}
                            />
                          ),
                        )}
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
                  <AddToCartButton
                    product={productForCart}
                    label={add}
                  />
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-md border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-gray-500"
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