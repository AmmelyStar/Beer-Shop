"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Lang = "en" | "uk" | "ru" | "et" | "fi";

// реальные ключи категорий = Shopify handles
type CategoryKey =
  | "all"
  | "beer"
  | "cider"
  | "snacks"
  | "gifts-sets"
  | "alcohol-free";

const CATEGORY_KEYS: CategoryKey[] = [
  "all",
  "beer",
  "cider",
  "snacks",
  "gifts-sets",
  "alcohol-free",
];

// Маппинг productType → категория
// на случай, если productCategory приходит как текст, а не handle
const PRODUCT_TYPE_TO_CATEGORY: Record<string, CategoryKey> = {
  beer: "beer",
  Beer: "beer",
  BEER: "beer",

  cider: "cider",
  Cider: "cider",
  CIDER: "cider",

  snacks: "snacks",
  Snacks: "snacks",

  "Gifts & Sets": "gifts-sets",
  gifts: "gifts-sets",

  "Alcohol-free": "alcohol-free",
  "alcohol-free": "alcohol-free",
  "Non-alcoholic": "alcohol-free",
  "NON-ALCOHOLIC": "alcohol-free",
};

export type BreadcrumbLabels = {
  home: string;
  shop: string;
  categories: Record<CategoryKey, string>;
};

interface BreadcrumbsProps {
  lang: Lang;
  labels: BreadcrumbLabels;
  currentLabel?: string;
  productCategory?: string;
  separator?: string;
}

export default function Breadcrumbs({
  lang,
  labels,
  currentLabel,
  productCategory,
  separator = "›",
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const items: { href: string; label: string }[] = [
    { href: `/${lang}`, label: labels.home },
  ];

  const parts = pathname.split("/").filter(Boolean);
  const afterLang = parts.slice(1);

  // ---------- SHOP PAGE ----------
  if (afterLang[0] === "shop") {
    items.push({ href: `/${lang}/shop`, label: labels.shop });

    const raw = (searchParams.get("category") ?? "all") as string;

    const category: CategoryKey =
      CATEGORY_KEYS.includes(raw as CategoryKey)
        ? (raw as CategoryKey)
        : "all";

    if (category !== "all") {
      items.push({
        href: `/${lang}/shop?category=${category}`,
        label: labels.categories[category],
      });
    }
  }

  // ---------- PRODUCT PAGE ----------
  if (afterLang[0] === "product") {
    items.push({ href: `/${lang}/shop`, label: labels.shop });

    if (productCategory) {
      let category: CategoryKey | null = null;

      // 1. пробуем найти по product type
      if (PRODUCT_TYPE_TO_CATEGORY[productCategory]) {
        category = PRODUCT_TYPE_TO_CATEGORY[productCategory];
      }

      // 2. пробуем интерпретировать productCategory как handle
      if (!category) {
        const lower = productCategory.toLowerCase();
        if (CATEGORY_KEYS.includes(lower as CategoryKey)) {
          category = lower as CategoryKey;
        }
      }

      if (category && category !== "all") {
        items.push({
          href: `/${lang}/shop?category=${category}`,
          label: labels.categories[category],
        });
      }
    }
  }

  // ---------- CURRENT PAGE ----------
  if (currentLabel) {
    items.push({ href: "#", label: currentLabel });
  }

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl pb-10">
      <ol role="list" className="flex items-center space-x-2">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${it.href}-${i}`} className="flex items-center">
              {i > 0 && (
                <span aria-hidden="true" className="mx-2 text-gray-400">
                  {separator}
                </span>
              )}
              {last ? (
                <span className="text-sm font-medium text-gray-300">
                  {it.label}
                </span>
              ) : (
                <Link
                  href={it.href}
                  className="text-sm font-medium text-gray-400 hover:text-white"
                >
                  {it.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
