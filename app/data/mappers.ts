// app/data/mappers.ts
import type { ProductNode, Metafield } from "./types";

type FlattenedVariant = {
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

export type FlattenedProduct = Omit<
  ProductNode,
  "metafields" | "collections" | "translations" | "variants"
> & {
  collections: string[];
  variantId: string;
  variants?: FlattenedVariant[];
  selectedOrFirstAvailableVariant?: FlattenedVariant;
  specs?: Partial<{
    abv: string;
    allergens: string;
    brand: string;
    country: string;
    gtin: string;
    ingredients: string;
    pack_size_l: string;
    pack_type: string;
    pairing: string;
    shelf_life_days: string;
    ibu: string;
    fg: string;
    tasted_best_with: string;
    bottle_in_boxes: string;
    style: string;
    ean: string;
    box_nr: string;
    description_extra: string;
  }>;
  shopify?: Partial<{
    "beer-style": string;
    "package-type": string;
    variantId: string;
  }>;
  trending?: boolean;
  rating?: number;
  reviewCount?: number;
};

function extractMetafieldValue(mf: Metafield): string | null {
  if (
    mf.type.includes("list.") &&
    mf.type.includes("reference") &&
    mf.references?.edges
  ) {
    const names: string[] = [];

    for (const edge of mf.references.edges) {
      const metaobject = edge.node;
      if (!metaobject?.fields) continue;

      const nameField = metaobject.fields.find(
        (f) => f.key === "name" || f.key === "title" || f.key === "value"
      );

      if (nameField?.value) {
        names.push(nameField.value);
      } else if (metaobject.handle) {
        names.push(metaobject.handle);
      }
    }

    return names.length > 0 ? names.join(", ") : null;
  }

  if (
    mf.type.includes("reference") &&
    !mf.type.includes("list.") &&
    mf.reference?.fields
  ) {
    const nameField = mf.reference.fields.find(
      (f) => f.key === "name" || f.key === "title" || f.key === "value"
    );

    if (nameField?.value) return nameField.value;
    if (mf.reference.handle) return mf.reference.handle;

    return null;
  }

  return mf.value;
}

function normalizeKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[\/\s-]+/g, "_")
    .replace(/__+/g, "_");
}

function normalizeValue(value: string): string {
  return value.trim();
}

function pickFirstValue(
  source: Record<string, string>,
  aliases: string[]
): string | undefined {
  for (const alias of aliases) {
    const normalizedAlias = normalizeKey(alias);
    const found = source[normalizedAlias];
    if (found !== undefined && found !== null && found !== "") {
      return found;
    }
  }
  return undefined;
}

function buildNormalizedGroup(
  source: Record<string, string>
): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(source)) {
    const normalizedKey = normalizeKey(key);
    normalized[normalizedKey] = normalizeValue(value);
  }

  return normalized;
}

function buildSpecsFromGroups(
  grouped: Record<string, Record<string, string>>
): FlattenedProduct["specs"] | undefined {
  const mergedRaw = {
    ...(grouped["specs"] ?? {}),
    ...(grouped["custom"] ?? {}),
    ...(grouped["product"] ?? {}),
  };

  const merged = buildNormalizedGroup(mergedRaw);

  const specs: FlattenedProduct["specs"] = {
    abv: pickFirstValue(merged, ["abv"]),
    allergens: pickFirstValue(merged, ["allergens", "allergen"]),
    brand: pickFirstValue(merged, ["brand"]),
    country: pickFirstValue(merged, ["country"]),
    gtin: pickFirstValue(merged, ["gtin"]),
    ingredients: pickFirstValue(merged, ["ingredients"]),
    pack_size_l: pickFirstValue(merged, [
      "pack_size_l",
      "pack size l",
      "pack size (l)",
      "volume",
      "size_l",
      "size",
    ]),
    pack_type: pickFirstValue(merged, [
      "pack_type",
      "pack type",
      "package_type",
      "package type",
    ]),
    pairing: pickFirstValue(merged, ["pairing"]),
    shelf_life_days: pickFirstValue(merged, [
      "shelf_life_days",
      "shelf life days",
      "shelf life/day",
      "shelf life/days",
      "shelf_life",
    ]),
    ibu: pickFirstValue(merged, ["ibu"]),
    fg: pickFirstValue(merged, ["fg"]),
    tasted_best_with: pickFirstValue(merged, [
      "tasted_best_with",
      "tastes_best_with",
      "best_with",
      "food_pairing",
      "tasted best with",
    ]),
    bottle_in_boxes: pickFirstValue(merged, [
      "bottle_in_boxes",
      "bottles_in_box",
      "bottles_in_boxes",
      "bottle_in_box",
      "bottle in the box",
      "bottle in box",
      "bottles in box",
    ]),
    style: pickFirstValue(merged, ["style", "beer_style", "beer style"]),
    ean: pickFirstValue(merged, ["ean"]),
    box_nr: pickFirstValue(merged, ["box_nr", "box no", "box number", "box #"]),
    description_extra: pickFirstValue(merged, [
      "description_extra",
      "extra_description",
      "description extra",
    ]),
  };

  const hasAnyValue = Object.values(specs).some(
    (value) => value !== undefined && value !== null && value !== ""
  );

  return hasAnyValue ? specs : undefined;
}

