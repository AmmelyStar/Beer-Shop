// app/data/mappers.ts
import type { ProductNode, Metafield } from "./types";

export type FlattenedProduct = Omit<
  ProductNode,
  "metafields" | "collections" | "translations"
> & {
  collections: string[];
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
  }>;
  shopify?: Partial<{
    "beer-style": string;
    "package-type": string;
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
      if (nameField?.value) names.push(nameField.value);
      else if (metaobject.handle) names.push(metaobject.handle);
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

/** Преобразует ProductNode в плоскую структуру FlattenedProduct */
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

  type ProductBase = Omit<
    ProductNode,
    "metafields" | "collections" | "translations"
  >;
  const base: ProductBase = {
    ...(p as ProductBase),
  };

  const marketing = grouped["marketing"] || {};

  return {
    ...base,
    collections,
    specs: grouped["specs"] as FlattenedProduct["specs"],
    shopify: grouped["shopify"] as FlattenedProduct["shopify"],
    // Shopify хранит boolean как строку "true"/"false"/"1"
    trending: marketing["trending"] === "true" || marketing["trending"] === "1",
  };
}

/** Утилита, если где-то нужно достать одно поле из specs или shopify */
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
  return product.shopify?.["beer-style"];
}

export function getProductSpecs(product: FlattenedProduct): Array<{
  label: string;
  value: string;
}> {
  const specs: Array<{ label: string; value: string }> = [];

  if (product.specs) {
    const specsMap: Record<string, string> = {
      abv: "ABV",
      ibu: "IBU",
      fg: "FG",
      pack_size_l: "Volume",
      country: "Country",
      brand: "Brand",
      allergens: "Allergens",
      pairing: "Pairing",
      ingredients: "Ingredients",
    };

    for (const [key, label] of Object.entries(specsMap)) {
      const value = product.specs[key as keyof typeof product.specs];
      if (value) specs.push({ label, value });
    }
  }

  const beerStyle = getBeerStyle(product);
  if (beerStyle) specs.unshift({ label: "Style", value: beerStyle });

  return specs;
}

export function flattenProducts(products: ProductNode[]): FlattenedProduct[] {
  return products.map((p) => flattenMetafields(p));
}
