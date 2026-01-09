// app/lib/shop/categories.ts

export type CategoryKey =
  | "all"
  | "beer"
  | "cider"
  | "snacks"
  | "gifts-sets"
  | "alcohol-free";

export const CATEGORY_KEYS: readonly CategoryKey[] = [
  "all",
  "beer",
  "cider",
  "snacks",
  "gifts-sets",
  "alcohol-free",
] as const;

export function isCategoryKey(x: unknown): x is CategoryKey {
  return typeof x === "string" && (CATEGORY_KEYS as readonly string[]).includes(x);
}
