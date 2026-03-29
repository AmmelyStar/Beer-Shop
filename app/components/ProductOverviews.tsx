"use client";

// components/ProductOverviews.tsx
import { useMemo, useState } from "react";
import Image from "next/image";
import { StarIcon } from "@heroicons/react/20/solid";
import type { FlattenedProduct } from "../data/mappers";
import AddToCartButton from "./ui/AddToCartButton";

type ProductOverviewsProps = {
  product: FlattenedProduct;
  perUnit: string;
  abv: string;
  ibu: string;
  fg: string;
  country: string;
  brand: string;
  style: string;
  addToCart: string;
  reviews: string;
  outOf5Stars: string;
  viewAllReviews: string;
  leaveAReview: string;
  description: string;
  tastedBestWith: string;
  allergens: string;
  ingredients: string;
};

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function formatValue(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return null;

  const normalized = String(value).replace(",", ".").trim();
  const parsed = Number(normalized);

  if (!Number.isNaN(parsed)) {
    return Number.isInteger(parsed) ? String(parsed) : String(parsed);
  }

  return normalized;
}

function formatMeasure(
  value: string | number | null | undefined,
  unit: "L" | "g"
): string | null {
  if (value === null || value === undefined || value === "") return null;

  const normalized = String(value).replace(",", ".").trim();
  const lower = normalized.toLowerCase();

  if (
    lower.includes(" g") ||
    lower.endsWith("g") ||
    lower.includes(" l") ||
    lower.endsWith("l") ||
    lower.includes("ml") ||
    lower.includes("kg")
  ) {
    return normalized.replace(/\s+/g, " ");
  }

  const parsed = Number(normalized);
  if (!Number.isNaN(parsed)) {
    const clean = Number.isInteger(parsed) ? String(parsed) : String(parsed);
    return `${clean} ${unit}`;
  }

  return normalized;
}

type ProductWithVariantId = FlattenedProduct & {
  variantId: string;
};

type ProductVariant = {
  id: string;
  title?: string;
  availableForSale?: boolean;
  quantityAvailable?: number | null;
  price?: {
    amount?: string;
    currencyCode?: string;
  };
  compareAtPrice?: {
    amount?: string;
    currencyCode?: string;
  } | null;
  selectedOptions?: Array<{
    name: string;
    value: string;
  }>;
};

function hasVariantId(p: FlattenedProduct): p is ProductWithVariantId {
  return typeof (p as { variantId?: unknown }).variantId === "string";
}

function normalizeVariants(product: FlattenedProduct): ProductVariant[] {
  const rawVariants = (product as { variants?: unknown }).variants;

  if (!rawVariants) return [];

  if (Array.isArray(rawVariants)) {
    return rawVariants.filter(
      (variant): variant is ProductVariant =>
        typeof variant === "object" && variant !== null && "id" in variant
    );
  }

  const edges = (rawVariants as { edges?: Array<{ node?: ProductVariant }> }).edges;

  if (Array.isArray(edges)) {
    return edges
      .map((edge) => edge?.node)
      .filter((variant): variant is ProductVariant => Boolean(variant?.id));
  }

  return [];
}

function getSelectedOrFirstAvailableVariant(product: FlattenedProduct): ProductVariant | null {
  const selectedOrFirst = (product as { selectedOrFirstAvailableVariant?: unknown })
    .selectedOrFirstAvailableVariant;

  if (
    selectedOrFirst &&
    typeof selectedOrFirst === "object" &&
    "id" in selectedOrFirst &&
    typeof (selectedOrFirst as { id?: unknown }).id === "string"
  ) {
    return selectedOrFirst as ProductVariant;
  }

  const variants = normalizeVariants(product);
  return variants[0] ?? null;
}

function getVariantId(product: FlattenedProduct): string | null {
  if (hasVariantId(product)) return product.variantId;

  const selectedOrFirst = getSelectedOrFirstAvailableVariant(product);
  if (selectedOrFirst?.id) return selectedOrFirst.id;

  const shopifyVariantId =
    typeof (product as { shopify?: { variantId?: unknown } }).shopify?.variantId ===
    "string"
      ? (product as { shopify?: { variantId?: string } }).shopify!.variantId!
      : null;

  if (shopifyVariantId) return shopifyVariantId;

  const variants = normalizeVariants(product);
  return variants[0]?.id ?? null;
}

