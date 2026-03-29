// app/lib/shop/categories.ts

export type CategoryKey =
  | "all"
  | "bottle-beer"
  | "draft-beer"
  | "cider"
  | "energy-drinks"
  | "non-alcoholic-beer"
  | "snacks"
  | "sparkling-wine"
  | "soft-drinks";

export const CATEGORY_KEYS: readonly CategoryKey[] = [
  "all",
  "bottle-beer",
  "draft-beer",
  "cider",
  "energy-drinks",
  "non-alcoholic-beer",
  "snacks",
  "sparkling-wine",
  "soft-drinks",
] as const;

export function isCategoryKey(x: unknown): x is CategoryKey {
  return typeof x === "string" && (CATEGORY_KEYS as readonly string[]).includes(x);
}

export const CATEGORY_TO_COLLECTION_HANDLE: Record<
  Exclude<CategoryKey, "all">,
  string
> = {
  "bottle-beer": "bottle-beer",
  "draft-beer": "draft-beer",
  "cider": "cider",
  "energy-drinks": "energy-drinks",
  "non-alcoholic-beer": "non-alcoholic-beer",
  "snacks": "snacks",
  "sparkling-wine": "sparkling-wine",
  "soft-drinks": "soft-drinks",
};