// app/lib/shop/categories.ts

export type CategoryKey =
  | "all"
  | "beer in bottles"
  | "Cider"
  | "energy drink"
  | "non-alcoholic beer"
  | "snacks"
  | "sparkling wine"
  | "Soft Drinks";

export const CATEGORY_KEYS: readonly CategoryKey[] = [
  "all",
  "beer in bottles",
  "Cider",
  "energy drink",
  "non-alcoholic beer",
  "snacks",
  "sparkling wine",
  "Soft Drinks",
] as const;

export function isCategoryKey(x: unknown): x is CategoryKey {
  return typeof x === "string" &&
    (CATEGORY_KEYS as readonly string[]).includes(x);
}