function getVolumeOption(variant?: ProductVariant | null): string | null {
  if (!variant?.selectedOptions?.length) return null;

  const volumeOption = variant.selectedOptions.find((option) =>
    ["volume", "size", "litre", "liter", "liters", "litres"].includes(
      option.name.trim().toLowerCase()
    )
  );

  return volumeOption?.value ?? null;
}

function getDisplaySize(product: FlattenedProduct, variant?: ProductVariant | null): string | null {
  const variantVolume = getVolumeOption(variant);
  if (variantVolume) {
    return formatMeasure(variantVolume, "L");
  }

  const productPackSize = product.specs?.pack_size_l;
  if (productPackSize) {
    return formatMeasure(productPackSize, "L");
  }

  const productWeight = (product.specs as { weight_g?: string } | undefined)?.weight_g;
  if (productWeight) {
    return formatMeasure(productWeight, "g");
  }

  return null;
}

function formatPrice(amount?: string | null) {
  if (!amount) return "0.00";

  const parsed = Number.parseFloat(amount);
  if (Number.isNaN(parsed)) return "0.00";

  return parsed.toFixed(2);
}

function getDefaultVariant(product: FlattenedProduct, variants: ProductVariant[]) {
  const selectedOrFirst = getSelectedOrFirstAvailableVariant(product);
  if (selectedOrFirst?.id) {
    const exact = variants.find((variant) => variant.id === selectedOrFirst.id);
    if (exact) return exact;
  }

  const variantId = getVariantId(product);
  if (variantId) {
    const exact = variants.find((variant) => variant.id === variantId);
    if (exact) return exact;
  }

  return variants[0] ?? null;
}

