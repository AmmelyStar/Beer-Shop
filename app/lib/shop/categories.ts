// app/lib/shop/categories.ts

export type CategoryKey =
  | "all"
  | "beer in bottles"
  | "Draft Beer"
  | "Cider"
  | "energy drink"
  | "non-alcoholic beer"
  | "snacks"
  | "sparkling wine"
  | "Soft Drinks";

export const CATEGORY_KEYS: readonly CategoryKey[] = [
  "all",
  "beer in bottles",
  "Draft Beer",
  "Cider",
  "energy drink",
  "non-alcoholic beer",
  "snacks",
  "sparkling wine",
  "Soft Drinks",
] as const;

export function isCategoryKey(x: unknown): x is CategoryKey {
  return typeof x === "string" && (CATEGORY_KEYS as readonly string[]).includes(x);
}

/**
 * Shopify collection handles (URL slugs) for each tab category.
 * IMPORTANT: these must match EXACT handles in Shopify Admin → Products → Collections.
 */
export const CATEGORY_TO_COLLECTION_HANDLE: Record<
  Exclude<CategoryKey, "all">,
  string
> = {
  "beer in bottles": "bottle-beer",
  "Draft Beer": "draft-beer",
  "Cider": "cider",
  "energy drink": "energy-drink",
  "non-alcoholic beer": "non-alcoholic-beer",
  "snacks": "snacks",
  "sparkling wine": "sparkling-wine",
  "Soft Drinks": "soft-drinks",
};