function buildShopifyGroup(
  grouped: Record<string, Record<string, string>>,
  variantId?: string
): FlattenedProduct["shopify"] | undefined {
  const raw = grouped["shopify"] ?? {};
  const normalized = buildNormalizedGroup(raw);

  const shopify: FlattenedProduct["shopify"] = {
    "beer-style": pickFirstValue(normalized, [
      "beer_style",
      "beer-style",
      "style",
    ]),
    "package-type": pickFirstValue(normalized, [
      "package_type",
      "package-type",
      "pack_type",
    ]),
    variantId,
  };

  const hasAnyValue = Object.values(shopify).some(
    (value) => value !== undefined && value !== null && value !== ""
  );

  return hasAnyValue ? shopify : undefined;
}

function flattenVariantNode(node: {
  id?: string;
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
}): FlattenedVariant | null {
  if (!node?.id) return null;

  return {
    id: node.id,
    title: node.title,
    availableForSale: node.availableForSale,
    quantityAvailable: node.quantityAvailable ?? null,
    price: node.price
      ? {
          amount: node.price.amount,
          currencyCode: node.price.currencyCode,
        }
      : undefined,
    compareAtPrice: node.compareAtPrice
      ? {
          amount: node.compareAtPrice.amount,
          currencyCode: node.compareAtPrice.currencyCode,
        }
      : null,
    selectedOptions: Array.isArray(node.selectedOptions)
      ? node.selectedOptions.map((option) => ({
          name: option.name,
          value: option.value,
        }))
      : [],
  };
}

function flattenVariants(product: ProductNode): FlattenedVariant[] {
  const edges = product.variants?.edges ?? [];

  return edges
    .map((edge) => flattenVariantNode(edge?.node))
    .filter((variant): variant is FlattenedVariant => Boolean(variant));
}

function flattenSelectedOrFirstAvailableVariant(
  product: ProductNode
): FlattenedVariant | undefined {
  const raw = (
    product as ProductNode & {
      selectedOrFirstAvailableVariant?: {
        id?: string;
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
    }
  ).selectedOrFirstAvailableVariant;

  const flattened = raw ? flattenVariantNode(raw) : null;
  if (flattened) return flattened;

  return flattenVariants(product)[0];
}

export function flattenMetafields(p: ProductNode): FlattenedProduct {
  const grouped: Record<string, Record<string, string>> = {};

  if (p.metafields) {
    for (const mf of p.metafields) {
      if (!mf) continue;

      const value = extractMetafieldValue(mf);
      if (!value) continue;

      if (!grouped[mf.namespace]) grouped[mf.namespace] = {};
      grouped[mf.namespace][mf.key] = value;
    }
  }

  const collections = p.collections?.edges?.map((e) => e.node.handle) || [];
  const variants = flattenVariants(p);
  const selectedOrFirstAvailableVariant = flattenSelectedOrFirstAvailableVariant(p);
  const firstVariantId =
    selectedOrFirstAvailableVariant?.id ?? variants[0]?.id ?? "";

  type ProductBase = Omit<
    ProductNode,
    "metafields" | "collections" | "translations" | "variants"
  >;

  const base: ProductBase = {
    ...(p as Omit<
      ProductNode,
      "metafields" | "collections" | "translations" | "variants"
    >),
  };

  const marketing = buildNormalizedGroup(grouped["marketing"] || {});

  return {
    ...base,
    collections,
    variants,
    selectedOrFirstAvailableVariant,
    variantId: firstVariantId,
    specs: buildSpecsFromGroups(grouped),
    shopify: buildShopifyGroup(grouped, firstVariantId),
    trending: marketing["trending"] === "true" || marketing["trending"] === "1",
  };
}

export function getMetafieldValue(
  product: FlattenedProduct,
  namespace: "specs" | "shopify",
  key: string
): string | undefined {
  const nsData = product[namespace];
  if (!nsData) return undefined;
  return nsData[key as keyof typeof nsData];
}

export function getBeerStyle(product: FlattenedProduct): string | undefined {
  return product.specs?.style || product.shopify?.["beer-style"];
}

export function getProductSpecs(product: FlattenedProduct): Array<{
  label: string;
  value: string;
}> {
  const specs: Array<{ label: string; value: string }> = [];

  if (product.specs) {
    const specsMap: Record<string, string> = {
      style: "Style",
      abv: "ABV",
      ibu: "IBU",
      fg: "FG",
      pack_size_l: "Volume",
      country: "Country",
      brand: "Brand",
      allergens: "Allergens",
      ingredients: "Ingredients",
      tasted_best_with: "Tasted best with",
      bottle_in_boxes: "Bottles in box",
      shelf_life_days: "Shelf life (days)",
      pack_type: "Pack type",
      ean: "EAN",
      box_nr: "Box number",
      description_extra: "Extra description",
    };

    for (const [key, label] of Object.entries(specsMap)) {
      const value = product.specs[key as keyof typeof product.specs];
      if (value) specs.push({ label, value });
    }
  }

  return specs;
}

export function flattenProducts(products: ProductNode[]): FlattenedProduct[] {
  return products.map((p) => flattenMetafields(p));
}