export default function ProductOverviews({
  product,
  perUnit,
  ibu,
  fg,
  country,
  brand,
  style,
  addToCart,
  reviews,
  outOf5Stars,
  viewAllReviews,
  leaveAReview,
  description,
  tastedBestWith,
  allergens,
  ingredients,
}: ProductOverviewsProps) {
  const variants = useMemo(() => normalizeVariants(product), [product]);
  const defaultVariant = useMemo(() => getDefaultVariant(product, variants), [product, variants]);

  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVariant?.id ?? "");

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ?? defaultVariant;

  const rawPrice =
    selectedVariant?.price?.amount ?? product.priceRange?.minVariantPrice?.amount ?? null;
  const price = formatPrice(rawPrice);

  const displaySize = getDisplaySize(product, selectedVariant);

  const productAbv = formatValue(product.specs?.abv);
  const productIbu = formatValue(product.specs?.ibu);
  const productFg = formatValue(product.specs?.fg);
  const productCountry = product.specs?.country;
  const productBrand = product.specs?.brand;
  const productStyle = product.specs?.style || product.shopify?.["beer-style"];
  const productAllergens = product.specs?.allergens;
  const productIngredients = product.specs?.ingredients;
  const productTastedBestWith = product.specs?.tasted_best_with;
  const productBottleInBoxes = formatValue(product.specs?.bottle_in_boxes);
  const productPackType = product.specs?.pack_type;
  const productShelfLifeDays = formatValue(product.specs?.shelf_life_days);

  const images =
    product.images?.edges.map((edge, index) => ({
      id: index + 1,
      imageSrc: edge.node.url,
      imageAlt: edge.node.altText || product.title,
      primary: index === 0,
    })) || [];

  const rating = product.rating ?? 0;
  const reviewCount = product.reviewCount ?? 0;

  const tastedBestWithList = productTastedBestWith
    ? productTastedBestWith
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const volumeOptions = useMemo(() => {
    const mapped = variants
      .map((variant) => {
        const label = getVolumeOption(variant) || variant.title || "";

        if (!label || label === "Default Title") return null;

        return {
          id: variant.id,
          label,
          availableForSale: variant.availableForSale ?? true,
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        label: string;
        availableForSale: boolean;
      }>;

    const unique = mapped.filter(
      (option, index, arr) =>
        arr.findIndex((item) => item.label === option.label) === index
    );

    return unique;
  }, [variants]);

  const selectedVariantIdForCart = selectedVariant?.id ?? getVariantId(product);
  const productForCart: ProductWithVariantId | null = selectedVariantIdForCart
    ? { ...product, variantId: selectedVariantIdForCart }
    : null;

  return (
    <div>
      <div className="pb-16 pt-6 sm:pb-24">
        <div className="mx-auto mt-8 max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
          <div className="lg:grid lg:auto-rows-min lg:grid-cols-12 lg:gap-x-8">
            <div className="lg:col-span-5 lg:col-start-8">
              <div className="flex justify-between items-start gap-10">
                <div className="min-w-0">
                  <h1 className="max-w-md text-3xl font-semibold tracking-tight text-yellow-400">
                    {product.title}
                  </h1>
                </div>

                <div className="flex flex-col items-end text-right">
                  <span className="whitespace-nowrap text-2xl font-medium text-white">
                    {price} €
                  </span>
                  <span className="whitespace-nowrap text-base text-gray-300">
                    {perUnit}
                  </span>
                </div>
              </div>

              {volumeOptions.length > 1 && (
                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold text-white">Volume</p>
                  <div className="flex flex-wrap gap-3">
                    {volumeOptions.map((option) => {
                      const isActive = selectedVariant?.id === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedVariantId(option.id)}
                          disabled={!option.availableForSale}
                          className={classNames(
                            "rounded-md border px-4 py-2 text-sm transition",
                            isActive
                              ? "border-yellow-400 bg-yellow-400 text-black"
                              : "border-gray-600 text-white hover:border-yellow-400",
                            !option.availableForSale && "cursor-not-allowed opacity-50"
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {(productIbu || productFg) && (
                <div className="mt-10 flex w-full flex-wrap items-center justify-start gap-5">
                  {productIbu && (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="whitespace-nowrap text-lg font-semibold text-white">
                          {ibu}:
                        </span>
                        <span className="text-base text-gray-300">{productIbu}</span>
                      </div>
                      {productFg && <span className="text-gray-500">|</span>}
                    </>
                  )}

                  {productFg && (
                    <div className="flex items-baseline gap-2">
                      <span className="whitespace-nowrap text-lg font-semibold text-white">
                        {fg}:
                      </span>
                      <span className="text-base text-gray-300">{productFg}°</span>
                    </div>
                  )}
                </div>
              )}

              {productCountry && (
                <div className="mt-4 flex w-full items-baseline gap-2">
                  <span className="whitespace-nowrap text-lg font-semibold text-white">
                    {country}:
                  </span>
                  <span className="text-base text-gray-300">{productCountry}</span>
                </div>
              )}

              {productBrand && (
                <div className="mt-2 flex w-full items-baseline gap-2">
                  <span className="whitespace-nowrap text-lg font-semibold text-white">
                    {brand}:
                  </span>
                  <span className="text-base text-gray-300">{productBrand}</span>
                </div>
              )}

              {productStyle && (
                <div className="mt-2 flex w-full items-baseline gap-2">
                  <span className="whitespace-nowrap text-lg font-semibold text-white">
                    {style}:
                  </span>
                  <span className="text-base text-gray-300">{productStyle}</span>
                </div>
              )}

              {(displaySize || productAbv || productPackType || productBottleInBoxes || productShelfLifeDays) && (
                <div className="mt-4 space-y-1">
                  {displaySize && (
                    <div className="flex w-full items-baseline gap-2">
                      <span className="whitespace-nowrap text-sm font-semibold text-white">
                        Size:
                      </span>
                      <span className="text-sm text-gray-300">{displaySize}</span>
                    </div>
                  )}

                  {productAbv && (
                    <div className="flex w-full items-baseline gap-2">
                      <span className="whitespace-nowrap text-sm font-semibold text-white">
                        Alcohol:
                      </span>
                      <span className="text-sm text-gray-300">{productAbv}% alc.</span>
                    </div>
                  )}

                  {productPackType && (
                    <div className="flex w-full items-baseline gap-2">
                      <span className="whitespace-nowrap text-sm font-semibold text-white">
                        Pack type:
                      </span>
                      <span className="text-sm text-gray-300">{productPackType}</span>
                    </div>
                  )}

                  {productBottleInBoxes && (
                    <div className="flex w-full items-baseline gap-2">
                      <span className="whitespace-nowrap text-sm font-semibold text-white">
                        Bottles in box:
                      </span>
                      <span className="text-sm text-gray-300">{productBottleInBoxes}</span>
                    </div>
                  )}

                  {productShelfLifeDays && (
                    <div className="flex w-full items-baseline gap-2">
                      <span className="whitespace-nowrap text-sm font-semibold text-white">
                        Shelf life:
                      </span>
                      <span className="text-sm text-gray-300">
                        {productShelfLifeDays} days
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10">
                <h2 className="sr-only">{reviews}</h2>
                <button className="flex w-full items-center justify-between transition-opacity hover:opacity-80">
                  <div className="flex items-center">
                    <div className="mr-2 flex items-center">
                      {[0, 1, 2, 3, 4].map((ratingValue) => (
                        <StarIcon
                          key={ratingValue}
                          aria-hidden="true"
                          className={classNames(
                            rating > ratingValue ? "text-yellow-400" : "text-gray-500",
                            "size-5 shrink-0"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {rating}
                      <span className="sr-only">{outOf5Stars}</span>
                    </p>
                  </div>

                  <span className="text-sm font-medium text-gray-400 transition-colors hover:text-yellow-500">
                    {reviewCount > 0 ? viewAllReviews : leaveAReview}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-8 lg:col-span-7 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:-mt-6">
              <div className="group grid grid-cols-1 rounded-lg bg-white p-6 lg:grid-cols-2 lg:gap-8">
                {images.length > 0 ? (
                  images.map((image) => (
                    <div
                      key={image.id}
                      className={classNames(
                        image.primary ? "lg:col-span-2 lg:row-span-2" : "hidden lg:block",
                        "relative aspect-square w-full overflow-hidden rounded-lg bg-white transition-colors duration-300"
                      )}
                    >
                      <Image
                        alt={image.imageAlt}
                        src={image.imageSrc}
                        fill
                        sizes="(min-width:1024px) 50vw, 100vw"
                        className="object-contain object-center"
                        priority={image.primary}
                      />
                    </div>
                  ))
                ) : (
                  <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-white lg:col-span-2 lg:row-span-2">
                    <p className="text-gray-500">No images available</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-16 lg:col-span-5">
              {productForCart ? (
                <AddToCartButton product={productForCart} label={addToCart} />
              ) : (
                <div className="mt-8 text-sm text-red-300">
                  Missing variantId — cannot add this product to cart.
                </div>
              )}

              {product.descriptionHtml && (
                <div className="mt-10">
                  <h2 className="mx-auto mt-6 max-w-lg text-lg font-semibold text-white">
                    {description}
                  </h2>

                  <div
                    dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                    className="mx-auto mt-6 max-w-xl text-pretty text-base text-gray-300"
                  />
                </div>
              )}

              {tastedBestWithList.length > 0 && (
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <h2 className="mx-auto mt-6 max-w-lg text-pretty text-lg font-semibold text-white">
                    {tastedBestWith}
                  </h2>
                  <div className="mt-4">
                    <ul
                      role="list"
                      className="list-disc space-y-1 pl-5 text-sm text-gray-300 marker:text-gray-300"
                    >
                      {tastedBestWithList.map((item, index) => (
                        <li key={index} className="pl-2 text-base">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {productAllergens && (
                <div className="mt-6 flex w-full items-baseline gap-2">
                  <span className="whitespace-nowrap text-lg font-semibold text-white">
                    {allergens}:
                  </span>
                  <span className="text-base text-gray-300">{productAllergens}</span>
                </div>
              )}

              {productIngredients && (
                <div className="mt-6 flex w-full items-baseline gap-2">
                  <span className="whitespace-nowrap text-lg font-semibold text-white">
                    {ingredients}:
                  </span>
                  <span className="text-base text-gray-300">{productIngredients}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}